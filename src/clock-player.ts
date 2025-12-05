// Clock-synced MIDI player - plays notes based on external MIDI clock
import { sendNoteOn, sendNoteOff, panic } from './midi-io';
import {
  onClockTick,
  onTransportChange,
  ticksToSeconds,
  getClockState,
} from './midi-clock';
import type { Note } from './player';

// Import position emitter from player to share with visualizations
import { emitPosition } from './player';

interface ActiveNote {
  midi: number;
  endTime: number; // When the note should end (in seconds)
}

let notes: Note[] = [];
let loopLength = 0;
let isEnabled = false;
let activeNotes: ActiveNote[] = [];
let lastPosition = 0;

export function setClockSyncEnabled(enabled: boolean): void {
  if (enabled && !isEnabled) {
    // Starting clock sync
    isEnabled = true;
    activeNotes = [];
    lastPosition = 0;
    onClockTick(handleClockTick);
    onTransportChange(handleTransportChange);
  } else if (!enabled && isEnabled) {
    // Stopping clock sync
    isEnabled = false;
    onClockTick(null);
    onTransportChange(null);
    panic();
    activeNotes = [];
  }
}

export function setClockSyncNotes(newNotes: Note[], duration?: number): void {
  notes = newNotes;
  loopLength =
    duration ??
    notes.reduce((max, n) => (n.time + n.duration > max ? n.time + n.duration : max), 0);
}

function handleTransportChange(event: 'start' | 'stop' | 'continue'): void {
  switch (event) {
    case 'start':
      activeNotes = [];
      lastPosition = 0;
      break;
    case 'stop':
      panic();
      activeNotes = [];
      break;
    case 'continue':
      // Continue from current position, keep active notes
      break;
  }
}

function handleClockTick(): void {
  if (!isEnabled || notes.length === 0) return;

  const state = getClockState();
  const rawPosition = ticksToSeconds(state.tickCount, state.bpm);
  const position = loopLength > 0 ? rawPosition % loopLength : rawPosition;

  // Detect loop wrap-around
  const isWrapping = position < lastPosition && loopLength > 0;
  if (isWrapping) {
    // We've looped - turn off all active notes
    for (const active of activeNotes) {
      sendNoteOff(active.midi);
    }
    activeNotes = [];
  }

  // Check for notes that should start
  // A note should start if its time is between lastPosition and position
  for (const note of notes) {
    let shouldTrigger = false;

    if (isWrapping) {
      // During wrap: trigger notes from lastPosition to loopLength, OR from 0 to position
      shouldTrigger =
        (note.time > lastPosition && note.time <= loopLength) ||
        (note.time >= 0 && note.time <= position);
    } else {
      // Normal case: trigger notes between lastPosition and position
      // Use >= for lastPosition to catch notes at exactly time 0 on first tick
      shouldTrigger = note.time > lastPosition && note.time <= position;
    }

    // Special case: first tick after start, catch notes at time 0
    if (lastPosition === 0 && position > 0 && note.time === 0) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      // Check if this note is already active (same MIDI number)
      const existingIndex = activeNotes.findIndex((a) => a.midi === note.midi);
      if (existingIndex !== -1) {
        // Turn off existing note first
        sendNoteOff(note.midi);
        activeNotes.splice(existingIndex, 1);
      }

      // Start the new note
      const velocity = Math.round(note.velocity * 127);
      sendNoteOn(note.midi, velocity);

      // Track when it should end
      let endTime = note.time + note.duration;
      // Handle notes that wrap around the loop
      if (loopLength > 0 && endTime > loopLength) {
        endTime = endTime % loopLength;
      }
      activeNotes.push({ midi: note.midi, endTime });
    }
  }

  // Check for notes that should end
  const stillActive: ActiveNote[] = [];
  for (const active of activeNotes) {
    // Note should end if position has passed its end time
    // Be careful with wrap-around
    const shouldEnd =
      (lastPosition < active.endTime && active.endTime <= position) ||
      // Handle case where note's endTime wrapped but position hasn't yet
      (active.endTime < lastPosition && active.endTime <= position && position < lastPosition);

    if (shouldEnd) {
      sendNoteOff(active.midi);
    } else {
      stillActive.push(active);
    }
  }
  activeNotes = stillActive;

  lastPosition = position;
  emitPosition(position);
}

export function isClockSyncEnabled(): boolean {
  return isEnabled;
}

export function getClockSyncLoopLength(): number {
  return loopLength;
}
