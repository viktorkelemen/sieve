import { useState } from 'react';
import { BreathPatternOptions, NoteSkipOptions } from '../effects';

interface EffectsPanelProps {
  onBreathPatternChange: (enabled: boolean, options: BreathPatternOptions) => void;
  onNoteSkipChange: (enabled: boolean, options: NoteSkipOptions) => void;
}

export function EffectsPanel({ onBreathPatternChange, onNoteSkipChange }: EffectsPanelProps) {
  // Breath Pattern state
  const [breathEnabled, setBreathEnabled] = useState(false);
  const [breathDuration, setBreathDuration] = useState(4);
  const [inhaleRatio, setInhaleRatio] = useState(0.6);

  // Note Skip state
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [skipEvery, setSkipEvery] = useState(2);
  const [skipOffset, setSkipOffset] = useState(0);

  const handleBreathToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setBreathEnabled(newEnabled);
    onBreathPatternChange(newEnabled, { breathDuration, inhaleRatio, fadeEdges: 0.3 });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBreathDuration(value);
    if (breathEnabled) {
      onBreathPatternChange(breathEnabled, { breathDuration: value, inhaleRatio, fadeEdges: 0.3 });
    }
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInhaleRatio(value);
    if (breathEnabled) {
      onBreathPatternChange(breathEnabled, { breathDuration, inhaleRatio: value, fadeEdges: 0.3 });
    }
  };

  const handleSkipToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setSkipEnabled(newEnabled);
    onNoteSkipChange(newEnabled, { every: skipEvery, offset: skipOffset });
  };

  const handleEveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipEvery(value);
    // Reset offset if it's >= every
    const newOffset = skipOffset >= value ? 0 : skipOffset;
    setSkipOffset(newOffset);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { every: value, offset: newOffset });
    }
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipOffset(value);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { every: skipEvery, offset: value });
    }
  };

  return (
    <section>
      <h2>Effects</h2>

      <div className="effect-control">
        <label className="effect-toggle">
          <input
            type="checkbox"
            checked={skipEnabled}
            onChange={handleSkipToggle}
          />
          Note Skip
        </label>
        {skipEnabled && (
          <div className="effect-params">
            <label>
              Every: {skipEvery}
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={skipEvery}
                onChange={handleEveryChange}
              />
            </label>
            <label>
              Offset: {skipOffset}
              <input
                type="range"
                min="0"
                max={skipEvery - 1}
                step="1"
                value={skipOffset}
                onChange={handleOffsetChange}
              />
            </label>
          </div>
        )}
      </div>

      <div className="effect-control">
        <label className="effect-toggle">
          <input
            type="checkbox"
            checked={breathEnabled}
            onChange={handleBreathToggle}
          />
          Breath Pattern
        </label>
        {breathEnabled && (
          <div className="effect-params">
            <label>
              Cycle: {breathDuration.toFixed(1)}s
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={breathDuration}
                onChange={handleDurationChange}
              />
            </label>
            <label>
              Inhale: {Math.round(inhaleRatio * 100)}%
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={inhaleRatio}
                onChange={handleRatioChange}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
