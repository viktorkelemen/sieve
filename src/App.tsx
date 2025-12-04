import { useState } from 'react';
import { MidiFileLoader } from './components/MidiFileLoader';
import { NotesList } from './components/NotesList';
import { PianoRoll } from './components/PianoRoll';
import { ScoreView } from './components/ScoreView';
import { Transport } from './components/Transport';
import { Note } from './player';

type ViewMode = 'pianoroll' | 'score';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('pianoroll');

  return (
    <div id="app">
      <MidiFileLoader onLoad={setNotes} />

      {notes.length > 0 && (
        <div className="view-toggle">
          <button
            className={viewMode === 'pianoroll' ? 'active' : ''}
            onClick={() => setViewMode('pianoroll')}
          >
            Piano Roll
          </button>
          <button
            className={viewMode === 'score' ? 'active' : ''}
            onClick={() => setViewMode('score')}
          >
            Score
          </button>
        </div>
      )}

      {viewMode === 'pianoroll' ? (
        <PianoRoll notes={notes} isPlaying={isPlaying} />
      ) : (
        <ScoreView notes={notes} isPlaying={isPlaying} />
      )}

      <NotesList notes={notes} />
      <Transport notes={notes} onPlayingChange={setIsPlaying} />
    </div>
  );
}
