import { useState, useRef, useCallback } from 'react';

const LEVEL_SAMPLE_MS = 50;
const LOW_SIGNAL_PEAK_THRESHOLD = 0.015;
const LOW_SIGNAL_ACTIVITY_THRESHOLD = 0.08;
const SPEECH_LEVEL_THRESHOLD = 0.035;

export type RecordingIssue =
  | 'low_signal'
  | 'long_preamble'
  | 'long_trailing_silence'
  | 'possible_noise'
  | null;

export interface RecordingMetrics {
  durationMs: number;
  averageLevel: number;
  peakLevel: number;
  activityRatio: number;
  speechStartMs: number | null;
  speechEndMs: number | null;
  leadingSilenceMs: number;
  trailingSilenceMs: number;
  likelyIssue: RecordingIssue;
}

export interface RecordingResult {
  blob: Blob;
  objectUrl: string | null;
  mimeType: string;
  metrics: RecordingMetrics | null;
}

function revokeObjectUrl(url: string | null) {
  if (url && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

function measureLevel(buffer: Uint8Array) {
  let sum = 0;

  for (let index = 0; index < buffer.length; index += 1) {
    const sample = (buffer[index] - 128) / 128;
    sum += sample * sample;
  }

  return Math.sqrt(sum / buffer.length);
}

function buildRecordingMetrics(
  samples: Array<{ elapsedMs: number; level: number }>,
  durationMs: number,
): RecordingMetrics {
  const safeDuration = Math.max(durationMs, 0);

  if (samples.length === 0) {
    return {
      durationMs: safeDuration,
      averageLevel: 0,
      peakLevel: 0,
      activityRatio: 0,
      speechStartMs: null,
      speechEndMs: null,
      leadingSilenceMs: safeDuration,
      trailingSilenceMs: safeDuration,
      likelyIssue: 'low_signal',
    };
  }

  const totalLevel = samples.reduce((sum, sample) => sum + sample.level, 0);
  const peakLevel = samples.reduce((peak, sample) => Math.max(peak, sample.level), 0);
  const activeSamples = samples.filter((sample) => sample.level >= SPEECH_LEVEL_THRESHOLD);
  const speechStartMs = activeSamples[0]?.elapsedMs ?? null;
  const speechEndMs = activeSamples[activeSamples.length - 1]?.elapsedMs ?? null;
  const leadingSilenceMs = speechStartMs ?? safeDuration;
  const trailingSilenceMs = speechEndMs == null ? safeDuration : Math.max(safeDuration - speechEndMs, 0);
  const averageLevel = totalLevel / samples.length;
  const activityRatio = activeSamples.length / samples.length;

  let likelyIssue: RecordingIssue = null;
  if (
    peakLevel < LOW_SIGNAL_PEAK_THRESHOLD ||
    activityRatio < LOW_SIGNAL_ACTIVITY_THRESHOLD ||
    speechStartMs == null
  ) {
    likelyIssue = 'low_signal';
  } else if (speechStartMs > safeDuration * 0.45) {
    likelyIssue = 'long_preamble';
  } else if (trailingSilenceMs > safeDuration * 0.45) {
    likelyIssue = 'long_trailing_silence';
  } else if (averageLevel > 0.06 && activityRatio > 0.95 && peakLevel / Math.max(averageLevel, 0.001) < 1.6) {
    likelyIssue = 'possible_noise';
  }

  return {
    durationMs: safeDuration,
    averageLevel,
    peakLevel,
    activityRatio,
    speechStartMs,
    speechEndMs,
    leadingSilenceMs,
    trailingSilenceMs,
    likelyIssue,
  };
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sampleTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplesRef = useRef<Array<{ elapsedMs: number; level: number }>>([]);
  const recordingStartedAtRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupAnalysis = useCallback(async () => {
    if (sampleTimerRef.current != null) {
      window.clearInterval(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }

    analyserRef.current?.disconnect();
    analyserRef.current = null;

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Ignore cleanup failures.
      }
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    revokeObjectUrl(objectUrlRef.current);
    objectUrlRef.current = null;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    });

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const audioContext = AudioContextCtor ? new AudioContextCtor() : null;
    const analyser = audioContext ? audioContext.createAnalyser() : null;

    if (audioContext && analyser) {
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
    }

    const waveform = analyser ? new Uint8Array(analyser.fftSize) : null;

    chunksRef.current = [];
    samplesRef.current = [];
    recordingStartedAtRef.current = performance.now();
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current = mediaRecorder;
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;
    streamRef.current = stream;

    await audioContext?.resume();

    if (analyser && waveform) {
      sampleTimerRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(waveform);
        samplesRef.current.push({
          elapsedMs: performance.now() - recordingStartedAtRef.current,
          level: measureLevel(waveform),
        });
      }, LEVEL_SAMPLE_MS);
    }

    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        resolve({
          blob: new Blob(),
          objectUrl: null,
          mimeType: 'audio/webm',
          metrics: null,
        });
        return;
      }

      mediaRecorder.onstop = async () => {
        const durationMs = performance.now() - recordingStartedAtRef.current;
        const mimeType = chunksRef.current[0]?.type || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const objectUrl = blob.size > 0 && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(blob)
          : null;
        const metrics = analyserRef.current ? buildRecordingMetrics(samplesRef.current, durationMs) : null;

        objectUrlRef.current = objectUrl;

        await cleanupAnalysis();

        (streamRef.current ?? mediaRecorder.stream).getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        resolve({
          blob,
          objectUrl,
          mimeType: blob.type || mimeType,
          metrics,
        });
      };

      mediaRecorder.stop();
    });
  }, [cleanupAnalysis]);

  return { isRecording, startRecording, stopRecording };
}
