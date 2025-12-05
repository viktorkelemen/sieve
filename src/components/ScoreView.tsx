import { useEffect, useRef, useState } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector } from 'vexflow';
import { Note, onPositionChange } from '../player';

interface ScoreViewProps {
  notes: Note[];
  isPlaying: boolean;
}

const SCALE = 0.8;
const NOTE_SPACING = 28;
const CLEF_WIDTH = 60;
const GRAND_STAFF_HEIGHT = 220; // Height for both staves together
const TREBLE_OFFSET = 30;
const BASS_OFFSET = 110;
const PADDING = 40;
const MIDDLE_C = 60; // MIDI note number for middle C - split point

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
  const beatDuration = 60 / bpm;
  const beats = durationSec / beatDuration;

  if (beats >= 3.5) return 'w';
  if (beats >= 1.5) return 'h';
  if (beats >= 0.75) return 'q';
  if (beats >= 0.375) return '8';
  if (beats >= 0.1875) return '16';
  return '32';
}

interface ChordGroup {
  time: number;
  trebleNotes: Note[];
  bassNotes: Note[];
  duration: number;
}

// Group notes by time and split into treble/bass
function groupNotesIntoChords(notes: Note[], threshold: number = 0.05): ChordGroup[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const groups: ChordGroup[] = [];
  let currentGroup: Note[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].time - sorted[i - 1].time < threshold) {
      currentGroup.push(sorted[i]);
    } else {
      // Split into treble and bass
      const treble = currentGroup.filter(n => n.midi >= MIDDLE_C);
      const bass = currentGroup.filter(n => n.midi < MIDDLE_C);
      const maxDuration = Math.max(...currentGroup.map(n => n.duration));

      groups.push({
        time: currentGroup[0].time,
        trebleNotes: treble,
        bassNotes: bass,
        duration: maxDuration
      });

      currentGroup = [sorted[i]];
    }
  }

  // Don't forget the last group
  const treble = currentGroup.filter(n => n.midi >= MIDDLE_C);
  const bass = currentGroup.filter(n => n.midi < MIDDLE_C);
  const maxDuration = Math.max(...currentGroup.map(n => n.duration));
  groups.push({
    time: currentGroup[0].time,
    trebleNotes: treble,
    bassNotes: bass,
    duration: maxDuration
  });

  return groups;
}

function createStaveNote(notesArr: Note[], duration: string, clef: 'treble' | 'bass'): StaveNote | null {
  if (notesArr.length === 0) return null;

  const keys = notesArr.map(n => midiToVexFlow(n.midi));

  const staveNote = new StaveNote({
    keys: keys.map(k => k.key),
    duration: duration,
    clef: clef
  });

  keys.forEach((k, i) => {
    if (k.accidental) {
      staveNote.addModifier(new Accidental(k.accidental), i);
    }
  });

  return staveNote;
}

