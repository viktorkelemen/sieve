import { useState } from 'react';
import { BreathPatternOptions, NoteSkipOptions, PointillistDecayOptions } from '../effects';

interface EffectsPanelProps {
  onBreathPatternChange: (enabled: boolean, options: BreathPatternOptions) => void;
  onNoteSkipChange: (enabled: boolean, options: NoteSkipOptions) => void;
  onPointillistDecayChange: (enabled: boolean, options: PointillistDecayOptions) => void;
}

export function EffectsPanel({ onBreathPatternChange, onNoteSkipChange, onPointillistDecayChange }: EffectsPanelProps) {
  // Breath Pattern state
  const [breathEnabled, setBreathEnabled] = useState(false);
  const [breathDuration, setBreathDuration] = useState(4);
  const [inhaleRatio, setInhaleRatio] = useState(0.6);

  // Note Skip state
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [skipPlay, setSkipPlay] = useState(1);
  const [skipSkip, setSkipSkip] = useState(1);
  const [skipOffset, setSkipOffset] = useState(0);

  // Pointillist Decay state
  const [decayEnabled, setDecayEnabled] = useState(false);
  const [decayFactor, setDecayFactor] = useState(0.5);

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
    onNoteSkipChange(newEnabled, { play: skipPlay, skip: skipSkip, offset: skipOffset });
  };

  const handlePlayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipPlay(value);
    // Reset offset if it's >= cycle length
    const cycleLength = value + skipSkip;
    const newOffset = skipOffset >= cycleLength ? 0 : skipOffset;
    setSkipOffset(newOffset);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: value, skip: skipSkip, offset: newOffset });
    }
  };

  const handleSkipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipSkip(value);
    // Reset offset if it's >= cycle length
    const cycleLength = skipPlay + value;
    const newOffset = skipOffset >= cycleLength ? 0 : skipOffset;
    setSkipOffset(newOffset);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: skipPlay, skip: value, offset: newOffset });
    }
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipOffset(value);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: skipPlay, skip: skipSkip, offset: value });
    }
  };

  const handleDecayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setDecayEnabled(newEnabled);
    onPointillistDecayChange(newEnabled, { decayFactor, minDuration: 0.01 });
  };

  const handleDecayFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDecayFactor(value);
    if (decayEnabled) {
      onPointillistDecayChange(decayEnabled, { decayFactor: value, minDuration: 0.01 });
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
              Play: {skipPlay}
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={skipPlay}
                onChange={handlePlayChange}
              />
            </label>
            <label>
              Skip: {skipSkip}
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={skipSkip}
                onChange={handleSkipChange}
              />
            </label>
            <label>
              Offset: {skipOffset}
              <input
                type="range"
                min="0"
                max={skipPlay + skipSkip - 1}
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
            checked={decayEnabled}
            onChange={handleDecayToggle}
          />
          Pointillist Decay
        </label>
        {decayEnabled && (
          <div className="effect-params">
            <label>
              Decay: {Math.round(decayFactor * 100)}%
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={decayFactor}
                onChange={handleDecayFactorChange}
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
