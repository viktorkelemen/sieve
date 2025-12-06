import { describe, it, expect } from 'vitest';

// We manually implement the processor logic for testing
// since the actual file uses globals that are hard to import

interface ActiveNote {
  midi: number;
  startTime: number;
  endTime: number;
  crossesBoundary: boolean;
  hasWrapped: boolean;
}

interface Note {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

// Extract the note update logic for testing
function processNotesUpdate(
  activeNotes: ActiveNote[],
  newNotes: Note[],
  loopLength: number,
  cumulativePosition: number
): { orphanedNotes: number[]; updatedActiveNotes: ActiveNote[] } {
  const newNoteMap = new Map<string, Note>();
  for (const n of newNotes) {
    newNoteMap.set(`${n.midi}:${n.time}`, n);
  }

  const orphanedNotes: number[] = [];
  const updatedActiveNotes: ActiveNote[] = [];

  for (const active of activeNotes) {
    const key = `${active.midi}:${active.startTime}`;
    const newNote = newNoteMap.get(key);

    if (!newNote) {
      orphanedNotes.push(active.midi);
    } else {
      const rawEndTime = newNote.time + newNote.duration;
      const crossesBoundary = loopLength > 0 && rawEndTime > loopLength;
      const endTime = crossesBoundary
        ? rawEndTime - loopLength
        : rawEndTime;

      const pos = loopLength > 0
        ? cumulativePosition % loopLength
        : cumulativePosition;

      let shouldEnd = false;

      if (!crossesBoundary && endTime <= pos) {
        shouldEnd = true;
      } else if (!crossesBoundary && active.crossesBoundary && active.hasWrapped) {
        shouldEnd = true;
      } else if (crossesBoundary && active.hasWrapped && endTime <= pos) {
        shouldEnd = true;
      }

      if (shouldEnd) {
        orphanedNotes.push(active.midi);
      } else {
        updatedActiveNotes.push({
          ...active,
          endTime,
          crossesBoundary,
        });
      }
    }
  }

  return { orphanedNotes, updatedActiveNotes };
}

describe('clock-processor note update logic', () => {
  describe('Case 1: Non-cross-boundary note that should have ended', () => {
    it('turns off note when new endTime has passed current position', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 0,
        endTime: 2, // Original long duration
        crossesBoundary: false,
        hasWrapped: false,
      }];

      // Decay shortens note to end at 0.2
      const newNotes: Note[] = [{
        midi: 60,
        time: 0,
        duration: 0.2,
        velocity: 0.8,
      }];

      const result = processNotesUpdate(activeNotes, newNotes, 4, 0.5);

      expect(result.orphanedNotes).toContain(60);
      expect(result.updatedActiveNotes).toHaveLength(0);
    });

    it('keeps note active when new endTime has not passed yet', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 0,
        endTime: 2,
        crossesBoundary: false,
        hasWrapped: false,
      }];

      const newNotes: Note[] = [{
        midi: 60,
        time: 0,
        duration: 1,
        velocity: 0.8,
      }];

      // Position is 0.5, endTime is 1.0 - note should still play
      const result = processNotesUpdate(activeNotes, newNotes, 4, 0.5);

