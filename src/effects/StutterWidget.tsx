import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { StutterOptions } from './stutter';

interface StutterWidgetProps {
  onChange: (enabled: boolean, options: StutterOptions) => void;
  disabled?: boolean;
}

export function StutterWidget({ onChange, disabled }: StutterWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [reps, setReps] = useState(3);
  const [decay, setDecay] = useState(0.85);
  const [gap, setGap] = useState(0.1);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { repetitions: reps, velocityDecay: decay, gapRatio: gap });
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReps(parseInt(e.target.value));
  };

  const handleDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDecay(parseFloat(e.target.value));
  };

  const handleGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGap(parseFloat(e.target.value));
  };

  const handleCommit = () => {
    if (enabled) {
      onChange(enabled, { repetitions: reps, velocityDecay: decay, gapRatio: gap });
    }
  };

  return (
    <EffectCard title="Stutter" enabled={enabled} onToggle={handleToggle} disabled={disabled}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Reps: {reps}</span>
        <input
          type="range"
          min="2"
          max="5"
          step="1"
          value={reps}
          onChange={handleRepsChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Decay: {Math.round(decay * 100)}%</span>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={decay}
          onChange={handleDecayChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Gap: {Math.round(gap * 100)}%</span>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={gap}
          onChange={handleGapChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
