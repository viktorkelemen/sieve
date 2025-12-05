import { Note } from './types';

export type HarmonicStackMode = 'detune' | 'octave' | 'fifth' | 'powerChord';

export interface HarmonicStackOptions {
  mode: HarmonicStackMode;
  detuneSpread: number;      // Cents spread for detune mode (0-50)
  velocityScale: number;     // Velocity multiplier for stacked notes (0-1)
}

const defaultOptions: HarmonicStackOptions = {
  mode: 'octave',
  detuneSpread: 12,
  velocityScale: 0.8,
};

// Interval definitions in semitones for each mode
const modeIntervals: Record<HarmonicStackMode, number[]> = {
  detune: [],        // Handled specially with cents
  octave: [12],      // One octave up
  fifth: [7],        // Perfect fifth
  powerChord: [7, 12], // Fifth + octave (power chord)
};

// Detune layers in cents (simulates supersaw detuning)
const detuneCents = [-1, -0.5, 0.5, 1]; // Multiplied by detuneSpread

/**
 * Harmonic Stack Effect
 *
 * Duplicates notes at pitch offsets to simulate supersaw layering
 * or create parallel harmonies. Inspired by the JP-8000's Supersaw
 * which uses 7 detuned oscillators.
 *
 * Modes:
 * - detune: Small cent offsets for thickness (supersaw simulation)
 * - octave: Double notes one octave up
 * - fifth: Add perfect fifth harmony
 * - powerChord: Add fifth + octave (root-fifth-octave stack)
 */
export function applyHarmonicStack(
  notes: Note[],
  options: Partial<HarmonicStackOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { mode, detuneSpread, velocityScale } = opts;

  if (notes.length === 0) return notes;

  const result: Note[] = [];

  for (const note of notes) {
    // Always include the original note
    result.push(note);

    if (mode === 'detune') {
      // Add detuned copies using cents (converted to fractional semitones)
      for (const centMultiplier of detuneCents) {
        const centsOffset = centMultiplier * detuneSpread;
        const semitonesOffset = centsOffset / 100;

        result.push({
          ...note,
          midi: note.midi + semitonesOffset,
          velocity: note.velocity * velocityScale,
        });
      }
    } else {
      // Add interval-based copies
      const intervals = modeIntervals[mode];
      for (const semitones of intervals) {
        result.push({
          ...note,
          midi: note.midi + semitones,
          velocity: note.velocity * velocityScale,
        });
      }
    }
  }

  return result;
}
