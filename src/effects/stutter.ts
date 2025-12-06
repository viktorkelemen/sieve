import { Note } from './types';

export interface StutterOptions {
  repetitions: number;    // 2-8, number of times to repeat each note
  velocityDecay: number;  // 0.5-1.0, velocity multiplier per repetition
  gapRatio: number;       // 0-0.5, gap between reps as ratio of rep duration
}

const defaultOptions: StutterOptions = {
  repetitions: 3,
  velocityDecay: 0.85,
  gapRatio: 0.1,
};

/**
 * Stutter/Ratchet Effect
 *
 * Replaces each note with rapid repetitions, creating machine-gun textures
 * characteristic of trance buildups and Lorenzo Senni's pointillistic style.
 * Each repetition has decreasing velocity for a natural roll/decay feel.
 */
export function applyStutter(
  notes: Note[],
  options: Partial<StutterOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { repetitions, velocityDecay, gapRatio } = opts;

  // Validate: if repetitions is 1 or less, return unchanged
  if (repetitions <= 1) return notes;

  const result: Note[] = [];

  for (const note of notes) {
    // Calculate timing for each repetition
    // Total duration is divided among repetitions + gaps
    const repDuration = note.duration / (repetitions + (repetitions - 1) * gapRatio);
    const gap = repDuration * gapRatio;
    const step = repDuration + gap;

    let velocity = note.velocity;

    for (let i = 0; i < repetitions; i++) {
      result.push({
        midi: note.midi,
        time: note.time + i * step,
        duration: repDuration,
        velocity: Math.max(velocity, 0.01), // Floor to prevent silent notes
      });
      velocity *= velocityDecay;
    }
  }

  // Sort by time to maintain proper playback order
  return result.sort((a, b) => a.time - b.time);
}
