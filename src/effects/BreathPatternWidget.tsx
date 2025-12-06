import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { BreathPatternOptions } from './breathPattern';

interface BreathPatternWidgetProps {
  onChange: (enabled: boolean, options: BreathPatternOptions) => void;
}

export function BreathPatternWidget({ onChange }: BreathPatternWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState(4);
  const [inhaleRatio, setInhaleRatio] = useState(0.6);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { breathDuration: duration, inhaleRatio, fadeEdges: 0.3 });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDuration(value);
    if (enabled) {
      onChange(enabled, { breathDuration: value, inhaleRatio, fadeEdges: 0.3 });
    }
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInhaleRatio(value);
    if (enabled) {
      onChange(enabled, { breathDuration: duration, inhaleRatio: value, fadeEdges: 0.3 });
    }
  };

  return (
    <EffectCard title="Breath Pattern" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Cycle: {duration.toFixed(1)}s</span>
        <input
          type="range"
          min="1"
          max="8"
          step="0.5"
          value={duration}
          onChange={handleDurationChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Inhale: {Math.round(inhaleRatio * 100)}%</span>
        <input
          type="range"
          min="0.3"
          max="0.9"
          step="0.1"
          value={inhaleRatio}
          onChange={handleRatioChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
