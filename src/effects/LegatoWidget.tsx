import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { LegatoOptions } from './legato';

interface LegatoWidgetProps {
  onChange: (enabled: boolean, options: LegatoOptions) => void;
  disabled?: boolean;
}

export function LegatoWidget({ onChange, disabled }: LegatoWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [overlap, setOverlap] = useState(20);
  const [maxGap, setMaxGap] = useState(0.5);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { overlap, maxGap });
  };

  const handleOverlapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverlap(parseInt(e.target.value));
  };

  const handleMaxGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxGap(parseFloat(e.target.value));
  };

  const handleCommit = () => {
    if (enabled) {
      onChange(enabled, { overlap, maxGap });
    }
  };

  return (
    <EffectCard title="Legato" enabled={enabled} onToggle={handleToggle} disabled={disabled}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Overlap: {overlap}ms</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={overlap}
          onChange={handleOverlapChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Max gap: {(maxGap * 1000).toFixed(0)}ms</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={maxGap}
          onChange={handleMaxGapChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
