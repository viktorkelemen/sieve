import { useState, useEffect } from 'react';
import { initMIDI, selectOutput, getInputs, getInputById } from '../midi-io';
import { play, stop, getIsPlaying, setLooping, onPlaybackEnd, updateNotes, Note } from '../player';
import { selectClockInput, isClockRunning, getClockState } from '../midi-clock';
import { setClockSyncEnabled, setClockSyncNotes } from '../clock-player';

interface TransportProps {
  notes: Note[];
  originalNotes: Note[];
  onPlayingChange: (isPlaying: boolean) => void;
}

export function Transport({ notes, originalNotes, onPlayingChange }: TransportProps) {
  const [outputs, setOutputs] = useState<WebMidi.MIDIOutput[]>([]);
  const [inputs, setInputs] = useState<WebMidi.MIDIInput[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState('');
  const [selectedClockInputId, setSelectedClockInputId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [clockSync, setClockSync] = useState(false);
  const [clockBpm, setClockBpm] = useState(0);

  useEffect(() => {
    initMIDI()
      .then(outputs => {
        setOutputs(outputs);
        setInputs(getInputs());
        // Auto-select first output if available
        if (outputs.length > 0 && !selectedOutputId) {
          setSelectedOutputId(outputs[0].id);
          selectOutput(outputs[0].id);
        }
      })
      .catch(err => console.error('MIDI init failed:', err));
  }, []);

  useEffect(() => {
    onPlaybackEnd(() => {
      setIsPlaying(false);
      onPlayingChange(false);
    });
  }, [onPlayingChange]);

  useEffect(() => {
    setLooping(loop);
  }, [loop]);

  // Update player notes when they change (e.g., from effects)
  useEffect(() => {
    updateNotes(notes);
    // Also update clock-synced player
    const duration = originalNotes.reduce((max, n) =>
      n.time + n.duration > max ? n.time + n.duration : max, 0);
    setClockSyncNotes(notes, duration);
  }, [notes, originalNotes]);

  // Handle clock input selection
  useEffect(() => {
    const input = selectedClockInputId ? getInputById(selectedClockInputId) : null;
    selectClockInput(input);
  }, [selectedClockInputId]);

  // Handle clock sync enable/disable
  useEffect(() => {
    setClockSyncEnabled(clockSync);
    if (clockSync) {
      // Stop regular playback when entering clock sync mode
      if (getIsPlaying()) {
        stop();
        setIsPlaying(false);
      }
    }
  }, [clockSync]);

  // Poll for clock BPM updates when clock sync is enabled
  useEffect(() => {
    if (!clockSync) return;

    const interval = setInterval(() => {
      const state = getClockState();
      setClockBpm(Math.round(state.bpm));
      // Update playing state based on clock running state
      const running = isClockRunning();
      if (running !== isPlaying) {
        setIsPlaying(running);
        onPlayingChange(running);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [clockSync, isPlaying, onPlayingChange]);

  const handleClockInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClockInputId(e.target.value);
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedOutputId(id);
    selectOutput(id);
  };

  const handlePlayStop = () => {
    if (getIsPlaying()) {
      stop();
      setIsPlaying(false);
      onPlayingChange(false);
    } else {
      // Calculate duration from original notes to keep loop length consistent
      const duration = originalNotes.reduce((max, n) =>
        n.time + n.duration > max ? n.time + n.duration : max, 0);
      play(notes, duration);
      setIsPlaying(true);
      onPlayingChange(true);
    }
  };

  const canPlay = originalNotes.length > 0 && selectedOutputId !== '' && !clockSync;
  const canClockSync = selectedOutputId !== '' && selectedClockInputId !== '';

  return (
    <section>
      <h2>MIDI Output</h2>
      <select value={selectedOutputId} onChange={handleOutputChange}>
        <option value="">Select MIDI output...</option>
        {outputs.map(output => (
          <option key={output.id} value={output.id}>
            {output.name || output.id}
          </option>
        ))}
      </select>
      <button onClick={handlePlayStop} disabled={!canPlay}>
        {isPlaying ? 'Stop' : 'Play'}
      </button>
      <label className="loop-label">
        <input
          type="checkbox"
          checked={loop}
          onChange={e => setLoop(e.target.checked)}
          disabled={clockSync}
        />
        Loop
      </label>

      <h2>MIDI Clock Sync</h2>
      <select value={selectedClockInputId} onChange={handleClockInputChange}>
        <option value="">Select clock source...</option>
        {inputs.map(input => (
          <option key={input.id} value={input.id}>
            {input.name || input.id}
          </option>
        ))}
      </select>
      <label className="loop-label">
        <input
          type="checkbox"
          checked={clockSync}
          onChange={e => setClockSync(e.target.checked)}
          disabled={!canClockSync}
        />
        Sync to external clock
      </label>
      {clockSync && clockBpm > 0 && (
        <span className="bpm-display">{clockBpm} BPM</span>
      )}
    </section>
  );
}
