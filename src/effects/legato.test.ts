import { describe, it, expect } from 'vitest';
import { applyLegato } from './legato';
import { Note } from './types';

describe('applyLegato', () => {
  const makeNote = (time: number, duration: number, midi = 60): Note => ({
    midi,
    time,
    duration,
    velocity: 0.8,
  });

  it('should return empty array for empty input', () => {
    expect(applyLegato([])).toEqual([]);
  });

  it('should return single note unchanged', () => {
    const notes = [makeNote(0, 0.5)];
    expect(applyLegato(notes)).toEqual(notes);
  });

  it('should extend notes to connect with next note (different pitches)', () => {
    const notes = [
      makeNote(0, 0.3, 60),    // C4, ends at 0.3, gap of 0.2 to next
      makeNote(0.5, 0.3, 64),  // E4, starts at 0.5
    ];

    const result = applyLegato(notes, { overlap: 0, maxGap: 0.5 });

    // First note should extend to reach 0.5 (duration = 0.5)
    expect(result[0].duration).toBe(0.5);
    // Second note unchanged (last note)
    expect(result[1].duration).toBe(0.3);
  });

  it('should add overlap when specified (different pitches)', () => {
    const notes = [
      makeNote(0, 0.3, 60),
      makeNote(0.5, 0.3, 64),
    ];

    const result = applyLegato(notes, { overlap: 50, maxGap: 0.5 });

    // First note should extend to 0.5 + 0.05 (50ms overlap)
    expect(result[0].duration).toBeCloseTo(0.55, 5);
  });

  it('should merge same-pitch notes to avoid retriggering', () => {
    const notes = [
      makeNote(0, 0.3, 60),    // C4, ends at 0.3
      makeNote(0.5, 0.3, 60),  // C4 again, starts at 0.5
    ];

    const result = applyLegato(notes, { overlap: 20, maxGap: 0.5 });

    // Should merge into single note
    expect(result.length).toBe(1);
    expect(result[0].time).toBe(0);
    expect(result[0].duration).toBe(0.8); // 0 to 0.8 (0.5 + 0.3)
    expect(result[0].midi).toBe(60);
  });

  it('should not apply legato if gap exceeds maxGap', () => {
    const notes = [
      makeNote(0, 0.2, 60),    // ends at 0.2, gap of 0.8 to next
      makeNote(1.0, 0.3, 64),  // starts at 1.0
    ];

    const result = applyLegato(notes, { overlap: 20, maxGap: 0.5 });

    // Gap is 0.8s which exceeds maxGap of 0.5s, so no change
    expect(result[0].duration).toBe(0.2);
    expect(result.length).toBe(2);
  });

  it('should not modify already overlapping notes', () => {
    const notes = [
      makeNote(0, 0.6, 60),    // ends at 0.6, overlaps next
      makeNote(0.5, 0.3, 64),  // starts at 0.5
    ];

    const result = applyLegato(notes, { overlap: 20, maxGap: 0.5 });

    // Already overlapping (gap is -0.1), so no change
    expect(result[0].duration).toBe(0.6);
  });

  it('should handle notes exactly touching (gap = 0)', () => {
    const notes = [
      makeNote(0, 0.5, 60),    // ends at 0.5
      makeNote(0.5, 0.3, 64),  // starts at 0.5
    ];

    const result = applyLegato(notes, { overlap: 30, maxGap: 0.5 });

    // Notes touch exactly, should add overlap
    expect(result[0].duration).toBeCloseTo(0.53, 5);
  });

  it('should process notes in time order regardless of input order', () => {
    const notes = [
      makeNote(0.5, 0.3, 64),  // second note (E4)
      makeNote(0, 0.3, 60),    // first note (C4)
    ];

    const result = applyLegato(notes, { overlap: 0, maxGap: 0.5 });

    // Should be sorted: first note at 0 extended to 0.5
    expect(result[0].time).toBe(0);
    expect(result[0].duration).toBe(0.5);
    expect(result[1].time).toBe(0.5);
    expect(result[1].duration).toBe(0.3);
  });

  it('should work with a sequence of different pitches', () => {
    const notes = [
      makeNote(0, 0.2, 60),
      makeNote(0.3, 0.2, 62),
      makeNote(0.6, 0.2, 64),
      makeNote(0.9, 0.2, 65),
    ];

    const result = applyLegato(notes, { overlap: 10, maxGap: 0.5 });

    // Each note (except last) should extend to next + 10ms overlap
    expect(result[0].duration).toBeCloseTo(0.31, 5);  // 0.3 + 0.01
    expect(result[1].duration).toBeCloseTo(0.31, 5);  // 0.3 + 0.01
    expect(result[2].duration).toBeCloseTo(0.31, 5);  // 0.3 + 0.01
    expect(result[3].duration).toBe(0.2);  // last note unchanged
  });

  it('should merge chain of same-pitch notes', () => {
    const notes = [
      makeNote(0, 0.2, 60),
      makeNote(0.3, 0.2, 60),
      makeNote(0.6, 0.2, 60),
    ];

    const result = applyLegato(notes, { overlap: 10, maxGap: 0.5 });

    // All same pitch, should merge into one
    expect(result.length).toBe(1);
    expect(result[0].time).toBe(0);
    expect(result[0].duration).toBe(0.8); // 0 to 0.8
  });

  it('should use max velocity when merging same-pitch notes', () => {
    const notes = [
      { midi: 60, time: 0, duration: 0.2, velocity: 0.5 },
      { midi: 60, time: 0.3, duration: 0.2, velocity: 0.9 },
    ];

    const result = applyLegato(notes, { overlap: 10, maxGap: 0.5 });

    expect(result.length).toBe(1);
    expect(result[0].velocity).toBe(0.9);
  });
});
