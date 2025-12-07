import { Note } from './types';

export interface VoiceAllocationOptions {
  maxVoices: number;  // Maximum number of channels to use (1-16)
}

const defaultOptions: VoiceAllocationOptions = {
  maxVoices: 4,
};

interface ActiveVoice {
  channel: number;
  endTime: number;
}

/**
 * Voice Allocation Effect
 *
 * Detects overlapping notes and assigns each concurrent voice to a
 * different MIDI channel. Uses a greedy algorithm: for each note,
 * find the lowest-numbered channel that's free (no active note).
 *
 * This enables routing polyphonic sequences to multiple mono synths,
 * with each voice going to a different channel/instrument.
 *
 * Example with maxVoices=4:
 *   Note C4 [0.0-0.5] → Ch 1
 *   Note E4 [0.2-0.7] → Ch 2 (C4 still active)
 *   Note G4 [0.4-0.9] → Ch 3 (C4, E4 still active)
 *   Note C5 [0.6-1.0] → Ch 1 (C4 ended, reuse Ch 1)
 */
export function applyVoiceAllocation(
  notes: Note[],
  options: Partial<VoiceAllocationOptions> = {}
): Note[] {
  const opts = { ...defaultOptions, ...options };
  const { maxVoices } = opts;

  if (notes.length === 0) return notes;

  // Sort notes by start time (stable sort preserves order for same time)
  const sortedNotes = [...notes].sort((a, b) => a.time - b.time);

  // Track active voices: which channels are occupied and until when
  const activeVoices: ActiveVoice[] = [];

  const result: Note[] = [];

  for (const note of sortedNotes) {
    // Free up any voices that have ended before this note starts
    const stillActive = activeVoices.filter(v => v.endTime > note.time);
    activeVoices.length = 0;
    activeVoices.push(...stillActive);

    // Find the lowest free channel
    const usedChannels = new Set(activeVoices.map(v => v.channel));
    let assignedChannel = 0;

    for (let ch = 0; ch < maxVoices; ch++) {
      if (!usedChannels.has(ch)) {
        assignedChannel = ch;
        break;
      }
    }

    // If all channels are busy, reuse the one that ends soonest
    if (usedChannels.size >= maxVoices) {
      const soonestEnding = activeVoices.reduce((min, v) =>
        v.endTime < min.endTime ? v : min
      );
      assignedChannel = soonestEnding.channel;
      // Remove the old voice we're replacing
      const idx = activeVoices.findIndex(v => v.channel === assignedChannel);
      if (idx !== -1) activeVoices.splice(idx, 1);
    }

    // Track this voice as active
    activeVoices.push({
      channel: assignedChannel,
      endTime: note.time + note.duration,
    });

    // Add note with assigned channel
    result.push({
      ...note,
      channel: assignedChannel,
    });
  }

  return result;
}
