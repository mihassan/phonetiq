import { useState, useRef, useCallback } from 'react';

const LEVEL_SAMPLE_MS = 50;
const LOW_SIGNAL_PEAK_THRESHOLD = 0.015;
const LOW_SIGNAL_ACTIVITY_THRESHOLD = 0.08;
const SPEECH_LEVEL_THRESHOLD = 0.035;
const NOISE_FLOOR_MULTIPLIER = 1.6;
const SPEECH_START_PADDING_MS = 200;
const SPEECH_END_PADDING_MS = 300;
const MIN_SPEECH_WINDOW_MS = 600;
const RECORDER_CHUNK_TIMESLICE_MS = 100;
const MIC_WARMUP_MS = 500;
const RECORDER_READY_TIMEOUT_MS = 1500;

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

export interface SpeechWindow {
  startMs: number;
  endMs: number;
}

export async function waitForRecorderReadiness(
  recorderReadyPromise: Promise<void>,
  options: {
    warmupMs?: number;
    readyTimeoutMs?: number;
  } = {},
) {
  const warmupMs = options.warmupMs ?? MIC_WARMUP_MS;
  const readyTimeoutMs = options.readyTimeoutMs ?? RECORDER_READY_TIMEOUT_MS;

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, warmupMs);
  });

  await Promise.race([
    recorderReadyPromise,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, readyTimeoutMs);
    }),
  ]);
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

function getNoiseFloor(samples: Array<{ elapsedMs: number; level: number }>) {
  const levels = samples.map((sample) => sample.level).sort((a, b) => a - b);
  const percentileIndex = Math.min(
    levels.length - 1,
    Math.max(0, Math.floor((levels.length - 1) * 0.2)),
  );

  return levels[percentileIndex] ?? 0;
}

export function buildRecordingMetrics(
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
  const noiseFloor = getNoiseFloor(samples);
  const speechThreshold = Math.max(SPEECH_LEVEL_THRESHOLD, noiseFloor * NOISE_FLOOR_MULTIPLIER);
  const activeSamples = samples.filter((sample) => sample.level >= speechThreshold);
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
  } else if (averageLevel > 0.06 && activityRatio > 0.75 && peakLevel / Math.max(averageLevel, 0.001) < 1.6) {
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

export function getSpeechWindow(metrics: RecordingMetrics | null): SpeechWindow | null {
  if (metrics?.speechStartMs == null || metrics.speechEndMs == null) {
    return null;
  }

  const startMs = Math.max(0, metrics.speechStartMs - SPEECH_START_PADDING_MS);
  const endMs = Math.min(
    metrics.durationMs,
    Math.max(
      metrics.speechEndMs + SPEECH_END_PADDING_MS,
      startMs + MIN_SPEECH_WINDOW_MS,
    ),
  );

  if (endMs <= startMs) {
    return null;
  }

  return { startMs, endMs };
}

export function trimChunksToWindow(
  chunks: Blob[],
  speechWindow: SpeechWindow | null,
  durationMs: number,
) {
  if (!speechWindow || chunks.length < 2 || durationMs <= 0) {
    return chunks;
  }

  const chunkDurationMs = durationMs / chunks.length;
  const startIndex = Math.max(0, Math.floor(speechWindow.startMs / chunkDurationMs));
  const endIndex = Math.min(chunks.length, Math.ceil(speechWindow.endMs / chunkDurationMs));

  return endIndex > startIndex ? chunks.slice(startIndex, endIndex) : chunks;
}

const TARGET_SAMPLE_RATE = 16_000;
const HPF_CUTOFF_HZ = 80;
const TARGET_DBFS = -18;

export function resampleMonoLinear(
  monoSamples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return monoSamples;
  const inLen = monoSamples.length;
  const outLen = Math.ceil((inLen * toRate) / fromRate);
  const out = new Float32Array(outLen);
  const ratio = (inLen - 1) / Math.max(outLen - 1, 1);
  for (let i = 0; i < outLen; i += 1) {
    const src = i * ratio;
    const lo = Math.floor(src);
    const hi = Math.min(lo + 1, inLen - 1);
    const frac = src - lo;
    out[i] = (monoSamples[lo] ?? 0) * (1 - frac) + (monoSamples[hi] ?? 0) * frac;
  }
  return out;
}

export function applyHighPassFilter(
  samples: Float32Array,
  sampleRate: number,
  cutoffHz: number,
): Float32Array {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  const out = new Float32Array(samples.length);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const x = samples[i] ?? 0;
    out[i] = alpha * (prevOut + x - prevIn);
    prevIn = x;
    prevOut = out[i] ?? 0;
  }
  return out;
}

