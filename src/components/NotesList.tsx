import { Note } from '../player';

interface NotesListProps {
  notes: Note[];
}

function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = names[midi % 12];
  return note + octave;
}

export function NotesList({ notes }: NotesListProps) {
  return (
    <section>
      <h2>Notes</h2>
      <div className="notes-list">
        {notes.map((note, i) => (
          <div key={i} className="note">
            {i.toString().padStart(3, '0')} |{' '}
            {midiToNoteName(note.midi).padEnd(4)} |{' '}
            t: {note.time.toFixed(3)}s |{' '}
            dur: {note.duration.toFixed(3)}s |{' '}
            vel: {Math.round(note.velocity * 127)}
          </div>
        ))}
      </div>
    </section>
  );
}
