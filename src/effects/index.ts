// Re-export types
export type { Note, Effect } from './types';

// Re-export breath pattern
export { applyBreathPattern } from './breathPattern';
export type { BreathPatternOptions } from './breathPattern';

// Re-export note skip
export { applyNoteSkip } from './noteSkip';
export type { NoteSkipOptions } from './noteSkip';

// Effects registry
import { Effect } from './types';
import { applyBreathPattern, BreathPatternOptions } from './breathPattern';
import { applyNoteSkip, NoteSkipOptions } from './noteSkip';

export const effects: Effect[] = [
  {
    name: 'Breath Pattern',
    apply: (notes, options) => applyBreathPattern(notes, options as Partial<BreathPatternOptions>),
  },
  {
    name: 'Note Skip',
    apply: (notes, options) => applyNoteSkip(notes, options as Partial<NoteSkipOptions>),
  },
];