export function normalizeLoudness(samples: Float32Array, targetDbfs: number): Float32Array {
  const targetRms = Math.pow(10, targetDbfs / 20);
  let sumSq = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sumSq += (samples[i] ?? 0) * (samples[i] ?? 0);
  }
  const currentRms = Math.sqrt(sumSq / Math.max(samples.length, 1));
  const gain = currentRms > 1e-6 ? targetRms / currentRms : 1;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = Math.max(-1, Math.min(1, (samples[i] ?? 0) * gain));
  }
  return out;
}

function encodeWavSegment(audioBuffer: AudioBuffer, speechWindow: SpeechWindow) {
  const startFrame = Math.max(0, Math.floor((speechWindow.startMs / 1000) * audioBuffer.sampleRate));
  const endFrame = Math.min(
    audioBuffer.length,
    Math.ceil((speechWindow.endMs / 1000) * audioBuffer.sampleRate),
  );
  const frameCount = Math.max(0, endFrame - startFrame);
  const channelCount = audioBuffer.numberOfChannels;
  const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));

  const monoSource = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    let mixed = 0;
    for (let ch = 0; ch < channelCount; ch += 1) {
      mixed += channels[ch][startFrame + frame] ?? 0;
    }
    monoSource[frame] = mixed / Math.max(channelCount, 1);
  }

  const resampled = resampleMonoLinear(monoSource, audioBuffer.sampleRate, TARGET_SAMPLE_RATE);
  const outputSampleRate = audioBuffer.sampleRate === TARGET_SAMPLE_RATE
    ? audioBuffer.sampleRate
    : TARGET_SAMPLE_RATE;
  const filtered = applyHighPassFilter(resampled, outputSampleRate, HPF_CUTOFF_HZ);
  const processed = normalizeLoudness(filtered, TARGET_DBFS);

  const pcmBytes = processed.length * 2;
  const wavBuffer = new ArrayBuffer(44 + pcmBytes);
  const view = new DataView(wavBuffer);

  const writeAscii = (off: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(off + i, value.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, outputSampleRate, true);
  view.setUint32(28, outputSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, pcmBytes, true);

  let offset = 44;
  for (let i = 0; i < processed.length; i += 1) {
    const s = processed[i] ?? 0;
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

export async function trimBlobToSpeechWindow(blob: Blob, speechWindow: SpeechWindow) {
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  const decodeContext = new AudioContextCtor();

  try {
    const encoded = await blob.arrayBuffer();
    const decoded = await decodeContext.decodeAudioData(encoded.slice(0));
    return encodeWavSegment(decoded, speechWindow);
  } catch {
    return null;
  } finally {
    try {
      await decodeContext.close();
    } catch {
      // Ignore decode-context cleanup failures.
    }
  }
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
  const recordingReadyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveRecordingReadyRef = useRef<(() => void) | null>(null);

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
    recordingReadyPromiseRef.current = new Promise((resolve) => {
      resolveRecordingReadyRef.current = resolve;
    });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        resolveRecordingReadyRef.current?.();
        resolveRecordingReadyRef.current = null;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;
    streamRef.current = stream;

    await audioContext?.resume();

    if (analyser && waveform) {
      sampleTimerRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(waveform);
        samplesRef.current.push({ elapsedMs: performance.now() - recordingStartedAtRef.current, level: measureLevel(waveform) });
      }, LEVEL_SAMPLE_MS);
    }

    mediaRecorder.start(RECORDER_CHUNK_TIMESLICE_MS);

    await waitForRecorderReadiness(recordingReadyPromiseRef.current, {
      warmupMs: MIC_WARMUP_MS,
      readyTimeoutMs: RECORDER_READY_TIMEOUT_MS,
    });

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
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        const metrics = analyserRef.current ? buildRecordingMetrics(samplesRef.current, durationMs) : null;
        const speechWindow = getSpeechWindow(metrics);
        const fallbackChunks = trimChunksToWindow(chunksRef.current, speechWindow, durationMs);
        const fallbackBlob = fallbackChunks.length !== chunksRef.current.length
          ? new Blob(fallbackChunks, { type: mimeType })
          : rawBlob;
        const trimmedBlob = speechWindow ? await trimBlobToSpeechWindow(rawBlob, speechWindow) : null;
        const blob = trimmedBlob ?? fallbackBlob;
        const objectUrl = blob.size > 0 && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(blob)
          : null;

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