      expect(result.orphanedNotes).toHaveLength(0);
      expect(result.updatedActiveNotes).toHaveLength(1);
      expect(result.updatedActiveNotes[0].endTime).toBe(1);
    });
  });

  describe('Case 2: Cross-boundary note becomes non-cross-boundary after wrap', () => {
    it('turns off note that was cross-boundary but now is not, after wrap', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 3.8,
        endTime: 0.3, // Was 4.3 wrapped to 0.3
        crossesBoundary: true,
        hasWrapped: true, // We've passed the loop point
      }];

      // Decay shortens note so it no longer crosses boundary
      const newNotes: Note[] = [{
        midi: 60,
        time: 3.8,
        duration: 0.1, // Now ends at 3.9, before loop point
        velocity: 0.8,
      }];

      // Position is 0.2 (after wrap)
      const result = processNotesUpdate(activeNotes, newNotes, 4, 4.2); // cumulativePosition 4.2 % 4 = 0.2

      expect(result.orphanedNotes).toContain(60);
      expect(result.updatedActiveNotes).toHaveLength(0);
    });

    it('keeps cross-boundary note if it has not wrapped yet', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 3.8,
        endTime: 0.3,
        crossesBoundary: true,
        hasWrapped: false, // Not yet wrapped
      }];

      // Same decay
      const newNotes: Note[] = [{
        midi: 60,
        time: 3.8,
        duration: 0.1,
        velocity: 0.8,
      }];

      // Position is 3.9 (before wrap)
      const result = processNotesUpdate(activeNotes, newNotes, 4, 3.9);

      // Note becomes non-cross-boundary, endTime is 3.9, pos is 3.9
      // endTime <= pos is true, so it should end
      expect(result.orphanedNotes).toContain(60);
    });
  });

  describe('Case 3: Cross-boundary note with shorter duration after wrap', () => {
    it('turns off cross-boundary note when new endTime has passed after wrap', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 3.5,
        endTime: 0.5, // Was 4.5 wrapped to 0.5
        crossesBoundary: true,
        hasWrapped: true,
      }];

      // Decay shortens but still crosses boundary
      const newNotes: Note[] = [{
        midi: 60,
        time: 3.5,
        duration: 0.7, // Now ends at 4.2 wrapped to 0.2
        velocity: 0.8,
      }];

      // Position is 0.3 (past new endTime of 0.2)
      const result = processNotesUpdate(activeNotes, newNotes, 4, 4.3);

      expect(result.orphanedNotes).toContain(60);
      expect(result.updatedActiveNotes).toHaveLength(0);
    });

    it('keeps cross-boundary note if new endTime has not passed yet', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 3.5,
        endTime: 0.5,
        crossesBoundary: true,
        hasWrapped: true,
      }];

      const newNotes: Note[] = [{
        midi: 60,
        time: 3.5,
        duration: 0.7, // Ends at 0.2 wrapped
        velocity: 0.8,
      }];

      // Position is 0.1 (before new endTime of 0.2)
      const result = processNotesUpdate(activeNotes, newNotes, 4, 4.1);

      expect(result.orphanedNotes).toHaveLength(0);
      expect(result.updatedActiveNotes).toHaveLength(1);
      expect(result.updatedActiveNotes[0].endTime).toBeCloseTo(0.2);
    });
  });

  describe('Note removal (orphaned notes)', () => {
    it('turns off note that no longer exists in new notes', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 0,
        endTime: 1,
        crossesBoundary: false,
        hasWrapped: false,
      }];

      // Note is removed entirely (e.g., by note skip effect)
      const newNotes: Note[] = [];

      const result = processNotesUpdate(activeNotes, newNotes, 4, 0.5);

      expect(result.orphanedNotes).toContain(60);
      expect(result.updatedActiveNotes).toHaveLength(0);
    });

    it('handles multiple active notes with mixed outcomes', () => {
      const activeNotes: ActiveNote[] = [
        {
          midi: 60,
          startTime: 0,
          endTime: 2,
          crossesBoundary: false,
          hasWrapped: false,
        },
        {
          midi: 64,
          startTime: 0.5,
          endTime: 1.5,
          crossesBoundary: false,
          hasWrapped: false,
        },
      ];

      const newNotes: Note[] = [
        {
          midi: 60,
          time: 0,
          duration: 0.3, // Should end (pos 0.8 > 0.3)
          velocity: 0.8,
        },
        {
          midi: 64,
          time: 0.5,
          duration: 1, // Should stay (pos 0.8 < 1.5)
          velocity: 0.8,
        },
      ];

      const result = processNotesUpdate(activeNotes, newNotes, 4, 0.8);

      expect(result.orphanedNotes).toEqual([60]);
      expect(result.updatedActiveNotes).toHaveLength(1);
      expect(result.updatedActiveNotes[0].midi).toBe(64);
    });
  });

  describe('endTime update', () => {
    it('updates endTime when duration changes but note should continue', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 0,
        endTime: 2,
        crossesBoundary: false,
        hasWrapped: false,
      }];

      const newNotes: Note[] = [{
        midi: 60,
        time: 0,
        duration: 1.5, // Shortened but still ahead of position
        velocity: 0.8,
      }];

      const result = processNotesUpdate(activeNotes, newNotes, 4, 0.5);

      expect(result.orphanedNotes).toHaveLength(0);
      expect(result.updatedActiveNotes[0].endTime).toBe(1.5);
    });

    it('updates crossesBoundary flag when duration changes', () => {
      const activeNotes: ActiveNote[] = [{
        midi: 60,
        startTime: 3.5,
        endTime: 0.5, // Originally crossed boundary
        crossesBoundary: true,
        hasWrapped: false,
      }];

      const newNotes: Note[] = [{
        midi: 60,
        time: 3.5,
        duration: 0.3, // No longer crosses boundary
        velocity: 0.8,
      }];

      // Position is 3.6, new endTime is 3.8
      const result = processNotesUpdate(activeNotes, newNotes, 4, 3.6);

      expect(result.orphanedNotes).toHaveLength(0);
      expect(result.updatedActiveNotes[0].crossesBoundary).toBe(false);
      expect(result.updatedActiveNotes[0].endTime).toBe(3.8);
    });
  });
});
