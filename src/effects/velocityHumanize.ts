import { Note } from './types';

export interface VelocityHumanizeOptions {
  amount: number;        // 0-0.3, random velocity variation (±amount)
  accentEvery: number;   // 0-8, emphasize every Nth note (0 = disabled)
  accentStrength: number; // 0-0.5, velocity boost for accented notes
}

const defaultOptions: VelocityHumanizeOptions = {
  amount: 0.1,
  accentEvery: 0,
  accentStrength: 0.2,
};

/**
 * Simple seeded random number generator (mulberry32)
 * Provides deterministic randomness based on seed
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Create a seed from note properties for deterministic randomness
 */
function noteSeed(note: Note, index: number): number {
  // Combine note properties into a seed
  return Math.floor(note.time * 1000) ^ (note.midi * 127) ^ (index * 31);
}

/**
 * Velocity Humanization Effect
 *
 * Adds subtle random variations to velocity, making mechanical sequences
 * feel more alive and expressive. Optionally adds accent patterns to
 * emphasize certain beats for groove and forward motion.
 */
export function applyVelocityHumanize(
  notes: Note[],
  options: Partial<VelocityHumanizeOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { amount, accentEvery, accentStrength } = opts;

  // If no humanization, return unchanged
  if (amount <= 0 && accentEvery <= 0) return notes;

  return notes.map((note, index) => {
    let velocity = note.velocity;

    // Apply random variation
    if (amount > 0) {
      const random = seededRandom(noteSeed(note, index));
      // Random value between -amount and +amount
      const variation = (random() * 2 - 1) * amount;
      velocity += variation;
    }

    // Apply accent pattern
    if (accentEvery > 0 && (index % accentEvery) === 0) {
      velocity += accentStrength;
    }

    // Clamp velocity to valid range
    velocity = Math.max(0.01, Math.min(1, velocity));

    return {
      ...note,
      velocity,
    };
  });
}
