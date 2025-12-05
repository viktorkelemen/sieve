import { describe, it, expect } from 'vitest';
import { applyNoteSkip } from './noteSkip';
import { Note } from './types';

// Helper to create test notes
function makeNotes(count: number): Note[] {
  return Array.from({ length: count }, (_, i) => ({
    midi: 60 + i,
    time: i * 0.5,
    duration: 0.4,
    velocity: 0.8,
  }));
}

describe('applyNoteSkip', () => {
  describe('basic play:skip patterns', () => {
    it('play=1, skip=1 keeps every other note', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 1, skip: 1, offset: 0 });

      expect(result).toHaveLength(3);
      expect(result.map(n => n.midi)).toEqual([60, 62, 64]);
    });

    it('play=2, skip=1 keeps 2 notes then skips 1', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 2, skip: 1, offset: 0 });

      expect(result).toHaveLength(4);
      expect(result.map(n => n.midi)).toEqual([60, 61, 63, 64]);
    });

    it('play=1, skip=2 keeps 1 note then skips 2', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 1, skip: 2, offset: 0 });

      expect(result).toHaveLength(2);
      expect(result.map(n => n.midi)).toEqual([60, 63]);
    });

    it('play=3, skip=1 keeps 3 notes then skips 1', () => {
      const notes = makeNotes(8);
      const result = applyNoteSkip(notes, { play: 3, skip: 1, offset: 0 });

      expect(result).toHaveLength(6);
      expect(result.map(n => n.midi)).toEqual([60, 61, 62, 64, 65, 66]);
    });
  });

  describe('offset parameter', () => {
    it('offset=1 shifts the pattern start by 1', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 1, skip: 1, offset: 1 });

      expect(result).toHaveLength(3);
      expect(result.map(n => n.midi)).toEqual([61, 63, 65]);
    });

    it('offset=2 with play=2, skip=1 shifts pattern', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 2, skip: 1, offset: 2 });

      // Offset 2 means we start at position 2 in a 3-cycle (play 2, skip 1)
      // Index 0: (0+2) % 3 = 2 -> skip
      // Index 1: (1+2) % 3 = 0 -> play
      // Index 2: (2+2) % 3 = 1 -> play
      // Index 3: (3+2) % 3 = 2 -> skip
      // Index 4: (4+2) % 3 = 0 -> play
      // Index 5: (5+2) % 3 = 1 -> play
      expect(result).toHaveLength(4);
      expect(result.map(n => n.midi)).toEqual([61, 62, 64, 65]);
    });

    it('handles negative offset correctly', () => {
      const notes = makeNotes(6);
      // offset=-1 with cycle length 2 should behave like offset=1
      const result = applyNoteSkip(notes, { play: 1, skip: 1, offset: -1 });

      expect(result).toHaveLength(3);
      expect(result.map(n => n.midi)).toEqual([61, 63, 65]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyNoteSkip([], { play: 1, skip: 1, offset: 0 });
      expect(result).toHaveLength(0);
    });

    it('returns unchanged notes when skip=0', () => {
      const notes = makeNotes(4);
      const result = applyNoteSkip(notes, { play: 1, skip: 0, offset: 0 });

      expect(result).toHaveLength(4);
      expect(result).toEqual(notes);
    });

    it('returns unchanged notes when play=0', () => {
      const notes = makeNotes(4);
      const result = applyNoteSkip(notes, { play: 0, skip: 1, offset: 0 });

      expect(result).toHaveLength(4);
    });

    it('handles single note input', () => {
      const notes = makeNotes(1);
      const result = applyNoteSkip(notes, { play: 1, skip: 1, offset: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].midi).toBe(60);
    });
  });

  describe('default options', () => {
    it('uses default play=1, skip=1, offset=0', () => {
      const notes = makeNotes(4);
      const result = applyNoteSkip(notes);

      expect(result).toHaveLength(2);
      expect(result.map(n => n.midi)).toEqual([60, 62]);
    });

    it('allows partial options override', () => {
      const notes = makeNotes(6);
      const result = applyNoteSkip(notes, { play: 2 });

      // play=2, skip=1 (default), offset=0 (default)
      expect(result).toHaveLength(4);
    });
  });

  describe('time-based sorting', () => {
    it('sorts notes by time before applying pattern', () => {
      const notes: Note[] = [
        { midi: 62, time: 1.0, duration: 0.4, velocity: 0.8 },
        { midi: 60, time: 0.0, duration: 0.4, velocity: 0.8 },
        { midi: 64, time: 2.0, duration: 0.4, velocity: 0.8 },
        { midi: 61, time: 0.5, duration: 0.4, velocity: 0.8 },
      ];

      const result = applyNoteSkip(notes, { play: 1, skip: 1, offset: 0 });

      // After sorting: 60 (0.0), 61 (0.5), 62 (1.0), 64 (2.0)
      // Keep indices 0, 2 -> notes 60, 62
      expect(result).toHaveLength(2);
      expect(result.map(n => n.midi)).toEqual([60, 62]);
    });
  });
});
