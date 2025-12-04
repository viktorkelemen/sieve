import { Midi } from '@tonejs/midi';
import { initMIDI, getOutputs, selectOutput } from './midi-io';
import { play, stop, getIsPlaying, onPlaybackEnd, Note } from './player';

// State
let currentNotes: Note[] = [];

// DOM elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const dropZone = document.getElementById('drop-zone') as HTMLElement;
const notesList = document.getElementById('notes-list') as HTMLElement;
const outputSelect = document.getElementById('output-select') as HTMLSelectElement;
const playBtn = document.getElementById('play-btn') as HTMLButtonElement;

// Initialize MIDI
async function setupMIDI() {
  try {
    const outputs = await initMIDI();
    outputs.forEach(output => {
      const option = document.createElement('option');
      option.value = output.id;
      option.textContent = output.name || output.id;
      outputSelect.appendChild(option);
    });
  } catch (e) {
    console.error('MIDI init failed:', e);
    outputSelect.innerHTML = '<option>WebMIDI not available</option>';
  }
}

// Parse MIDI file
async function loadMidiFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  // Collect all notes from all tracks
  currentNotes = [];
  midi.tracks.forEach(track => {
    track.notes.forEach(note => {
      currentNotes.push({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity
      });
    });
  });

  // Sort by time
  currentNotes.sort((a, b) => a.time - b.time);

  displayNotes(currentNotes);
  updateButtons();
}

// Display notes in the UI
function displayNotes(notes: Note[]) {
  notesList.innerHTML = notes.map((note, i) => `
    <div class="note">
      ${i.toString().padStart(3, '0')} |
      ${midiToNoteName(note.midi).padEnd(4)} |
      t: ${note.time.toFixed(3)}s |
      dur: ${note.duration.toFixed(3)}s |
      vel: ${Math.round(note.velocity * 127)}
    </div>
  `).join('');
}

// Convert MIDI note number to name
function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = names[midi % 12];
  return note + octave;
}

// Update button states
function updateButtons() {
  const hasNotes = currentNotes.length > 0;
  const hasOutput = outputSelect.value !== '';
  playBtn.disabled = !hasNotes || !hasOutput;
  playBtn.textContent = getIsPlaying() ? 'Stop' : 'Play';
}

// Event listeners
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadMidiFile(file);
});

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
    loadMidiFile(file);
  }
});

outputSelect.addEventListener('change', () => {
  selectOutput(outputSelect.value);
  updateButtons();
});

playBtn.addEventListener('click', () => {
  if (getIsPlaying()) {
    stop();
  } else {
    play(currentNotes);
  }
  updateButtons();
});

onPlaybackEnd(() => {
  updateButtons();
});

// Initialize
setupMIDI();
