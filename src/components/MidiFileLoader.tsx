import { useState, useCallback } from 'react';
import { Midi } from '@tonejs/midi';
import { Note } from '../player';

interface MidiFileLoaderProps {
  onLoad: (notes: Note[]) => void;
}

export function MidiFileLoader({ onLoad }: MidiFileLoaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const parseMidiFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
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
    onLoad(notes);
  }, [onLoad]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseMidiFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files[0];
    if (file && (file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
      parseMidiFile(file);
    }
  };

  return (
    <section>
      <h2>Load MIDI</h2>
      <input
        type="file"
        accept=".mid,.midi"
        onChange={handleFileInput}
      />
      <p
        className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        or drag and drop a MIDI file here
      </p>
    </section>
  );
}
