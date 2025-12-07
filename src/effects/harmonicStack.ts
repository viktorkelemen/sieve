import { Note } from './types';

export type HarmonicStackMode =
  // Basic intervals
  | 'detune'
  | 'octave'
  | 'fifth'
  | 'powerChord'
  // Thirds
  | 'majorThird'
  | 'minorThird'
  // Triads
  | 'triad'
  | 'minorTriad'
  | 'sus2'
  | 'sus4'
  // Extended chords
  | 'seventh'
  | 'minorSeventh'
  | 'add9'
  // Parallel motion
  | 'parallelFifths'
  | 'doubleOctave'
  // Experimental
  | 'harmonicSeries'
  | 'quartal'
  | 'cluster';

export interface HarmonicStackOptions {
  mode: HarmonicStackMode;
  detuneSpread: number;      // Cents spread for detune mode (0-50)
  velocityScale: number;     // Velocity multiplier for stacked notes (0-1)
  spreadChannels: boolean;   // Route each layer to a different MIDI channel
}

const defaultOptions: HarmonicStackOptions = {
  mode: 'octave',
  detuneSpread: 12,
  velocityScale: 0.8,
  spreadChannels: false,
};

// Interval definitions in semitones for each mode
const modeIntervals: Record<HarmonicStackMode, number[]> = {
  // Basic intervals
  detune: [],           // Handled specially with cents
  octave: [12],         // One octave up
  fifth: [7],           // Perfect fifth
  powerChord: [7, 12],  // Fifth + octave (power chord)
  // Thirds
  majorThird: [4],      // Major third (warm, bright)
  minorThird: [3],      // Minor third (darker)
  // Triads
  triad: [4, 7],        // Major triad (root + 3rd + 5th)
  minorTriad: [3, 7],   // Minor triad
  sus2: [2, 7],         // Suspended 2nd (root + 2nd + 5th)
  sus4: [5, 7],         // Suspended 4th (root + 4th + 5th)
  // Extended chords
  seventh: [4, 7, 11],      // Major 7th chord
  minorSeventh: [3, 7, 10], // Minor 7th chord
  add9: [4, 7, 14],         // Add9 chord (triad + 9th)
  // Parallel motion
  parallelFifths: [-7, 7],  // Fifth below + fifth above (organum)
  doubleOctave: [12, 24],   // One + two octaves up
  // Experimental
  harmonicSeries: [12, 19, 24, 28], // Natural overtones (oct, 5th+oct, 2oct, maj3rd+2oct)
  quartal: [5, 10],         // Stacked perfect fourths
  cluster: [1, 2],          // Chromatic cluster (dense, dissonant)
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
 * - majorThird/minorThird: Add third intervals for warmth
 * - triad/minorTriad: Full chord voicings
 * - sus2/sus4: Suspended chord voicings
 * - seventh/minorSeventh: Jazz-influenced extended chords
 * - add9: Modern pop voicing with 9th
 * - parallelFifths: Medieval organum (fifths above and below)
 * - doubleOctave: Maximum octave spread
 * - harmonicSeries: Natural overtone stacking
 * - quartal: Stacked fourths (modern jazz)
 * - cluster: Dense chromatic texture
 */
export function applyHarmonicStack(
  notes: Note[],
  options: Partial<HarmonicStackOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { mode, detuneSpread, velocityScale, spreadChannels } = opts;

  if (notes.length === 0) return notes;

  const result: Note[] = [];

  for (const note of notes) {
    const baseChannel = note.channel || 0;

    // Always include the original note
    result.push(note);

    if (mode === 'detune') {
      // Add detuned copies using cents (converted to fractional semitones)
      for (let i = 0; i < detuneCents.length; i++) {
        const centsOffset = detuneCents[i] * detuneSpread;
        const semitonesOffset = centsOffset / 100;

        result.push({
          ...note,
          midi: note.midi + semitonesOffset,
          velocity: note.velocity * velocityScale,
          channel: spreadChannels ? (baseChannel + i + 1) % 16 : note.channel,
        });
      }
    } else {
      // Add interval-based copies
      const intervals = modeIntervals[mode];
      for (let i = 0; i < intervals.length; i++) {
        result.push({
          ...note,
          midi: note.midi + intervals[i],
          velocity: note.velocity * velocityScale,
          channel: spreadChannels ? (baseChannel + i + 1) % 16 : note.channel,
        });
      }
    }
  }

  return result;
}
