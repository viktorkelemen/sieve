// Re-export types
export type { Note, Effect } from './types';

// Re-export breath pattern
export { applyBreathPattern } from './breathPattern';
export type { BreathPatternOptions } from './breathPattern';

// Re-export note skip
export { applyNoteSkip } from './noteSkip';
export type { NoteSkipOptions } from './noteSkip';

// Re-export pointillist decay
export { applyPointillistDecay } from './pointillistDecay';
export type { PointillistDecayOptions } from './pointillistDecay';

// Re-export harmonic stack
export { applyHarmonicStack } from './harmonicStack';
export type { HarmonicStackOptions, HarmonicStackMode } from './harmonicStack';

// Effects registry
import { Effect } from './types';
import { applyBreathPattern, BreathPatternOptions } from './breathPattern';
import { applyNoteSkip, NoteSkipOptions } from './noteSkip';
import { applyPointillistDecay, PointillistDecayOptions } from './pointillistDecay';
import { applyHarmonicStack, HarmonicStackOptions } from './harmonicStack';

export const effects: Effect[] = [
  {
    name: 'Breath Pattern',
    apply: (notes, options) => applyBreathPattern(notes, options as Partial<BreathPatternOptions>),
  },
  {
    name: 'Note Skip',
    apply: (notes, options) => applyNoteSkip(notes, options as Partial<NoteSkipOptions>),
  },
  {
    name: 'Pointillist Decay',
    apply: (notes, options) => applyPointillistDecay(notes, options as Partial<PointillistDecayOptions>),
  },
  {
    name: 'Harmonic Stack',
    apply: (notes, options) => applyHarmonicStack(notes, options as Partial<HarmonicStackOptions>),
  },
];
