// Main thread coordinator for AudioWorklet-based MIDI clock
// Uses SharedArrayBuffer for low-latency communication with audio thread

import { sendNoteOn, sendNoteOff, panic } from '../midi-io';
import { emitPosition } from '../player';
import type { Note } from '../player';

// SharedArrayBuffer layout (Int32):
// [0]: Tick count
// [1]: Command (1=start, 2=stop, 3=continue, 0=none)
// [2]: Running state (reserved for future use)

const TICK_COUNT = 0;
const COMMAND = 1;

const CMD_START = 1;
const CMD_STOP = 2;
const CMD_CONTINUE = 3;

const MIDI_CLOCK = 0xf8;
const MIDI_START = 0xfa;
const MIDI_CONTINUE = 0xfb;
const MIDI_STOP = 0xfc;

let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedArray: Int32Array | null = null;
let clockInput: WebMidi.MIDIInput | null = null;
let isInitialized = false;
let isEnabled = false;

// Callbacks
let bpmCallback: ((bpm: number) => void) | null = null;
let runningCallback: ((running: boolean) => void) | null = null;

// Error handler reference for cleanup
let processorErrorHandler: ((event: Event) => void) | null = null;

export async function initAudioClock(): Promise<boolean> {
  if (isInitialized) return true;

  // Check for SharedArrayBuffer support
  if (typeof SharedArrayBuffer === 'undefined') {
    console.warn('SharedArrayBuffer not supported - falling back to regular clock');
    return false;
  }

  try {
    // Create audio context
    audioContext = new AudioContext();

    // Create shared buffer (3 Int32 values used, 1 reserved)
    sharedBuffer = new SharedArrayBuffer(16);
    sharedArray = new Int32Array(sharedBuffer);

    // Load worklet module from public folder
    await audioContext.audioWorklet.addModule('/clock-processor.js');

    // Create worklet node
    workletNode = new AudioWorkletNode(audioContext, 'clock-processor');

    // Handle messages from worklet
    workletNode.port.onmessage = handleWorkletMessage;

    // Handle worklet errors
    processorErrorHandler = (err: Event) => {
      console.error('AudioWorklet processor error:', err);
      isInitialized = false;
    };
    workletNode.addEventListener('processorerror', processorErrorHandler);

    // Send shared buffer to worklet
    workletNode.port.postMessage({ type: 'init', buffer: sharedBuffer });

    // Connect to destination (required to keep worklet running)
    // Use a silent gain node to avoid any audio output
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    workletNode.connect(silentGain);
    silentGain.connect(audioContext.destination);

    isInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to initialize AudioWorklet clock:', err);
    return false;
  }
}

function handleWorkletMessage(event: MessageEvent) {
  const msg = event.data;

  switch (msg.type) {
    case 'ready':
      console.log('AudioWorklet clock ready');
      break;

    case 'noteOn':
      // Skip if disabled (prevents stuck notes from race with disable)
      if (!isEnabled) break;
      for (const note of msg.notes) {
        sendNoteOn(note.midi, note.velocity);
      }
      break;

    case 'noteOff':
      for (const midi of msg.notes) {
        sendNoteOff(midi);
      }
      break;

    case 'position':
      // Skip position updates if disabled
      if (!isEnabled) break;
      emitPosition(msg.position);
      bpmCallback?.(msg.bpm);
      break;
  }
}

export function setAudioClockEnabled(enabled: boolean): void {
  if (enabled === isEnabled) return;

  isEnabled = enabled;

  if (!enabled && sharedArray) {
    // Send stop command
    Atomics.store(sharedArray, COMMAND, CMD_STOP);
    panic();
  }
}

export function setAudioClockInput(input: WebMidi.MIDIInput | null): void {
  // Remove old listener
  if (clockInput) {
    clockInput.onmidimessage = null;
  }

  clockInput = input;

  if (clockInput) {
    clockInput.onmidimessage = handleMidiMessage;
  }

  // Reset state
  if (sharedArray) {
    Atomics.store(sharedArray, TICK_COUNT, 0);
    Atomics.store(sharedArray, COMMAND, CMD_STOP);
  }
}

function handleMidiMessage(event: WebMidi.MIDIMessageEvent): void {
  if (!event.data || !sharedArray || !isEnabled) return;

  const [status] = event.data;

  switch (status) {
    case MIDI_START:
      // Store command first, then reset tick count
      // Worklet handles any race by checking for abnormal ticksDelta
      Atomics.store(sharedArray, COMMAND, CMD_START);
      Atomics.store(sharedArray, TICK_COUNT, 0);
      runningCallback?.(true);
      break;

    case MIDI_CONTINUE:
      Atomics.store(sharedArray, COMMAND, CMD_CONTINUE);
      runningCallback?.(true);
      break;

    case MIDI_STOP:
      Atomics.store(sharedArray, COMMAND, CMD_STOP);
      runningCallback?.(false);
      break;

    case MIDI_CLOCK:
      // Increment tick count atomically (add returns old value, so +1 for new)
      // Reset if approaching Int32 overflow (worklet handles discontinuity gracefully)
      const newTick = Atomics.add(sharedArray, TICK_COUNT, 1) + 1;
      if (newTick > 1000000000) {
        Atomics.store(sharedArray, TICK_COUNT, 0);
      }
      break;
  }
}

export function setAudioClockNotes(notes: Note[], loopLength: number): void {
  if (!workletNode) return;

  // Send notes to worklet
  workletNode.port.postMessage({
    type: 'notes',
    notes: notes.map(n => ({
      midi: n.midi,
      time: n.time,
      duration: n.duration,
      velocity: n.velocity,
    })),
    loopLength,
  });
}

export function onAudioClockBpm(callback: (bpm: number) => void): void {
  bpmCallback = callback;
}

export function onAudioClockRunning(callback: (running: boolean) => void): void {
  runningCallback = callback;
}

export function isAudioClockSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined' && typeof AudioWorkletNode !== 'undefined';
}

export function isAudioClockInitialized(): boolean {
  return isInitialized;
}

export function isAudioClockEnabled(): boolean {
  return isEnabled;
}

// Resume audio context (required after user interaction)
export async function resumeAudioContext(): Promise<void> {
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

// Cleanup function to prevent memory leaks
export function destroyAudioClock(): void {
  // Disable first
  setAudioClockEnabled(false);

  // Remove MIDI input listener
  if (clockInput) {
    clockInput.onmidimessage = null;
    clockInput = null;
  }

  // Disconnect and cleanup worklet
  if (workletNode) {
    if (processorErrorHandler) {
      workletNode.removeEventListener('processorerror', processorErrorHandler);
      processorErrorHandler = null;
    }
    workletNode.port.onmessage = null;
    workletNode.disconnect();
    workletNode = null;
  }

  // Close audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Clear shared buffer references
  sharedBuffer = null;
  sharedArray = null;

  // Reset state
  isInitialized = false;
  isEnabled = false;
  bpmCallback = null;
  runningCallback = null;
}
