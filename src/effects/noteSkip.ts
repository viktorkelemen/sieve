import { Note } from './types';

export interface NoteSkipOptions {
  play: number;    // Number of notes to play
  skip: number;    // Number of notes to skip
  offset: number;  // Which note to start from (0, 1, 2...)
}

const defaultOptions: NoteSkipOptions = {
  play: 1,
  skip: 1,
  offset: 0,
};

/**
 * Note Skip Effect
 *
 * Uses a play:skip ratio pattern. E.g., play=2, skip=1 means
 * play 2 notes, skip 1, play 2, skip 1, etc.
 * Useful for thinning out busy arps or creating polyrhythmic feels.
 */
export function applyNoteSkip(
  notes: Note[],
  options: Partial<NoteSkipOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { play, skip, offset } = opts;

  // If skip is 0 or play is 0, return notes unchanged
  if (skip <= 0 || play <= 0) return notes;

  const cycleLength = play + skip;

  // Sort by time to ensure consistent ordering
  const sorted = [...notes].sort((a, b) => a.time - b.time);

  return sorted.filter((_, index) => {
    // Use modulo that handles negative offsets correctly
    const adjustedIndex = ((index + offset) % cycleLength + cycleLength) % cycleLength;
    return adjustedIndex < play;
  });
}
