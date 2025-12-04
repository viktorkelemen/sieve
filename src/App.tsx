import { useState } from 'react';
import { MidiFileLoader } from './components/MidiFileLoader';
import { NotesList } from './components/NotesList';
import { Transport } from './components/Transport';
import { Note } from './player';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  return (
    <div id="app">
      <MidiFileLoader onLoad={setNotes} />
      <NotesList notes={notes} />
      <Transport notes={notes} />
    </div>
  );
}
