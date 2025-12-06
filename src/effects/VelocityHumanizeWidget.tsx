import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { VelocityHumanizeOptions } from './velocityHumanize';

interface VelocityHumanizeWidgetProps {
  onChange: (enabled: boolean, options: VelocityHumanizeOptions) => void;
}

export function VelocityHumanizeWidget({ onChange }: VelocityHumanizeWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState(0.1);
  const [accentEvery, setAccentEvery] = useState(0);
  const [accentStrength, setAccentStrength] = useState(0.2);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { amount, accentEvery, accentStrength });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value));
  };

  const handleAccentEveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentEvery(parseInt(e.target.value));
  };

  const handleAccentStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentStrength(parseFloat(e.target.value));
  };

  const handleCommit = () => {
    if (enabled) {
      onChange(enabled, { amount, accentEvery, accentStrength });
    }
  };

  return (
    <EffectCard title="Humanize" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Jitter: ±{Math.round(amount * 100)}%</span>
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.01"
          value={amount}
          onChange={handleAmountChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Accent: {accentEvery === 0 ? 'Off' : `1/${accentEvery}`}</span>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={accentEvery}
          onChange={handleAccentEveryChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
      {accentEvery > 0 && (
        <label {...stylex.props(labelStyle)}>
          <span {...stylex.props(labelTextStyle)}>Boost: +{Math.round(accentStrength * 100)}%</span>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={accentStrength}
            onChange={handleAccentStrengthChange}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            {...stylex.props(sliderStyle)}
          />
        </label>
      )}
    </EffectCard>
  );
}
