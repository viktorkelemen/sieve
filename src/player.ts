// Simple scheduler for MIDI playback
import { sendNoteOn, sendNoteOff, panic } from './midi-io';

export interface Note {
  midi: number;
  time: number;      // in seconds
  duration: number;  // in seconds
  velocity: number;  // 0-1
}

let isPlaying = false;
let startTime = 0;
let scheduledEvents: number[] = []; // timeout IDs

export function play(notes: Note[], bpm: number = 120): void {
  if (isPlaying) stop();

  isPlaying = true;
  startTime = performance.now();

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

  // Schedule end of playback
  const lastNote = notes.reduce((max, n) =>
    n.time + n.duration > max ? n.time + n.duration : max, 0);
  const endId = window.setTimeout(() => {
    isPlaying = false;
    onStopCallback?.();
  }, lastNote * 1000 + 100);
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

  // Send all notes off
  panic();
}

export function getIsPlaying(): boolean {
  return isPlaying;
}
