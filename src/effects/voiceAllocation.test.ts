import { describe, it, expect } from 'vitest';
import { applyVoiceAllocation } from './voiceAllocation';
import { Note } from './types';

describe('applyVoiceAllocation', () => {
  describe('basic allocation', () => {
    it('assigns channel 0 to a single note', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe(0);
    });

    it('assigns same channel to non-overlapping notes', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
        { midi: 64, time: 1, duration: 0.5, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].channel).toBe(0);
      expect(result[1].channel).toBe(0); // Reuses ch0 since first note ended
    });

    it('assigns different channels to overlapping notes', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 64, time: 0.5, duration: 1.0, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].channel).toBe(0);
      expect(result[1].channel).toBe(1); // Different channel since overlap
    });
  });

  describe('greedy allocation', () => {
    it('reuses lowest available channel', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },   // Ch 0
        { midi: 64, time: 0.2, duration: 0.5, velocity: 0.8 }, // Ch 1 (overlaps with first)
        { midi: 67, time: 0.6, duration: 0.5, velocity: 0.8 }, // Ch 0 (first note ended)
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].channel).toBe(0);
      expect(result[1].channel).toBe(1);
      expect(result[2].channel).toBe(0); // Reuses ch0
    });

    it('handles chord (simultaneous notes)', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
        { midi: 64, time: 0, duration: 0.5, velocity: 0.8 },
        { midi: 67, time: 0, duration: 0.5, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].channel).toBe(0);
      expect(result[1].channel).toBe(1);
      expect(result[2].channel).toBe(2);
    });
  });

  describe('maxVoices limit', () => {
    it('limits to maxVoices channels', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 64, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 67, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 72, time: 0, duration: 1.0, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes, { maxVoices: 2 });

      // Only channels 0 and 1 should be used
      const channels = result.map(n => n.channel ?? 0);
      expect(Math.max(...channels)).toBeLessThanOrEqual(1);
    });

    it('steals from soonest-ending voice when all channels busy', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.3, velocity: 0.8 }, // Ends at 0.3
        { midi: 64, time: 0, duration: 0.5, velocity: 0.8 }, // Ends at 0.5
        { midi: 67, time: 0.1, duration: 0.5, velocity: 0.8 }, // Needs to steal
      ];
      const result = applyVoiceAllocation(notes, { maxVoices: 2 });

      expect(result[0].channel).toBe(0); // First note
      expect(result[1].channel).toBe(1); // Second note
      expect(result[2].channel).toBe(0); // Steals from ch0 (ends soonest)
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyVoiceAllocation([]);
      expect(result).toHaveLength(0);
    });

    it('preserves note properties except channel', () => {
      const notes: Note[] = [
        { midi: 60, time: 1.5, duration: 0.3, velocity: 0.9 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].midi).toBe(60);
      expect(result[0].time).toBe(1.5);
      expect(result[0].duration).toBe(0.3);
      expect(result[0].velocity).toBe(0.9);
      expect(result[0].channel).toBe(0);
    });

    it('handles notes already sorted by time', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
        { midi: 64, time: 0.25, duration: 0.5, velocity: 0.8 },
        { midi: 67, time: 0.5, duration: 0.5, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      expect(result[0].channel).toBe(0);
      expect(result[1].channel).toBe(1);
      expect(result[2].channel).toBe(0); // Ch0 freed at 0.5
    });

    it('handles notes not sorted by time', () => {
      const notes: Note[] = [
        { midi: 64, time: 0.25, duration: 0.5, velocity: 0.8 },
        { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
        { midi: 67, time: 0.5, duration: 0.5, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      // Should sort internally and allocate correctly
      const sorted = result.sort((a, b) => a.time - b.time);
      expect(sorted[0].channel).toBe(0); // time 0
      expect(sorted[1].channel).toBe(1); // time 0.25
      expect(sorted[2].channel).toBe(0); // time 0.5
    });
  });

  describe('default options', () => {
    it('uses default maxVoices=4', () => {
      const notes: Note[] = [
        { midi: 60, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 64, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 67, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 72, time: 0, duration: 1.0, velocity: 0.8 },
        { midi: 76, time: 0, duration: 1.0, velocity: 0.8 },
      ];
      const result = applyVoiceAllocation(notes);

      // 5 simultaneous notes with maxVoices=4, so 5th note steals
      const channels = result.map(n => n.channel ?? 0);
      expect(Math.max(...channels)).toBeLessThanOrEqual(3);
    });
  });
});
