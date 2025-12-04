import { useState } from 'react';
import { BreathPatternOptions } from '../effects';

interface EffectsPanelProps {
  onBreathPatternChange: (enabled: boolean, options: BreathPatternOptions) => void;
}

export function EffectsPanel({ onBreathPatternChange }: EffectsPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [breathDuration, setBreathDuration] = useState(4);
  const [inhaleRatio, setInhaleRatio] = useState(0.6);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setEnabled(newEnabled);
    onBreathPatternChange(newEnabled, { breathDuration, inhaleRatio, fadeEdges: 0.3 });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBreathDuration(value);
    if (enabled) {
      onBreathPatternChange(enabled, { breathDuration: value, inhaleRatio, fadeEdges: 0.3 });
    }
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInhaleRatio(value);
    if (enabled) {
      onBreathPatternChange(enabled, { breathDuration, inhaleRatio: value, fadeEdges: 0.3 });
    }
  };

  return (
    <section>
      <h2>Effects</h2>
      <div className="effect-control">
        <label className="effect-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
          />
          Breath Pattern
        </label>
        {enabled && (
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
