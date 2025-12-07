import { useEffect, useRef, useState } from 'react';
import { Note, onPositionChange } from '../player';

interface PianoRollProps {
  notes: Note[];
  isPlaying: boolean;
}

const NOTE_HEIGHT = 8;
const PIXELS_PER_SECOND = 100;

// Channel color palette: [active, inactive] pairs
// Designed for harmonic stack visualization (root + layers)
const CHANNEL_COLORS: Array<[string, string]> = [
  ['#4a9eff', '#2d5a8a'], // Ch 0: Blue (root)
  ['#ff9f4a', '#8a5a2d'], // Ch 1: Orange
  ['#4aff9f', '#2d8a5a'], // Ch 2: Green
  ['#9f4aff', '#5a2d8a'], // Ch 3: Purple
  ['#4afeff', '#2d8a8a'], // Ch 4: Cyan
  ['#ff4a9f', '#8a2d5a'], // Ch 5: Pink
  ['#feff4a', '#8a8a2d'], // Ch 6: Yellow
  ['#ff4a4a', '#8a2d2d'], // Ch 7: Red
];

const CHANNEL_NAMES = [
  'Ch 1', 'Ch 2', 'Ch 3', 'Ch 4', 'Ch 5', 'Ch 6', 'Ch 7', 'Ch 8',
];

function getChannelColor(channel: number, isActive: boolean): string {
  const colorPair = CHANNEL_COLORS[channel % CHANNEL_COLORS.length];
  return isActive ? colorPair[0] : colorPair[1];
}

export function PianoRoll({ notes, isPlaying }: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState(0);

  // Get note range for vertical positioning
  const minMidi = notes.length > 0 ? Math.min(...notes.map(n => n.midi)) : 60;
  const maxMidi = notes.length > 0 ? Math.max(...notes.map(n => n.midi)) : 72;
  const noteRange = maxMidi - minMidi + 1;

  // Find which channels are in use
  const activeChannels = [...new Set(notes.map(n => n.channel ?? 0))].sort((a, b) => a - b);

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

      const channel = note.channel ?? 0;
      ctx.fillStyle = getChannelColor(channel, isActive);
      ctx.fillRect(x, y, Math.max(w, 1), NOTE_HEIGHT - 1);
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
      {activeChannels.length > 1 && (
        <div className="channel-legend">
          {activeChannels.map(ch => (
            <span key={ch} className="channel-legend-item">
              <span
                className="channel-legend-swatch"
                style={{ backgroundColor: CHANNEL_COLORS[ch % CHANNEL_COLORS.length][0] }}
              />
              {CHANNEL_NAMES[ch % CHANNEL_NAMES.length]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
