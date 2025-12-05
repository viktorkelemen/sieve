import { useCallback, useEffect } from 'react';
import { Midi } from '@tonejs/midi';
import { Note } from '../player';

interface MidiFileLoaderProps {
  onLoad: (notes: Note[]) => void;
}

function parseMidi(arrayBuffer: ArrayBuffer): Note[] {
  const midi = new Midi(arrayBuffer);
  const notes: Note[] = [];

  midi.tracks.forEach(track => {
    track.notes.forEach(note => {
      notes.push({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity
      });
    });
  });

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

export function MidiFileLoader({ onLoad }: MidiFileLoaderProps) {
  // Load demo file on mount
  useEffect(() => {
    fetch('/demo.mid')
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const notes = parseMidi(buffer);
        onLoad(notes);
      })
      .catch(err => console.log('No demo file found:', err));
  }, [onLoad]);

  const parseMidiFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const notes = parseMidi(arrayBuffer);
    onLoad(notes);
  }, [onLoad]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseMidiFile(file);
  };

  return (
    <section>
      <h2>Load MIDI</h2>
      <input
        type="file"
        accept=".mid,.midi"
        onChange={handleFileInput}
      />
    </section>
  );
}
