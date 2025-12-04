// Simple scheduler for MIDI playback
import { sendNoteOn, sendNoteOff, panic } from './midi-io';

export interface Note {
  midi: number;
  time: number;      // in seconds
  duration: number;  // in seconds
  velocity: number;  // 0-1
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

export function play(notes: Note[]): void {
  if (isPlaying) stop();

  isPlaying = true;
  currentNotes = notes;
  playStartTime = performance.now();
  loopLength = notes.reduce((max, n) =>
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

export function getLoopLength(): number {
  return loopLength;
}

function scheduleNotes(notes: Note[]): void {
  // Clear any existing scheduled events
  scheduledEvents.forEach(id => window.clearTimeout(id));
  scheduledEvents = [];

  // Schedule all notes
  notes.forEach(note => {
    const noteOnTime = note.time * 1000; // convert to ms
    const noteOffTime = (note.time + note.duration) * 1000;
    const velocity = Math.round(note.velocity * 127);

    // Schedule note on
    const onId = window.setTimeout(() => {
      if (isPlaying) {
        sendNoteOn(note.midi, velocity);
      }
    }, noteOnTime);
    scheduledEvents.push(onId);

    // Schedule note off
    const offId = window.setTimeout(() => {
      if (isPlaying) {
        sendNoteOff(note.midi);
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
