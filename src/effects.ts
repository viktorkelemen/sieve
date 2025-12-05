import { Note } from './player';

export interface BreathPatternOptions {
  breathDuration: number;  // Full breath cycle in seconds (inhale + exhale)
  inhaleRatio: number;     // 0-1, portion of cycle that is "inhale" (notes play)
  fadeEdges: number;       // 0-1, how much to fade velocity at breath edges
}

const defaultBreathOptions: BreathPatternOptions = {
  breathDuration: 4,   // 4 second breath cycle
  inhaleRatio: 0.6,    // 60% inhale (notes), 40% exhale (silence)
  fadeEdges: 0.3,      // 30% fade at edges
};

/**
 * Breath Pattern Effect
 *
 * Creates periodic gaps in the note sequence that mimic breathing rhythm.
 * Notes during "exhale" phase are removed, notes at breath edges have
 * reduced velocity for a natural fade in/out effect.
 */
export function applyBreathPattern(
  notes: Note[],
  options: Partial<BreathPatternOptions> = {}
): Note[] {
  const opts = { ...defaultBreathOptions, ...options };
  const { breathDuration, inhaleRatio, fadeEdges } = opts;

  const inhaleTime = breathDuration * inhaleRatio;
  const fadeTime = inhaleTime * fadeEdges;

  const result = notes
    .map(note => {
      // Where in the breath cycle is this note?
      const cyclePosition = note.time % breathDuration;

      // During exhale phase - remove note
      if (cyclePosition >= inhaleTime) {
        return null;
      }

      // Calculate velocity modifier based on position in inhale phase
      let velocityMod = 1;

      // Fade in at start of inhale
      if (cyclePosition < fadeTime) {
        velocityMod = cyclePosition / fadeTime;
      }
      // Fade out at end of inhale
      else if (cyclePosition > inhaleTime - fadeTime) {
        velocityMod = (inhaleTime - cyclePosition) / fadeTime;
      }

      // Apply smooth easing
      velocityMod = easeInOutSine(velocityMod);

      return {
        ...note,
        velocity: note.velocity * velocityMod,
      };
    })
    .filter((note): note is Note => note !== null);

  return result;
}

// Smooth easing function for natural breathing feel
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export interface NoteSkipOptions {
  every: number;   // Play every Nth note (2 = every other, 3 = every third)
  offset: number;  // Which note to start from (0, 1, 2...)
}

const defaultNoteSkipOptions: NoteSkipOptions = {
  every: 2,
  offset: 0,
};

/**
 * Note Skip Effect
 *
 * Plays every Nth note from the sequence, creating rhythmic variations.
 * Useful for thinning out busy arps or creating polyrhythmic feels.
 */
export function applyNoteSkip(
  notes: Note[],
  options: Partial<NoteSkipOptions> = {}
): Note[] {
  const opts = { ...defaultNoteSkipOptions, ...options };
  const { every, offset } = opts;

  if (every <= 1) return notes;

  // Sort by time to ensure consistent ordering
  const sorted = [...notes].sort((a, b) => a.time - b.time);

  return sorted.filter((_, index) => (index + offset) % every === 0);
}

// Effect registry for future effects
export interface Effect {
  name: string;
  apply: (notes: Note[], options?: Record<string, unknown>) => Note[];
}

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
