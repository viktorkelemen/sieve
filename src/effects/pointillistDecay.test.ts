import { describe, it, expect } from 'vitest';
import { applyPointillistDecay } from './pointillistDecay';
import { Note } from './types';

// Helper to create test notes
function makeNotes(count: number, duration = 0.5): Note[] {
  return Array.from({ length: count }, (_, i) => ({
    midi: 60 + i,
    time: i * 0.5,
    duration,
    velocity: 0.8,
  }));
}

describe('applyPointillistDecay', () => {
  describe('basic decay behavior', () => {
    it('shortens note durations by decay factor', () => {
      const notes = makeNotes(3, 1.0);
      const result = applyPointillistDecay(notes, { decayFactor: 0.5, minDuration: 0.01 });

      expect(result).toHaveLength(3);
      expect(result[0].duration).toBe(0.5);
      expect(result[1].duration).toBe(0.5);
      expect(result[2].duration).toBe(0.5);
    });

    it('applies different decay factors correctly', () => {
      const notes = makeNotes(1, 1.0);

      const result25 = applyPointillistDecay(notes, { decayFactor: 0.25, minDuration: 0.01 });
      expect(result25[0].duration).toBe(0.25);

      const result10 = applyPointillistDecay(notes, { decayFactor: 0.1, minDuration: 0.01 });
      expect(result10[0].duration).toBe(0.1);
    });

    it('preserves other note properties', () => {
      const notes = makeNotes(1, 1.0);
      const result = applyPointillistDecay(notes, { decayFactor: 0.5, minDuration: 0.01 });

      expect(result[0].midi).toBe(60);
      expect(result[0].time).toBe(0);
      expect(result[0].velocity).toBe(0.8);
    });
  });

  describe('minDuration floor', () => {
    it('clamps duration to minDuration when decay would go below', () => {
      const notes = makeNotes(1, 0.1);
      const result = applyPointillistDecay(notes, { decayFactor: 0.05, minDuration: 0.01 });

      // 0.1 * 0.05 = 0.005, but minDuration is 0.01
      expect(result[0].duration).toBe(0.01);
    });

    it('respects custom minDuration values', () => {
      const notes = makeNotes(1, 0.1);
      const result = applyPointillistDecay(notes, { decayFactor: 0.05, minDuration: 0.02 });

      expect(result[0].duration).toBe(0.02);
    });

    it('does not clamp when decay result is above minDuration', () => {
      const notes = makeNotes(1, 1.0);
      const result = applyPointillistDecay(notes, { decayFactor: 0.5, minDuration: 0.01 });

      // 1.0 * 0.5 = 0.5, which is above 0.01
      expect(result[0].duration).toBe(0.5);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyPointillistDecay([], { decayFactor: 0.5, minDuration: 0.01 });
      expect(result).toHaveLength(0);
    });

    it('returns unchanged notes when decayFactor is 1', () => {
      const notes = makeNotes(3, 0.5);
      const result = applyPointillistDecay(notes, { decayFactor: 1, minDuration: 0.01 });

      expect(result).toHaveLength(3);
      expect(result[0].duration).toBe(0.5);
    });

    it('returns unchanged notes when decayFactor is greater than 1', () => {
      const notes = makeNotes(3, 0.5);
      const result = applyPointillistDecay(notes, { decayFactor: 1.5, minDuration: 0.01 });

      expect(result).toHaveLength(3);
      expect(result[0].duration).toBe(0.5);
    });

    it('returns unchanged notes when decayFactor is 0', () => {
      const notes = makeNotes(3, 0.5);
      const result = applyPointillistDecay(notes, { decayFactor: 0, minDuration: 0.01 });

      expect(result).toHaveLength(3);
      expect(result[0].duration).toBe(0.5);
    });

    it('returns unchanged notes when decayFactor is negative', () => {
      const notes = makeNotes(3, 0.5);
      const result = applyPointillistDecay(notes, { decayFactor: -0.5, minDuration: 0.01 });

      expect(result).toHaveLength(3);
      expect(result[0].duration).toBe(0.5);
    });

    it('handles single note input', () => {
      const notes = makeNotes(1, 1.0);
      const result = applyPointillistDecay(notes, { decayFactor: 0.3, minDuration: 0.01 });

      expect(result).toHaveLength(1);
      expect(result[0].duration).toBeCloseTo(0.3);
    });
  });

  describe('default options', () => {
    it('uses default decayFactor=0.5 and minDuration=0.01', () => {
      const notes = makeNotes(1, 1.0);
      const result = applyPointillistDecay(notes);

      expect(result[0].duration).toBe(0.5);
    });

    it('allows partial options override', () => {
      const notes = makeNotes(1, 1.0);
      const result = applyPointillistDecay(notes, { decayFactor: 0.25 });

      expect(result[0].duration).toBe(0.25);
    });
  });

  describe('extreme values', () => {
    it('handles extremely small decay factors', () => {
      const notes = makeNotes(1, 1.0);
      // 1.0 * 0.0001 = 0.0001 -> clamped to minDuration 0.01
      const result = applyPointillistDecay(notes, { decayFactor: 0.0001, minDuration: 0.01 });
      expect(result[0].duration).toBe(0.01);
    });

    it('handles 0 duration input notes', () => {
      const notes = makeNotes(1, 0);
      // 0 * 0.5 = 0 -> clamped to minDuration 0.01
      const result = applyPointillistDecay(notes, { decayFactor: 0.5, minDuration: 0.01 });
      expect(result[0].duration).toBe(0.01);
    });
  });
});
