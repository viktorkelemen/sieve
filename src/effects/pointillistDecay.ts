import { Note } from './types';

export interface PointillistDecayOptions {
  decayFactor: number;   // 0.01-1.0, multiplier for note duration
  minDuration: number;   // Minimum duration in seconds (floor)
}

const defaultOptions: PointillistDecayOptions = {
  decayFactor: 0.5,
  minDuration: 0.01,  // 10ms minimum
};

/**
 * Pointillist Decay Effect
 *
 * Inspired by Lorenzo Senni's "pointillistic trance" style.
 * Shortens note durations to create percussive, staccato articulations.
 * At extreme settings (0.05-0.15), arps become rapid pointillist stabs,
 * letting the synth's release envelope create the characteristic sound.
 */
export function applyPointillistDecay(
  notes: Note[],
  options: Partial<PointillistDecayOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { decayFactor, minDuration } = opts;

  // If decay factor is 1 or invalid, return unchanged
  if (decayFactor >= 1 || decayFactor <= 0) return notes;

  return notes.map(note => ({
    ...note,
    duration: Math.max(note.duration * decayFactor, minDuration),
  }));
}
