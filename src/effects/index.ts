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

// Re-export legato
export { applyLegato } from './legato';
export type { LegatoOptions } from './legato';

// Re-export voice allocation
export { applyVoiceAllocation } from './voiceAllocation';
export type { VoiceAllocationOptions } from './voiceAllocation';

// Re-export widgets
export { EffectCard } from './EffectCard';
export { NoteSkipWidget } from './NoteSkipWidget';
export { StutterWidget } from './StutterWidget';
export { VelocityHumanizeWidget } from './VelocityHumanizeWidget';
export { DecayWidget } from './DecayWidget';
export { HarmonicStackWidget } from './HarmonicStackWidget';
export { BreathPatternWidget } from './BreathPatternWidget';
export { LegatoWidget } from './LegatoWidget';
export { VoiceAllocationWidget } from './VoiceAllocationWidget';

// Effects registry
import { Effect } from './types';
import { applyBreathPattern, BreathPatternOptions } from './breathPattern';
import { applyNoteSkip, NoteSkipOptions } from './noteSkip';
import { applyPointillistDecay, PointillistDecayOptions } from './pointillistDecay';
import { applyHarmonicStack, HarmonicStackOptions } from './harmonicStack';
import { applyStutter, StutterOptions } from './stutter';
import { applyVelocityHumanize, VelocityHumanizeOptions } from './velocityHumanize';
import { applyLegato, LegatoOptions } from './legato';
import { applyVoiceAllocation, VoiceAllocationOptions } from './voiceAllocation';

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
  {
    name: 'Legato',
    apply: (notes, options) => applyLegato(notes, options as Partial<LegatoOptions>),
  },
  {
    name: 'Voice Allocation',
    apply: (notes, options) => applyVoiceAllocation(notes, options as Partial<VoiceAllocationOptions>),
  },
];
