type AudioFactory = (src?: string) => HTMLAudioElement;

interface PlayWordAudioOptions {
  reuseAudio?: HTMLAudioElement | null;
  onPlayStateChange?: (isPlaying: boolean) => void;
  factory?: AudioFactory;
}

interface PlayPairAudioOptions {
  gapMs?: number;
  factory?: AudioFactory;
}

interface PairPlaybackController {
  stop: () => void;
}

const createAudio: AudioFactory = (src?: string) => new Audio(src);
let activePairPlayback: PairPlaybackController | null = null;

function stopAudio(audio: HTMLAudioElement) {
  audio.onended = null;

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Ignore non-fatal pause/reset errors.
  }
}

export function playWordAudio(url: string, options: PlayWordAudioOptions = {}) {
  const audio = options.reuseAudio ?? options.factory?.() ?? createAudio();

  audio.src = url;
  audio.onplay = () => options.onPlayStateChange?.(true);
  audio.onended = () => options.onPlayStateChange?.(false);
  audio.onerror = () => options.onPlayStateChange?.(false);

  audio.play().catch(() => options.onPlayStateChange?.(false));

  return audio;
}

export async function playPairAudio(
  firstUrl: string,
  secondUrl: string,
  options: PlayPairAudioOptions = {},
) {
  const gapMs = options.gapMs ?? 600;
  const factory = options.factory ?? createAudio;

  const first = factory(firstUrl);
  const second = factory(secondUrl);
  let cancelled = false;
  let secondTimer: ReturnType<typeof setTimeout> | null = null;

  const controller: PairPlaybackController = {
    stop: () => {
      cancelled = true;
      if (secondTimer) {
        clearTimeout(secondTimer);
        secondTimer = null;
      }
      stopAudio(first);
      stopAudio(second);

      if (activePairPlayback === controller) {
        activePairPlayback = null;
      }
    },
  };

  activePairPlayback?.stop();
  activePairPlayback = controller;

  try {
    await first.play();
    if (cancelled) return;

    first.onended = () => {
      if (cancelled) return;

      secondTimer = setTimeout(() => {
        if (cancelled) return;
        second.play().catch(() => {});
      }, gapMs);
    };
  } catch {
    // Keep behavior non-blocking if playback fails.
    if (activePairPlayback === controller) {
      activePairPlayback = null;
    }
  }
}
