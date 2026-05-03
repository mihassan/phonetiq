import { describe, it, expect } from 'vitest';
import { resampleMonoLinear, applyHighPassFilter, normalizeLoudness } from './useAudioRecorder';

function rms(samples: Float32Array): number {
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) sumSq += (samples[i] ?? 0) ** 2;
  return Math.sqrt(sumSq / Math.max(samples.length, 1));
}

function dcOffset(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] ?? 0;
  return sum / Math.max(samples.length, 1);
}

describe('resampleMonoLinear (F5)', () => {
  it('returns same array reference when rates are equal', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    const out = resampleMonoLinear(input, 16_000, 16_000);
    expect(out).toBe(input);
  });

  it('downsamples 48kHz to 16kHz yielding ~1/3 the length', () => {
    const input = new Float32Array(48_000).fill(0.5);
    const out = resampleMonoLinear(input, 48_000, 16_000);
    expect(out.length).toBeGreaterThanOrEqual(15_990);
    expect(out.length).toBeLessThanOrEqual(16_010);
  });

  it('downsamples 44.1kHz to 16kHz yielding ~36% length reduction', () => {
    const input = new Float32Array(44_100).fill(0.3);
    const out = resampleMonoLinear(input, 44_100, 16_000);
    const expectedLen = Math.ceil(44_100 * 16_000 / 44_100);
    expect(out.length).toBeCloseTo(expectedLen, -1);
  });

  it('preserves constant value across linear interpolation', () => {
    const input = new Float32Array(48_000).fill(0.6);
    const out = resampleMonoLinear(input, 48_000, 16_000);
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeCloseTo(0.6, 5);
    }
  });

  it('handles single-sample input without throwing', () => {
    const input = new Float32Array([0.5]);
    expect(() => resampleMonoLinear(input, 48_000, 16_000)).not.toThrow();
  });
});

describe('applyHighPassFilter (F4)', () => {
  it('attenuates a pure DC signal to near-zero', () => {
    const len = 16_000;
    const dc = new Float32Array(len).fill(0.5);
    const out = applyHighPassFilter(dc, 16_000, 80);
    const tail = out.slice(Math.floor(len * 0.9));
    expect(Math.abs(dcOffset(tail))).toBeLessThan(0.01);
  });

  it('passes a 1kHz sine mostly intact (< 3dB attenuation)', () => {
    const sampleRate = 16_000;
    const freq = 1_000;
    const len = sampleRate;
    const sine = new Float32Array(len);
    for (let i = 0; i < len; i++) sine[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    const out = applyHighPassFilter(sine, sampleRate, 80);
    const inRms = rms(sine);
    const outRms = rms(out.slice(Math.floor(len * 0.05)));
    expect(outRms).toBeGreaterThan(inRms * 0.7);
  });

  it('returns same length array as input', () => {
    const input = new Float32Array(1000).fill(0.1);
    const out = applyHighPassFilter(input, 16_000, 80);
    expect(out.length).toBe(input.length);
  });

  it('handles empty array without throwing', () => {
    expect(() => applyHighPassFilter(new Float32Array(0), 16_000, 80)).not.toThrow();
  });
});

describe('normalizeLoudness (F3)', () => {
  it('raises quiet signal to near −18 dBFS RMS', () => {
    const quiet = new Float32Array(16_000).fill(0.001);
    const out = normalizeLoudness(quiet, -18);
    const outDbfs = 20 * Math.log10(rms(out));
    expect(outDbfs).toBeCloseTo(-18, 1);
  });

  it('lowers loud signal to near −18 dBFS RMS', () => {
    const loud = new Float32Array(16_000).fill(0.9);
    const out = normalizeLoudness(loud, -18);
    const outDbfs = 20 * Math.log10(rms(out));
    expect(outDbfs).toBeCloseTo(-18, 1);
  });

  it('clips normalized samples to [−1, 1]', () => {
    const full = new Float32Array(16_000).fill(1.0);
    const out = normalizeLoudness(full, -3);
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeGreaterThanOrEqual(-1);
      expect(out[i]).toBeLessThanOrEqual(1);
    }
  });

  it('leaves near-silent signal unchanged (gain capped at 1 to avoid blown-up noise)', () => {
    const silent = new Float32Array(16_000).fill(0);
    const out = normalizeLoudness(silent, -18);
    expect(rms(out)).toBeCloseTo(0, 10);
  });

  it('returns same length array as input', () => {
    const input = new Float32Array(500).fill(0.3);
    const out = normalizeLoudness(input, -18);
    expect(out.length).toBe(input.length);
  });
});
