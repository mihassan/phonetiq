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

const createAudio: AudioFactory = (src?: string) => new Audio(src);

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

  try {
    await first.play();
    first.onended = () => {
      setTimeout(() => {
        second.play().catch(() => {});
      }, gapMs);
    };
  } catch {
    // Keep behavior non-blocking if playback fails.
  }
}