export function ScoreView({ notes, isPlaying }: ScoreViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const chordGroupsRef = useRef<ChordGroup[]>([]);
  const notesPerLineRef = useRef(16);

  useEffect(() => {
    onPositionChange(setPosition);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateWidth = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.clientWidth - 20);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Playhead position
  useEffect(() => {
    if (!playheadRef.current || !isPlaying) return;

    const chordGroups = chordGroupsRef.current;
    const notesPerLine = notesPerLineRef.current;
    if (chordGroups.length === 0) return;

    let noteIndex = 0;
    for (let i = 0; i < chordGroups.length; i++) {
      if (chordGroups[i].time <= position) {
        noteIndex = i;
      } else {
        break;
      }
    }

    const lineIndex = Math.floor(noteIndex / notesPerLine);
    const posInLine = noteIndex % notesPerLine;

    const x = (CLEF_WIDTH + posInLine * NOTE_SPACING + 15) * SCALE;
    const y = lineIndex * GRAND_STAFF_HEIGHT * SCALE;
    playheadRef.current.style.transform = `translate(${x}px, ${y}px)`;
    playheadRef.current.style.height = `${GRAND_STAFF_HEIGHT * SCALE}px`;
  }, [position, isPlaying]);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0 || containerWidth < 100) return;

    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);

    const chordGroups = groupNotesIntoChords(notes);
    chordGroupsRef.current = chordGroups;

    const staveWidth = (containerWidth / SCALE) - PADDING;
    const notesPerLine = Math.max(8, Math.floor((staveWidth - CLEF_WIDTH - PADDING) / NOTE_SPACING));
    notesPerLineRef.current = notesPerLine;

    const lineCount = Math.ceil(chordGroups.length / notesPerLine);
    const width = staveWidth + PADDING;
    const height = lineCount * GRAND_STAFF_HEIGHT;

    renderer.resize(width * SCALE, height * SCALE);
    const context = renderer.getContext();
    context.scale(SCALE, SCALE);

    for (let line = 0; line < lineCount; line++) {
      const startIdx = line * notesPerLine;
      const endIdx = Math.min(startIdx + notesPerLine, chordGroups.length);
      const lineChordGroups = chordGroups.slice(startIdx, endIdx);

      if (lineChordGroups.length === 0) continue;

      const yBase = line * GRAND_STAFF_HEIGHT;

      // Create treble stave
      const trebleStave = new Stave(10, yBase + TREBLE_OFFSET, staveWidth);
      if (line === 0) {
        trebleStave.addClef('treble');
      }
      trebleStave.setContext(context).draw();

      // Create bass stave
      const bassStave = new Stave(10, yBase + BASS_OFFSET, staveWidth);
      if (line === 0) {
        bassStave.addClef('bass');
      }
      bassStave.setContext(context).draw();

      // Draw brace connector on first line
      if (line === 0) {
        const brace = new StaveConnector(trebleStave, bassStave);
        brace.setType('brace');
        brace.setContext(context).draw();

        const lineConnector = new StaveConnector(trebleStave, bassStave);
        lineConnector.setType('singleLeft');
        lineConnector.setContext(context).draw();
      }

      // Create notes for treble voice
      const trebleVexNotes: StaveNote[] = [];
      const bassVexNotes: StaveNote[] = [];

      lineChordGroups.forEach(group => {
        const duration = quantizeDuration(group.duration);

        // Treble notes (or rest)
        if (group.trebleNotes.length > 0) {
          const note = createStaveNote(group.trebleNotes, duration, 'treble');
          if (note) trebleVexNotes.push(note);
        } else {
          trebleVexNotes.push(new StaveNote({ keys: ['b/4'], duration: duration + 'r', clef: 'treble' }));
        }

        // Bass notes (or rest)
        if (group.bassNotes.length > 0) {
          const note = createStaveNote(group.bassNotes, duration, 'bass');
          if (note) bassVexNotes.push(note);
        } else {
          bassVexNotes.push(new StaveNote({ keys: ['d/3'], duration: duration + 'r', clef: 'bass' }));
        }
      });

      // Draw treble voice
      try {
        if (trebleVexNotes.length > 0) {
          const trebleVoice = new Voice({ numBeats: lineChordGroups.length, beatValue: 4 })
            .setStrict(false)
            .addTickables(trebleVexNotes);
          new Formatter().joinVoices([trebleVoice]).format([trebleVoice], staveWidth - CLEF_WIDTH - 30);
          trebleVoice.draw(context, trebleStave);
        }
      } catch (e) {
        console.warn('Treble voice error:', e);
      }

      // Draw bass voice
      try {
        if (bassVexNotes.length > 0) {
          const bassVoice = new Voice({ numBeats: lineChordGroups.length, beatValue: 4 })
            .setStrict(false)
            .addTickables(bassVexNotes);
          new Formatter().joinVoices([bassVoice]).format([bassVoice], staveWidth - CLEF_WIDTH - 30);
          bassVoice.draw(context, bassStave);
        }
      } catch (e) {
        console.warn('Bass voice error:', e);
      }
    }
  }, [notes, containerWidth]);

  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>Score</h2>
      <div className="score-container" ref={wrapperRef}>
        <div className="score-wrapper">
          <div ref={containerRef} />
          {isPlaying && (
            <div ref={playheadRef} className="score-playhead" />
          )}
        </div>
      </div>
    </section>
  );
}
