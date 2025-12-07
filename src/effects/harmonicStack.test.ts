import { describe, it, expect } from 'vitest';
import { applyHarmonicStack } from './harmonicStack';
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

describe('applyHarmonicStack', () => {
  describe('octave mode', () => {
    it('doubles notes one octave up', () => {
      const notes = makeNotes(2);
      const result = applyHarmonicStack(notes, { mode: 'octave', detuneSpread: 12, velocityScale: 0.8 });

      expect(result).toHaveLength(4); // 2 original + 2 octave copies
      expect(result[0].midi).toBe(60); // Original
      expect(result[1].midi).toBe(72); // Octave up (+12)
      expect(result[2].midi).toBe(61); // Original
      expect(result[3].midi).toBe(73); // Octave up (+12)
    });

    it('applies velocity scale to stacked notes', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'octave', detuneSpread: 12, velocityScale: 0.5 });

      expect(result[0].velocity).toBe(0.8); // Original unchanged
      expect(result[1].velocity).toBe(0.4); // 0.8 * 0.5
    });
  });

  describe('fifth mode', () => {
    it('adds perfect fifth (+7 semitones)', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'fifth', detuneSpread: 12, velocityScale: 0.8 });

      expect(result).toHaveLength(2);
      expect(result[0].midi).toBe(60); // Original (C)
      expect(result[1].midi).toBe(67); // Fifth (G)
    });
  });

  describe('powerChord mode', () => {
    it('adds fifth and octave', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'powerChord', detuneSpread: 12, velocityScale: 0.8 });

      expect(result).toHaveLength(3);
      expect(result[0].midi).toBe(60); // Root
      expect(result[1].midi).toBe(67); // Fifth (+7)
      expect(result[2].midi).toBe(72); // Octave (+12)
    });

    it('applies velocity scale to all stacked notes', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'powerChord', detuneSpread: 12, velocityScale: 0.6 });

      expect(result[0].velocity).toBe(0.8); // Original
      expect(result[1].velocity).toBeCloseTo(0.48); // 0.8 * 0.6
      expect(result[2].velocity).toBeCloseTo(0.48); // 0.8 * 0.6
    });
  });

  describe('detune mode', () => {
    it('adds 4 detuned copies', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'detune', detuneSpread: 12, velocityScale: 0.8 });

      expect(result).toHaveLength(5); // 1 original + 4 detuned
    });

    it('applies detune spread in cents (converted to semitones)', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'detune', detuneSpread: 10, velocityScale: 0.8 });

      // Detune multipliers are [-1, -0.5, 0.5, 1] * spread
      // At spread=10: -10, -5, +5, +10 cents = -0.1, -0.05, +0.05, +0.1 semitones
      expect(result[0].midi).toBe(60); // Original
      expect(result[1].midi).toBeCloseTo(60 - 0.1); // -10 cents
      expect(result[2].midi).toBeCloseTo(60 - 0.05); // -5 cents
      expect(result[3].midi).toBeCloseTo(60 + 0.05); // +5 cents
      expect(result[4].midi).toBeCloseTo(60 + 0.1); // +10 cents
    });

    it('uses different detune spread values', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'detune', detuneSpread: 50, velocityScale: 0.8 });

      // At spread=50: multipliers give -50, -25, +25, +50 cents
      expect(result[1].midi).toBeCloseTo(60 - 0.5); // -50 cents
      expect(result[4].midi).toBeCloseTo(60 + 0.5); // +50 cents
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = applyHarmonicStack([], { mode: 'octave', detuneSpread: 12, velocityScale: 0.8 });
      expect(result).toHaveLength(0);
    });

    it('preserves note properties except midi and velocity', () => {
      const notes: Note[] = [{
        midi: 60,
        time: 1.5,
        duration: 0.3,
        velocity: 0.9,
      }];
      const result = applyHarmonicStack(notes, { mode: 'octave', detuneSpread: 12, velocityScale: 0.8 });

      expect(result[0].time).toBe(1.5);
      expect(result[0].duration).toBe(0.3);
      expect(result[1].time).toBe(1.5);
      expect(result[1].duration).toBe(0.3);
    });
  });

  describe('default options', () => {
    it('uses default mode=octave, detuneSpread=12, velocityScale=0.8', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes);

      expect(result).toHaveLength(2); // octave mode adds 1 copy
      expect(result[1].midi).toBe(72); // +12 semitones
      expect(result[1].velocity).toBeCloseTo(0.64); // 0.8 * 0.8
    });

    it('allows partial options override', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'fifth' });

      expect(result).toHaveLength(2);
      expect(result[1].midi).toBe(67); // fifth mode
    });
  });

  describe('spreadChannels', () => {
    it('assigns incrementing channels to each layer when enabled', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'powerChord', spreadChannels: true });

      expect(result).toHaveLength(3);
      expect(result[0].channel).toBeUndefined(); // Original keeps its channel
      expect(result[1].channel).toBe(1); // Fifth → ch1
      expect(result[2].channel).toBe(2); // Octave → ch2
    });

    it('keeps all notes on same channel when disabled', () => {
      const notes: Note[] = [{ midi: 60, time: 0, duration: 0.5, velocity: 0.8, channel: 3 }];
      const result = applyHarmonicStack(notes, { mode: 'octave', spreadChannels: false });

      expect(result[0].channel).toBe(3); // Original
      expect(result[1].channel).toBe(3); // Stacked note keeps base channel
    });

    it('respects base channel and increments from there', () => {
      const notes: Note[] = [{ midi: 60, time: 0, duration: 0.5, velocity: 0.8, channel: 5 }];
      const result = applyHarmonicStack(notes, { mode: 'triad', spreadChannels: true });

      expect(result).toHaveLength(3); // Root + 3rd + 5th
      expect(result[0].channel).toBe(5); // Original stays on ch5
      expect(result[1].channel).toBe(6); // 3rd → ch6
      expect(result[2].channel).toBe(7); // 5th → ch7
    });

    it('wraps channel numbers at 16', () => {
      const notes: Note[] = [{ midi: 60, time: 0, duration: 0.5, velocity: 0.8, channel: 14 }];
      const result = applyHarmonicStack(notes, { mode: 'triad', spreadChannels: true });

      expect(result[0].channel).toBe(14); // Original
      expect(result[1].channel).toBe(15); // 14 + 1 = 15
      expect(result[2].channel).toBe(0);  // (14 + 2) % 16 = 0
    });

    it('spreads channels in detune mode', () => {
      const notes = makeNotes(1);
      const result = applyHarmonicStack(notes, { mode: 'detune', spreadChannels: true });

      expect(result).toHaveLength(5); // 1 original + 4 detuned
      expect(result[0].channel).toBeUndefined(); // Original
      expect(result[1].channel).toBe(1);
      expect(result[2].channel).toBe(2);
      expect(result[3].channel).toBe(3);
      expect(result[4].channel).toBe(4);
    });
  });
});
