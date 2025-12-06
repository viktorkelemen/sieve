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

// Re-export stutter
export { applyStutter } from './stutter';
export type { StutterOptions } from './stutter';

// Re-export velocity humanize
export { applyVelocityHumanize } from './velocityHumanize';
export type { VelocityHumanizeOptions } from './velocityHumanize';

// Effects registry
import { Effect } from './types';
import { applyBreathPattern, BreathPatternOptions } from './breathPattern';
import { applyNoteSkip, NoteSkipOptions } from './noteSkip';
import { applyPointillistDecay, PointillistDecayOptions } from './pointillistDecay';
import { applyHarmonicStack, HarmonicStackOptions } from './harmonicStack';
import { applyStutter, StutterOptions } from './stutter';
import { applyVelocityHumanize, VelocityHumanizeOptions } from './velocityHumanize';

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
  {
    name: 'Stutter',
    apply: (notes, options) => applyStutter(notes, options as Partial<StutterOptions>),
  },
  {
    name: 'Velocity Humanize',
    apply: (notes, options) => applyVelocityHumanize(notes, options as Partial<VelocityHumanizeOptions>),
  },
];
