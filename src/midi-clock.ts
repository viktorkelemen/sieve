// MIDI Clock receiver - handles incoming MIDI clock messages
// MIDI Clock runs at 24 PPQ (pulses per quarter note)

const MIDI_CLOCK = 0xf8;
const MIDI_START = 0xfa;
const MIDI_CONTINUE = 0xfb;
const MIDI_STOP = 0xfc;

const PPQ = 24; // Pulses per quarter note

interface ClockState {
  isRunning: boolean;
  tickCount: number;
  bpm: number;
  lastTickTime: number;
  tickTimes: number[]; // Rolling window for BPM estimation
}

type ClockCallback = (state: ClockState) => void;
type TransportCallback = (event: 'start' | 'stop' | 'continue') => void;

let clockState: ClockState = {
  isRunning: false,
  tickCount: 0,
  bpm: 120, // Default BPM estimate
  lastTickTime: 0,
  tickTimes: [],
};

let clockInput: WebMidi.MIDIInput | null = null;
let clockCallback: ClockCallback | null = null;
let transportCallback: TransportCallback | null = null;

const BPM_SAMPLE_SIZE = 96; // 4 beats of samples for smoother averaging

let smoothedBpm = 120;
const BPM_SMOOTHING = 0.1; // Lower = smoother, higher = more responsive

function estimateBPM(tickTimes: number[]): number {
  if (tickTimes.length < 2) return smoothedBpm;

  // Calculate average interval between ticks
  let totalInterval = 0;
  for (let i = 1; i < tickTimes.length; i++) {
    totalInterval += tickTimes[i] - tickTimes[i - 1];
  }
  const avgInterval = totalInterval / (tickTimes.length - 1);

  // Convert to BPM: interval is in ms, 24 ticks per beat
  // BPM = 60000 / (avgInterval * 24)
  const rawBpm = 60000 / (avgInterval * PPQ);

  // Clamp to reasonable range
  const clampedBpm = Math.max(20, Math.min(300, rawBpm));

  // Exponential smoothing to reduce jitter
  smoothedBpm = smoothedBpm + BPM_SMOOTHING * (clampedBpm - smoothedBpm);

  return smoothedBpm;
}

function handleMidiMessage(event: WebMidi.MIDIMessageEvent): void {
  if (!event.data) return;
  const [status] = event.data;

  switch (status) {
    case MIDI_CLOCK:
      handleClockTick();
      break;
    case MIDI_START:
      handleStart();
      break;
    case MIDI_CONTINUE:
      handleContinue();
      break;
    case MIDI_STOP:
      handleStop();
      break;
  }
}

function handleClockTick(): void {
  const now = performance.now();

  if (clockState.isRunning) {
    clockState.tickCount++;

    // Update tick times for BPM estimation
    clockState.tickTimes.push(now);
    if (clockState.tickTimes.length > BPM_SAMPLE_SIZE) {
      clockState.tickTimes.shift();
    }

    // Estimate BPM from tick intervals
    clockState.bpm = estimateBPM(clockState.tickTimes);
    clockState.lastTickTime = now;

    clockCallback?.(clockState);
  }
}

function handleStart(): void {
  clockState.isRunning = true;
  clockState.tickCount = 0;
  clockState.tickTimes = [];
  clockState.lastTickTime = performance.now();
  transportCallback?.('start');
}

function handleContinue(): void {
  clockState.isRunning = true;
  clockState.lastTickTime = performance.now();
  transportCallback?.('continue');
}

function handleStop(): void {
  clockState.isRunning = false;
  transportCallback?.('stop');
}

export function selectClockInput(input: WebMidi.MIDIInput | null): void {
  // Remove listener from previous input
  if (clockInput) {
    clockInput.onmidimessage = null;
  }

  clockInput = input;

  // Add listener to new input
  if (clockInput) {
    clockInput.onmidimessage = handleMidiMessage;
  }

  // Reset state when switching inputs
  clockState = {
    isRunning: false,
    tickCount: 0,
    bpm: 120,
    lastTickTime: 0,
    tickTimes: [],
  };
  smoothedBpm = 120;
}

export function onClockTick(callback: ClockCallback | null): void {
  clockCallback = callback;
}

export function onTransportChange(callback: TransportCallback | null): void {
  transportCallback = callback;
}

export function getClockState(): ClockState {
  return { ...clockState };
}

// Convert tick count to time in seconds at current BPM
export function ticksToSeconds(ticks: number, bpm: number): number {
  const beatsPerSecond = bpm / 60;
  const ticksPerSecond = beatsPerSecond * PPQ;
  return ticks / ticksPerSecond;
}

// Convert seconds to ticks at a given BPM
export function secondsToTicks(seconds: number, bpm: number): number {
  const beatsPerSecond = bpm / 60;
  const ticksPerSecond = beatsPerSecond * PPQ;
  return seconds * ticksPerSecond;
}

// Get current position in seconds
export function getCurrentPosition(): number {
  return ticksToSeconds(clockState.tickCount, clockState.bpm);
}

export function isClockRunning(): boolean {
  return clockState.isRunning;
}
