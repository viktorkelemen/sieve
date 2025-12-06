import { useEffect, useRef, useState } from 'react';
import { Note, onPositionChange } from '../player';

interface PianoRollProps {
  notes: Note[];
  isPlaying: boolean;
}

const NOTE_HEIGHT = 8;
const PIXELS_PER_SECOND = 100;

export function PianoRoll({ notes, isPlaying }: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState(0);

  // Get note range for vertical positioning
  const minMidi = notes.length > 0 ? Math.min(...notes.map(n => n.midi)) : 60;
  const maxMidi = notes.length > 0 ? Math.max(...notes.map(n => n.midi)) : 72;
  const noteRange = maxMidi - minMidi + 1;

  // Calculate dimensions
  const loopLength = notes.length > 0
    ? notes.reduce((max, n) => Math.max(max, n.time + n.duration), 0)
    : 4;
  const width = Math.max(loopLength * PIXELS_PER_SECOND, 400);
  const height = noteRange * NOTE_HEIGHT + 20;

  useEffect(() => {
    onPositionChange(setPosition);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines (horizontal for each note)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= noteRange; i++) {
      const y = i * NOTE_HEIGHT + 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw notes
    notes.forEach(note => {
      const x = note.time * PIXELS_PER_SECOND;
      const y = (maxMidi - note.midi) * NOTE_HEIGHT + 10;
      const w = note.duration * PIXELS_PER_SECOND;

      // Check if note is currently playing
      const isActive = isPlaying &&
        position >= note.time &&
        position < note.time + note.duration;

      ctx.fillStyle = isActive ? '#4a9eff' : '#6b8aad';
      ctx.fillRect(x, y, Math.max(w - 1, 1), NOTE_HEIGHT - 1);
    });

    // Draw playhead
    if (isPlaying) {
      const playheadX = position * PIXELS_PER_SECOND;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [notes, position, isPlaying, width, height, noteRange, maxMidi]);

  if (notes.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>Piano Roll</h2>
      <div className="piano-roll-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
        />
      </div>
    </section>
  );
}
