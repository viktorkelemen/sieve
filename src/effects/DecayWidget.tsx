import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { PointillistDecayOptions } from './pointillistDecay';

interface DecayWidgetProps {
  onChange: (enabled: boolean, options: PointillistDecayOptions) => void;
  disabled?: boolean;
}

export function DecayWidget({ onChange, disabled }: DecayWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [decayFactor, setDecayFactor] = useState(0.5);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { decayFactor, minDuration: 0.01 });
  };

  const handleDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDecayFactor(parseFloat(e.target.value));
  };

  const handleCommit = () => {
    if (enabled) {
      onChange(enabled, { decayFactor, minDuration: 0.01 });
    }
  };

  return (
    <EffectCard title="Decay" enabled={enabled} onToggle={handleToggle} disabled={disabled}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Decay: {Math.round(decayFactor * 100)}%</span>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={decayFactor}
          onChange={handleDecayChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
