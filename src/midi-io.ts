// WebMIDI handling

let midiAccess: MIDIAccess | null = null;
let selectedOutput: MIDIOutput | null = null;

export async function initMIDI(): Promise<MIDIOutput[]> {
  if (!navigator.requestMIDIAccess) {
    throw new Error('WebMIDI not supported in this browser');
  }

  midiAccess = await navigator.requestMIDIAccess();
  return getOutputs();
}

export function getOutputs(): MIDIOutput[] {
  if (!midiAccess) return [];
  return Array.from(midiAccess.outputs.values());
}

export function selectOutput(id: string): void {
  if (!midiAccess) return;
  selectedOutput = midiAccess.outputs.get(id) || null;
}

export function sendNoteOn(note: number, velocity: number, channel: number = 0): void {
  if (!selectedOutput) return;
  const status = 0x90 + channel; // Note on
  selectedOutput.send([status, note, velocity]);
}

export function sendNoteOff(note: number, channel: number = 0): void {
  if (!selectedOutput) return;
  const status = 0x80 + channel; // Note off
  selectedOutput.send([status, note, 0]);
}

export function panic(): void {
  // All notes off on all channels
  if (!selectedOutput) return;
  for (let ch = 0; ch < 16; ch++) {
    selectedOutput.send([0xB0 + ch, 123, 0]); // All notes off CC
  }
}
