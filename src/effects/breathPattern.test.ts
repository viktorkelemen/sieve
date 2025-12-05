import { describe, it, expect } from 'vitest';
import { applyBreathPattern } from './breathPattern';
import { Note } from './types';

// Helper to create a note at a specific time
function makeNote(time: number, velocity = 0.8): Note {
  return {
    midi: 60,
    time,
    duration: 0.1,
    velocity,
  };
}

describe('applyBreathPattern', () => {
  describe('inhale/exhale phases', () => {
    it('keeps notes during inhale phase', () => {
      // breathDuration=4, inhaleRatio=0.5 -> inhale 0-2s, exhale 2-4s
      const notes = [makeNote(0.5), makeNote(1.0), makeNote(1.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(3);
    });

    it('removes notes during exhale phase', () => {
      // breathDuration=4, inhaleRatio=0.5 -> inhale 0-2s, exhale 2-4s
      const notes = [makeNote(2.5), makeNote(3.0), makeNote(3.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(0);
    });

    it('handles notes across inhale/exhale boundary', () => {
      const notes = [
        makeNote(1.0), // inhale
        makeNote(2.5), // exhale
        makeNote(5.0), // second cycle, inhale (5 % 4 = 1)
        makeNote(6.5), // second cycle, exhale (6.5 % 4 = 2.5)
      ];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(2);
      expect(result.map(n => n.time)).toEqual([1.0, 5.0]);
    });
  });

  describe('velocity fading at edges', () => {
    it('fades in at start of inhale phase', () => {
      // breathDuration=4, inhaleRatio=0.5, fadeEdges=0.5
      // inhaleTime = 2s, fadeTime = 1s
      // Note at 0.5s: cyclePosition/fadeTime = 0.5/1 = 0.5 -> ~0.5 velocity modifier
      const notes = [makeNote(0.5, 1.0)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0.5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].velocity).toBeLessThan(1.0);
      expect(result[0].velocity).toBeGreaterThan(0);
    });

    it('fades out at end of inhale phase', () => {
      // inhaleTime = 2s, fadeTime = 1s
      // Note at 1.5s: (2 - 1.5) / 1 = 0.5 -> ~0.5 velocity modifier
      const notes = [makeNote(1.5, 1.0)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0.5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].velocity).toBeLessThan(1.0);
      expect(result[0].velocity).toBeGreaterThan(0);
    });

    it('keeps full velocity in middle of inhale phase', () => {
      // inhaleTime = 2s, fadeTime = 0.5s (fadeEdges=0.25)
      // Note at 1.0s: middle of inhale, no fade
      const notes = [makeNote(1.0, 1.0)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0.25,
      });

      expect(result).toHaveLength(1);
      expect(result[0].velocity).toBe(1.0);
    });

    it('applies no fade when fadeEdges=0', () => {
      const notes = [makeNote(0.1, 1.0), makeNote(1.9, 1.0)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(2);
      expect(result[0].velocity).toBe(1.0);
      expect(result[1].velocity).toBe(1.0);
    });
  });

  describe('breath cycle wrapping', () => {
    it('handles notes beyond first breath cycle', () => {
      const notes = [
        makeNote(1.0),  // cycle 0, inhale
        makeNote(5.0),  // cycle 1, position 1.0, inhale
        makeNote(9.0),  // cycle 2, position 1.0, inhale
      ];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(3);
    });

    it('correctly removes exhale notes in later cycles', () => {
      const notes = [
        makeNote(2.5),  // cycle 0, exhale
        makeNote(6.5),  // cycle 1, position 2.5, exhale
        makeNote(10.5), // cycle 2, position 2.5, exhale
      ];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyBreathPattern([]);
      expect(result).toHaveLength(0);
    });

    it('handles note at exactly time 0', () => {
      const notes = [makeNote(0, 1.0)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0.5,
      });

      expect(result).toHaveLength(1);
      // At time 0 with fade, velocity should be very low (close to 0)
      expect(result[0].velocity).toBeLessThan(0.1);
    });

    it('handles inhaleRatio near 1 (mostly inhale)', () => {
      const notes = [makeNote(0.5), makeNote(1.5), makeNote(2.5), makeNote(3.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.9,
        fadeEdges: 0,
      });

      // inhaleTime = 3.6s, so notes at 0.5, 1.5, 2.5, 3.5 should all be kept
      expect(result).toHaveLength(4);
    });

    it('handles inhaleRatio near 0 (mostly exhale)', () => {
      const notes = [makeNote(0.5), makeNote(1.5), makeNote(2.5), makeNote(3.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.1,
        fadeEdges: 0,
      });

      // inhaleTime = 0.4s, only note at 0.5 might be kept (but 0.5 > 0.4)
      expect(result).toHaveLength(0);
    });

    it('returns unchanged notes when breathDuration is 0', () => {
      const notes = [makeNote(0.5), makeNote(1.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: 0,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual(notes);
    });

    it('returns unchanged notes when breathDuration is negative', () => {
      const notes = [makeNote(0.5), makeNote(1.5)];
      const result = applyBreathPattern(notes, {
        breathDuration: -1,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual(notes);
    });
  });

  describe('default options', () => {
    it('uses sensible defaults', () => {
      // Default: breathDuration=4, inhaleRatio=0.6, fadeEdges=0.3
      const notes = [
        makeNote(1.0),  // Should be kept (in inhale)
        makeNote(3.0),  // Should be removed (in exhale, 3 > 2.4)
      ];
      const result = applyBreathPattern(notes);

      expect(result).toHaveLength(1);
      expect(result[0].time).toBe(1.0);
    });
  });

  describe('preserves note properties', () => {
    it('preserves midi, time, and duration', () => {
      const notes: Note[] = [{
        midi: 72,
        time: 1.0,
        duration: 0.5,
        velocity: 0.9,
      }];
      const result = applyBreathPattern(notes, {
        breathDuration: 4,
        inhaleRatio: 0.5,
        fadeEdges: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].midi).toBe(72);
      expect(result[0].time).toBe(1.0);
      expect(result[0].duration).toBe(0.5);
      expect(result[0].velocity).toBe(0.9);
    });
  });
});
