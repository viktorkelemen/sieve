import { describe, it, expect } from 'vitest';
import { applyVelocityHumanize } from './velocityHumanize';
import { Note } from './types';

// Helper to create test notes
function makeNote(time = 0, velocity = 0.8, midi = 60): Note {
  return { midi, time, duration: 0.5, velocity };
}

function makeNotes(count: number, velocity = 0.8): Note[] {
  return Array.from({ length: count }, (_, i) => ({
    midi: 60 + i,
    time: i * 0.5,
    duration: 0.5,
    velocity,
  }));
}

describe('applyVelocityHumanize', () => {
  describe('random velocity variation', () => {
    it('applies variation within specified amount range', () => {
      const notes = makeNotes(10, 0.5);
      const result = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 0, accentStrength: 0 });

      // All velocities should be within ±10% of original
      result.forEach(note => {
        expect(note.velocity).toBeGreaterThanOrEqual(0.4);
        expect(note.velocity).toBeLessThanOrEqual(0.6);
      });
    });

    it('produces deterministic results for same input', () => {
      const notes = makeNotes(5, 0.5);
      const result1 = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 0, accentStrength: 0 });
      const result2 = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 0, accentStrength: 0 });

      // Same input should produce same output (seeded random)
      result1.forEach((note, i) => {
        expect(note.velocity).toBe(result2[i].velocity);
      });
    });

    it('produces different results for different notes', () => {
      const notes = makeNotes(5, 0.5);
      const result = applyVelocityHumanize(notes, { amount: 0.15, accentEvery: 0, accentStrength: 0 });

      // Not all notes should have the same velocity
      const velocities = result.map(n => n.velocity);
      const uniqueVelocities = new Set(velocities);
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });

    it('preserves other note properties', () => {
      const notes = [makeNote(1.5, 0.7, 72)];
      const result = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 0, accentStrength: 0 });

      expect(result[0].midi).toBe(72);
      expect(result[0].time).toBe(1.5);
      expect(result[0].duration).toBe(0.5);
    });
  });

  describe('accent pattern', () => {
    it('boosts velocity for accented notes', () => {
      const notes = makeNotes(4, 0.5);
      // Accent every 2nd note (indices 0, 2)
      const result = applyVelocityHumanize(notes, { amount: 0, accentEvery: 2, accentStrength: 0.2 });

      expect(result[0].velocity).toBeCloseTo(0.7); // 0.5 + 0.2
      expect(result[1].velocity).toBeCloseTo(0.5); // no accent
      expect(result[2].velocity).toBeCloseTo(0.7); // 0.5 + 0.2
      expect(result[3].velocity).toBeCloseTo(0.5); // no accent
    });

    it('accents first note when accentEvery is set', () => {
      const notes = makeNotes(3, 0.6);
      const result = applyVelocityHumanize(notes, { amount: 0, accentEvery: 4, accentStrength: 0.15 });

      expect(result[0].velocity).toBeCloseTo(0.75); // accented
      expect(result[1].velocity).toBeCloseTo(0.6); // not accented
      expect(result[2].velocity).toBeCloseTo(0.6); // not accented
    });

    it('applies no accent when accentEvery is 0', () => {
      const notes = makeNotes(4, 0.5);
      const result = applyVelocityHumanize(notes, { amount: 0, accentEvery: 0, accentStrength: 0.3 });

      result.forEach(note => {
        expect(note.velocity).toBeCloseTo(0.5);
      });
    });
  });

  describe('velocity clamping', () => {
    it('clamps velocity to minimum 0.01', () => {
      const notes = [makeNote(0, 0.05)];
      const result = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 0, accentStrength: 0 });

      expect(result[0].velocity).toBeGreaterThanOrEqual(0.01);
    });

    it('clamps velocity to maximum 1.0', () => {
      const notes = [makeNote(0, 0.95)];
      const result = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 1, accentStrength: 0.3 });

      expect(result[0].velocity).toBeLessThanOrEqual(1.0);
    });

    it('handles edge case of velocity already at 1.0 with accent', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyVelocityHumanize(notes, { amount: 0, accentEvery: 1, accentStrength: 0.5 });

      expect(result[0].velocity).toBe(1.0);
    });
  });

  describe('combined effects', () => {
    it('applies both variation and accent together', () => {
      const notes = makeNotes(4, 0.5);
      const result = applyVelocityHumanize(notes, { amount: 0.05, accentEvery: 2, accentStrength: 0.2 });

      // Accented notes (0, 2) should be higher than non-accented (1, 3)
      expect(result[0].velocity).toBeGreaterThan(result[1].velocity);
      expect(result[2].velocity).toBeGreaterThan(result[3].velocity);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyVelocityHumanize([], { amount: 0.1, accentEvery: 2, accentStrength: 0.2 });
      expect(result).toHaveLength(0);
    });

    it('returns unchanged notes when amount is 0 and accentEvery is 0', () => {
      const notes = makeNotes(3, 0.6);
      const result = applyVelocityHumanize(notes, { amount: 0, accentEvery: 0, accentStrength: 0 });

      expect(result).toEqual(notes);
    });

    it('handles single note', () => {
      const notes = [makeNote(0, 0.5)];
      const result = applyVelocityHumanize(notes, { amount: 0.1, accentEvery: 1, accentStrength: 0.1 });

      expect(result).toHaveLength(1);
      // Should have accent applied
      expect(result[0].velocity).toBeGreaterThan(0.5);
    });
  });

  describe('default options', () => {
    it('uses default amount=0.1, accentEvery=0, accentStrength=0.2', () => {
      const notes = makeNotes(3, 0.5);
      const result = applyVelocityHumanize(notes);

      // With amount=0.1 and no accent, velocities should vary around 0.5
      result.forEach(note => {
        expect(note.velocity).toBeGreaterThanOrEqual(0.4);
        expect(note.velocity).toBeLessThanOrEqual(0.6);
      });
    });

    it('allows partial options override', () => {
      const notes = makeNotes(2, 0.5);
      const result = applyVelocityHumanize(notes, { accentEvery: 1 });

      // Should use default amount=0.1 and accentStrength=0.2, with accent on every note
      result.forEach(note => {
        expect(note.velocity).toBeGreaterThan(0.5); // accent applied
      });
    });
  });
});
