import { Note } from './types';

export interface LegatoOptions {
  overlap: number;  // Overlap amount in milliseconds (0 = notes touch exactly)
  maxGap: number;   // Only apply legato if gap is smaller than this (in seconds)
}

const defaultOptions: LegatoOptions = {
  overlap: 20,   // 20ms overlap by default
  maxGap: 0.5,   // Only connect notes within 500ms
};

/**
 * Legato Effect
 *
 * Extends note durations to connect smoothly with the next note.
 * - Different pitches: creates overlap to trigger portamento on synths
 * - Same pitch: merges consecutive notes into one (avoids retriggering)
 *
 * Only connects notes when the gap is within maxGap threshold.
 */
export function applyLegato(
  notes: Note[],
  options: Partial<LegatoOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { overlap, maxGap } = opts;

  if (notes.length < 2) return notes;

  // Sort by time
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const overlapSeconds = overlap / 1000;

  const result: Note[] = [];
  let i = 0;

  while (i < sorted.length) {
    let note = { ...sorted[i] };
    let j = i + 1;

    // Look ahead and merge same-pitch notes within maxGap
    while (j < sorted.length) {
      const nextNote = sorted[j];
      const noteEnd = note.time + note.duration;
      const gap = nextNote.time - noteEnd;

      // Stop if gap too large or notes already overlap
      if (gap > maxGap || gap < 0) break;

      // Same pitch: merge into current note
      if (nextNote.midi === note.midi) {
        const mergedEnd = nextNote.time + nextNote.duration;
        note = {
          ...note,
          duration: mergedEnd - note.time,
          velocity: Math.max(note.velocity, nextNote.velocity),
        };
        j++;
      } else {
        // Different pitch: extend with overlap and stop merging
        note = {
          ...note,
          duration: (nextNote.time - note.time) + overlapSeconds,
        };
        break;
      }
    }

    result.push(note);
    i = j;
  }

  return result;
}
