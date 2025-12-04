import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { Note } from '../player';

interface ScoreViewProps {
  notes: Note[];
}

// Convert MIDI note number to VexFlow note name
function midiToVexFlow(midi: number): { key: string; accidental?: string } {
  const noteNames = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
  const accidentals = [null, '#', null, '#', null, null, '#', null, '#', null, '#', null];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const noteName = noteNames[noteIndex];
  const accidental = accidentals[noteIndex];

  return {
    key: `${noteName}/${octave}`,
    accidental: accidental || undefined
  };
}

// Quantize duration to nearest note value
function quantizeDuration(durationSec: number, bpm: number = 120): string {
  const beatDuration = 60 / bpm; // duration of quarter note in seconds
  const beats = durationSec / beatDuration;

  if (beats >= 3.5) return 'w';      // whole
  if (beats >= 1.5) return 'h';      // half
  if (beats >= 0.75) return 'q';     // quarter
  if (beats >= 0.375) return '8';    // eighth
  if (beats >= 0.1875) return '16';  // sixteenth
  return '32';                        // thirty-second
}

// Group notes that occur at the same time (chords)
function groupNotesIntoChords(notes: Note[], threshold: number = 0.05): Note[][] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const groups: Note[][] = [];
  let currentGroup: Note[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].time - sorted[i - 1].time < threshold) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);

  return groups;
}

export function ScoreView({ notes }: ScoreViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);

    // Group notes into chords
    const noteGroups = groupNotesIntoChords(notes);

    // Calculate dimensions
    const notesPerStave = 8;
    const staveCount = Math.ceil(noteGroups.length / notesPerStave);
    const staveWidth = 400;
    const staveHeight = 120;
    const width = staveWidth + 50;
    const height = staveCount * staveHeight + 50;

    renderer.resize(width, height);
    const context = renderer.getContext();

    // Create staves and render notes
    for (let s = 0; s < staveCount; s++) {
      const stave = new Stave(10, s * staveHeight + 10, staveWidth);
      if (s === 0) {
        stave.addClef('treble');
      }
      stave.setContext(context).draw();

      // Get notes for this stave
      const startIdx = s * notesPerStave;
      const endIdx = Math.min(startIdx + notesPerStave, noteGroups.length);
      const staveNoteGroups = noteGroups.slice(startIdx, endIdx);

      if (staveNoteGroups.length === 0) continue;

      // Create VexFlow notes
      const vexNotes: StaveNote[] = staveNoteGroups.map(group => {
        // Use the longest note duration in the chord
        const maxDuration = Math.max(...group.map(n => n.duration));
        const duration = quantizeDuration(maxDuration);

        // Get all keys for the chord
        const keys = group.map(n => midiToVexFlow(n.midi));

        const staveNote = new StaveNote({
          keys: keys.map(k => k.key),
          duration: duration,
        });

        // Add accidentals
        keys.forEach((k, i) => {
          if (k.accidental) {
            staveNote.addModifier(new Accidental(k.accidental), i);
          }
        });

        return staveNote;
      });

      // Create voice and format
      try {
        const voice = new Voice({ num_beats: staveNoteGroups.length, beat_value: 4 })
          .setStrict(false)
          .addTickables(vexNotes);

        new Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
        voice.draw(context, stave);
      } catch (e) {
        console.warn('VexFlow rendering error:', e);
      }
    }
  }, [notes]);

  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>Score</h2>
      <div className="score-container" ref={containerRef} />
    </section>
  );
}
