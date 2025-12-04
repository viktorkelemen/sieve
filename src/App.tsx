import { useState } from 'react';
import { MidiFileLoader } from './components/MidiFileLoader';
import { NotesList } from './components/NotesList';
import { PianoRoll } from './components/PianoRoll';
import { Transport } from './components/Transport';
import { Note } from './player';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div id="app">
      <MidiFileLoader onLoad={setNotes} />
      <PianoRoll notes={notes} isPlaying={isPlaying} />
      <NotesList notes={notes} />
      <Transport notes={notes} onPlayingChange={setIsPlaying} />
    </div>
  );
}
