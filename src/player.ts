// Simple scheduler for MIDI playback
import { sendNoteOn, sendNoteOff, panic } from './midi-io';

export interface Note {
  midi: number;
  time: number;      // in seconds
  duration: number;  // in seconds
  velocity: number;  // 0-1
  channel?: number;  // 0-15 (default 0)
}

let isPlaying = false;
let isLooping = false;
let currentNotes: Note[] = [];
let scheduledEvents: number[] = []; // timeout IDs
let playStartTime = 0;
let loopLength = 0;
let positionCallback: ((time: number) => void) | null = null;
let animationFrameId: number | null = null;

export function setLooping(loop: boolean): void {
  isLooping = loop;
}

export function getIsLooping(): boolean {
  return isLooping;
}

export function play(notes: Note[], duration?: number): void {
  if (isPlaying) stop();

  isPlaying = true;
  currentNotes = notes;
  playStartTime = performance.now();
  loopLength = duration ?? notes.reduce((max, n) =>
    n.time + n.duration > max ? n.time + n.duration : max, 0);
  scheduleNotes(notes);
  startPositionUpdates();
}

function startPositionUpdates(): void {
  const update = () => {
    if (!isPlaying) return;

    const elapsed = (performance.now() - playStartTime) / 1000;
    const position = loopLength > 0 ? elapsed % loopLength : elapsed;
    positionCallback?.(position);

    animationFrameId = requestAnimationFrame(update);
  };
  update();
}

export function onPositionChange(callback: (time: number) => void): void {
  positionCallback = callback;
}

// Allow external sources (like clock-player) to update position
export function emitPosition(time: number): void {
  positionCallback?.(time);
}

export function getLoopLength(): number {
  return loopLength;
}

function scheduleNotes(notes: Note[]): void {
  // Clear any existing scheduled events
  scheduledEvents.forEach(id => window.clearTimeout(id));
  scheduledEvents = [];

  // Minimum duration to ensure gates are registered (approx 5ms)
  const MIN_DURATION = 0.005;

  // Schedule all notes
  notes.forEach(note => {
    // Enforce minimum duration
    const duration = Math.max(note.duration, MIN_DURATION);

    const noteOnTime = note.time * 1000; // convert to ms
    const noteOffTime = (note.time + duration) * 1000;
    const velocity = Math.round(note.velocity * 127);
    const channel = note.channel || 0;

    // Schedule note on
    const onId = window.setTimeout(() => {
      if (isPlaying) {
        sendNoteOn(note.midi, velocity, channel);
      }
    }, noteOnTime);
    scheduledEvents.push(onId);

    // Schedule note off
    const offId = window.setTimeout(() => {
      if (isPlaying) {
        sendNoteOff(note.midi, channel);
      }
    }, noteOffTime);
    scheduledEvents.push(offId);
  });

  // Schedule end of playback or loop restart
  const endId = window.setTimeout(() => {
    if (isPlaying && isLooping) {
      playStartTime = performance.now();
      scheduleNotes(currentNotes);
    } else {
      isPlaying = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      onStopCallback?.();
    }
  }, loopLength * 1000 + 50);
  scheduledEvents.push(endId);
}

let onStopCallback: (() => void) | null = null;

export function onPlaybackEnd(callback: () => void): void {
  onStopCallback = callback;
}

export function stop(): void {
  isPlaying = false;

  // Clear all scheduled events
  scheduledEvents.forEach(id => window.clearTimeout(id));
  scheduledEvents = [];

  // Stop position updates
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Send all notes off
  panic();
}

export function getIsPlaying(): boolean {
  return isPlaying;
}

export function updateNotes(notes: Note[]): void {
  currentNotes = notes;

  // If currently playing, reschedule from current position
  if (isPlaying) {
    const elapsed = (performance.now() - playStartTime) / 1000;
    const currentPosition = loopLength > 0 ? elapsed % loopLength : elapsed;

    // Clear existing scheduled events
    scheduledEvents.forEach(id => window.clearTimeout(id));
    scheduledEvents = [];

    // Schedule notes based on their state relative to current position
    const MIN_DURATION = 0.005;

    notes.forEach(note => {
      // Enforce minimum duration
      const duration = Math.max(note.duration, MIN_DURATION);
      const noteEndTime = note.time + duration;
      const channel = note.channel || 0;

      if (note.time > currentPosition) {
        // Note hasn't started yet - schedule both on and off
        const noteOnTime = (note.time - currentPosition) * 1000;
        const noteOffTime = (noteEndTime - currentPosition) * 1000;
        const velocity = Math.round(note.velocity * 127);

        const onId = window.setTimeout(() => {
          if (isPlaying) {
            sendNoteOn(note.midi, velocity, channel);
          }
        }, noteOnTime);
        scheduledEvents.push(onId);
        const offId = window.setTimeout(() => {
          if (isPlaying) {
            sendNoteOff(note.midi, channel);
          }
        }, noteOffTime);
        scheduledEvents.push(offId);
      } else if (noteEndTime > currentPosition) {
        // Note is currently playing - schedule only the note-off
        const noteOffTime = (noteEndTime - currentPosition) * 1000;

        const offId = window.setTimeout(() => {
          if (isPlaying) {
            sendNoteOff(note.midi, channel);
          }
        }, noteOffTime);
        scheduledEvents.push(offId);
      }
    });

    // Reschedule the loop end
    const timeToEnd = (loopLength - currentPosition) * 1000 + 50;
    const endId = window.setTimeout(() => {
      if (isPlaying && isLooping) {
        playStartTime = performance.now();
        scheduleNotes(currentNotes);
      } else {
        isPlaying = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        onStopCallback?.();
      }
    }, timeToEnd);
    scheduledEvents.push(endId);
  }
}
