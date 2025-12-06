import { useState, useEffect, useRef } from 'react';
import { initMIDI, selectOutput, getInputs, getInputById } from '../midi-io';
import { play, stop, getIsPlaying, setLooping, onPlaybackEnd, updateNotes, Note } from '../player';
import {
  initAudioClock,
  setAudioClockEnabled,
  setAudioClockInput,
  setAudioClockNotes,
  onAudioClockBpm,
  onAudioClockRunning,
  isAudioClockSupported,
  resumeAudioContext,
  destroyAudioClock,
} from '../audio/audio-clock';

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
  const [audioClockReady, setAudioClockReady] = useState(false);
  const [audioClockSupported, setAudioClockSupported] = useState(true);
  const audioClockInitialized = useRef(false);

  // Initialize MIDI
  useEffect(() => {
    initMIDI()
      .then(outputs => {
        setOutputs(outputs);
        const midiInputs = getInputs();
        setInputs(midiInputs);
        if (outputs.length > 0 && !selectedOutputId) {
          setSelectedOutputId(outputs[0].id);
          selectOutput(outputs[0].id);
        }
        // Auto-select first clock input
        if (midiInputs.length > 0 && !selectedClockInputId) {
          setSelectedClockInputId(midiInputs[0].id);
        }
      })
      .catch(err => console.error('MIDI init failed:', err));

    // Check AudioWorklet support
    setAudioClockSupported(isAudioClockSupported());
  }, []);

  // Initialize AudioWorklet clock (requires user interaction)
  useEffect(() => {
    if (!audioClockInitialized.current && selectedClockInputId && audioClockSupported) {
      audioClockInitialized.current = true;
      initAudioClock()
        .then(success => {
          setAudioClockReady(success);
          if (!success) {
            setAudioClockSupported(false);
          }
        })
        .catch(() => {
          setAudioClockSupported(false);
        });
    }

    // Cleanup on unmount
    return () => {
      if (audioClockInitialized.current) {
        destroyAudioClock();
        audioClockInitialized.current = false;
      }
    };
  }, [selectedClockInputId, audioClockSupported]);

  // Set up audio clock callbacks
  useEffect(() => {
    onAudioClockBpm(bpm => setClockBpm(bpm));
    onAudioClockRunning(running => {
      setIsPlaying(running);
      onPlayingChange(running);
    });
  }, [onPlayingChange]);

  useEffect(() => {
    onPlaybackEnd(() => {
      setIsPlaying(false);
      onPlayingChange(false);
    });
  }, [onPlayingChange]);

  useEffect(() => {
    setLooping(loop);
  }, [loop]);

  // Update player notes when they change
  useEffect(() => {
    updateNotes(notes);
    // Also update audio clock player (re-send when audioClockReady changes)
    const duration = originalNotes.reduce((max, n) =>
      n.time + n.duration > max ? n.time + n.duration : max, 0);
    setAudioClockNotes(notes, duration);
  }, [notes, originalNotes, audioClockReady]);

  // Handle clock input selection
  useEffect(() => {
    if (selectedClockInputId && audioClockReady) {
      const input = getInputById(selectedClockInputId);
      if (input) {
        setAudioClockInput(input);
      }
    }
  }, [selectedClockInputId, audioClockReady]);

  // Auto-enable clock sync when ready
  useEffect(() => {
    if (audioClockReady && selectedClockInputId && selectedOutputId && !clockSync) {
      setClockSync(true);
    }
  }, [audioClockReady, selectedClockInputId, selectedOutputId]);

  // Handle clock sync enable/disable
  useEffect(() => {
    setAudioClockEnabled(clockSync);
    if (clockSync) {
      // Resume audio context (required after user interaction)
      resumeAudioContext();
      // Stop regular playback when entering clock sync mode
      if (getIsPlaying()) {
        stop();
        setIsPlaying(false);
      }
    }
  }, [clockSync]);

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
  const canClockSync = selectedOutputId !== '' && selectedClockInputId !== '' && audioClockReady;

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

      <h2>MIDI Clock Sync (AudioWorklet)</h2>
      {!audioClockSupported && (
        <p className="clock-warning">
          SharedArrayBuffer not available. Enable cross-origin isolation or use Chrome/Firefox.
        </p>
      )}
      <select
        value={selectedClockInputId}
        onChange={handleClockInputChange}
        disabled={!audioClockSupported}
      >
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
      {clockSync && audioClockReady && (
        <span className="clock-status"> (AudioWorklet)</span>
      )}
    </section>
  );
}
