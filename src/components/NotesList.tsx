import { Note } from '../player';

interface NotesListProps {
  notes: Note[];
}

function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const roundedMidi = Math.round(midi);
  const octave = Math.floor(roundedMidi / 12) - 1;
  const note = names[roundedMidi % 12];
  const cents = Math.round((midi - roundedMidi) * 100);
  const centsStr = cents !== 0 ? (cents > 0 ? `+${cents}` : `${cents}`) : '';
  return note + octave + centsStr;
}

export function NotesList({ notes }: NotesListProps) {
  return (
    <section>
      <h2>Notes</h2>
      <div className="notes-list">
        {notes.map((note, i) => (
          <div key={i} className="note">
            {i.toString().padStart(3, '0')} |{' '}
            {midiToNoteName(note.midi).padEnd(7)} |{' '}
            t: {note.time.toFixed(3)}s |{' '}
            dur: {note.duration.toFixed(3)}s |{' '}
            vel: {Math.round(note.velocity * 127).toString().padStart(3)} |{' '}
            ch: {((note.channel ?? 0) + 1).toString().padStart(2)}
          </div>
        ))}
      </div>
    </section>
  );
}
