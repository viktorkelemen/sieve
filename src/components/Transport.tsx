import { useState, useEffect } from 'react';
import { initMIDI, selectOutput } from '../midi-io';
import { play, stop, getIsPlaying, setLooping, onPlaybackEnd, Note } from '../player';

interface TransportProps {
  notes: Note[];
  onPlayingChange: (isPlaying: boolean) => void;
}

export function Transport({ notes, onPlayingChange }: TransportProps) {
  const [outputs, setOutputs] = useState<MIDIOutput[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);

  useEffect(() => {
    initMIDI()
      .then(setOutputs)
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
      play(notes);
      setIsPlaying(true);
      onPlayingChange(true);
    }
  };

  const canPlay = notes.length > 0 && selectedOutputId !== '';

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
        />
        Loop
      </label>
    </section>
  );
}
