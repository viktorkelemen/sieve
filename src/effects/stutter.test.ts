import { describe, it, expect } from 'vitest';
import { applyStutter } from './stutter';
import { Note } from './types';

// Helper to create test notes
function makeNote(time = 0, duration = 1.0, midi = 60, velocity = 0.8): Note {
  return { midi, time, duration, velocity };
}

function makeNotes(count: number, duration = 0.5): Note[] {
  return Array.from({ length: count }, (_, i) => ({
    midi: 60 + i,
    time: i * duration,
    duration,
    velocity: 0.8,
  }));
}

describe('applyStutter', () => {
  describe('basic stutter behavior', () => {
    it('creates correct number of repetitions', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 1, gapRatio: 0 });

      expect(result).toHaveLength(4);
    });

    it('divides original duration among repetitions', () => {
      const notes = [makeNote(0, 1.0)];
      // With 4 reps and no gap, each rep should be 1.0 / 4 = 0.25
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 1, gapRatio: 0 });

      expect(result[0].duration).toBeCloseTo(0.25);
      expect(result[1].duration).toBeCloseTo(0.25);
      expect(result[2].duration).toBeCloseTo(0.25);
      expect(result[3].duration).toBeCloseTo(0.25);
    });

    it('spaces repetitions correctly within original duration', () => {
      const notes = [makeNote(0, 1.0)];
      // 4 reps, no gap: times should be 0, 0.25, 0.5, 0.75
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 1, gapRatio: 0 });

      expect(result[0].time).toBeCloseTo(0);
      expect(result[1].time).toBeCloseTo(0.25);
      expect(result[2].time).toBeCloseTo(0.5);
      expect(result[3].time).toBeCloseTo(0.75);
    });

    it('preserves midi note number', () => {
      const notes = [makeNote(0, 1.0, 72)];
      const result = applyStutter(notes, { repetitions: 3, velocityDecay: 1, gapRatio: 0 });

      result.forEach(note => expect(note.midi).toBe(72));
    });
  });

  describe('velocity decay', () => {
    it('applies velocity decay to each repetition', () => {
      const notes = [makeNote(0, 1.0, 60, 1.0)];
      const result = applyStutter(notes, { repetitions: 3, velocityDecay: 0.5, gapRatio: 0 });

      expect(result[0].velocity).toBeCloseTo(1.0);
      expect(result[1].velocity).toBeCloseTo(0.5);
      expect(result[2].velocity).toBeCloseTo(0.25);
    });

    it('floors velocity at 0.01 to prevent silent notes', () => {
      const notes = [makeNote(0, 1.0, 60, 0.1)];
      // After 5 reps with 0.5 decay: 0.1, 0.05, 0.025, 0.0125, 0.00625 -> clamped to 0.01
      const result = applyStutter(notes, { repetitions: 5, velocityDecay: 0.5, gapRatio: 0 });

      expect(result[4].velocity).toBe(0.01);
    });

    it('preserves velocity when decay is 1', () => {
      const notes = [makeNote(0, 1.0, 60, 0.7)];
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 1, gapRatio: 0 });

      result.forEach(note => expect(note.velocity).toBeCloseTo(0.7));
    });
  });

  describe('gap ratio', () => {
    it('creates gaps between repetitions', () => {
      const notes = [makeNote(0, 1.0)];
      // With gap ratio 0.5: rep duration accounts for gaps
      const result = applyStutter(notes, { repetitions: 2, velocityDecay: 1, gapRatio: 0.5 });

      // Total = 2 reps + 1 gap. If gapRatio = 0.5, gap = 0.5 * repDuration
      // duration / (reps + (reps-1) * gapRatio) = 1.0 / (2 + 1*0.5) = 1.0 / 2.5 = 0.4
      // So rep duration = 0.4, gap = 0.2, step = 0.6
      expect(result[0].duration).toBeCloseTo(0.4);
      expect(result[1].duration).toBeCloseTo(0.4);
      expect(result[0].time).toBeCloseTo(0);
      expect(result[1].time).toBeCloseTo(0.6); // 0.4 + 0.2 gap
    });

    it('handles zero gap (legato stutter)', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 1, gapRatio: 0 });

      // Notes should be back-to-back
      expect(result[0].time + result[0].duration).toBeCloseTo(result[1].time);
      expect(result[1].time + result[1].duration).toBeCloseTo(result[2].time);
    });
  });

  describe('multiple notes', () => {
    it('stutters each input note independently', () => {
      const notes = makeNotes(2, 1.0); // Two notes at t=0 and t=1
      const result = applyStutter(notes, { repetitions: 2, velocityDecay: 1, gapRatio: 0 });

      expect(result).toHaveLength(4);
      // First note stuttered at 0, 0.5
      // Second note stuttered at 1, 1.5
    });

    it('maintains correct time sorting across stuttered notes', () => {
      const notes = makeNotes(3, 1.0);
      const result = applyStutter(notes, { repetitions: 2, velocityDecay: 1, gapRatio: 0 });

      // Result should be sorted by time
      for (let i = 1; i < result.length; i++) {
        expect(result[i].time).toBeGreaterThanOrEqual(result[i - 1].time);
      }
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyStutter([], { repetitions: 3, velocityDecay: 0.8, gapRatio: 0.1 });
      expect(result).toHaveLength(0);
    });

    it('returns unchanged notes when repetitions is 1', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 1, velocityDecay: 0.8, gapRatio: 0.1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(notes[0]);
    });

    it('returns unchanged notes when repetitions is 0', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 0, velocityDecay: 0.8, gapRatio: 0.1 });

      expect(result).toHaveLength(1);
    });

    it('handles single note input', () => {
      const notes = [makeNote(0.5, 0.25)];
      const result = applyStutter(notes, { repetitions: 3, velocityDecay: 0.9, gapRatio: 0 });

      expect(result).toHaveLength(3);
      expect(result[0].time).toBeCloseTo(0.5);
    });
  });

  describe('default options', () => {
    it('uses default repetitions=3, velocityDecay=0.85, gapRatio=0.1', () => {
      const notes = [makeNote(0, 1.0, 60, 1.0)];
      const result = applyStutter(notes);

      expect(result).toHaveLength(3);
      // Check velocity decay is applied
      expect(result[1].velocity).toBeCloseTo(0.85);
      expect(result[2].velocity).toBeCloseTo(0.85 * 0.85);
    });

    it('allows partial options override', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 5 });

      expect(result).toHaveLength(5);
    });
  });

  describe('extreme values', () => {
    it('handles very short notes', () => {
      const notes = [makeNote(0, 0.01)];
      const result = applyStutter(notes, { repetitions: 4, velocityDecay: 0.9, gapRatio: 0 });

      expect(result).toHaveLength(4);
      expect(result[0].duration).toBeCloseTo(0.0025);
    });

    it('handles high repetition counts', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 8, velocityDecay: 0.9, gapRatio: 0 });

      expect(result).toHaveLength(8);
    });

    it('handles maximum gap ratio', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyStutter(notes, { repetitions: 2, velocityDecay: 1, gapRatio: 0.5 });

      // Should still produce valid notes within original duration
      expect(result).toHaveLength(2);
      const lastNoteEnd = result[1].time + result[1].duration;
      expect(lastNoteEnd).toBeLessThanOrEqual(1.0 + 0.001); // Allow small float error
    });
  });
});
