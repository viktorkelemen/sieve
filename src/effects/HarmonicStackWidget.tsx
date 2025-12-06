import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { HarmonicStackOptions, HarmonicStackMode } from './harmonicStack';

interface HarmonicStackWidgetProps {
  onChange: (enabled: boolean, options: HarmonicStackOptions) => void;
}

export function HarmonicStackWidget({ onChange }: HarmonicStackWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<HarmonicStackMode>('octave');
  const [detuneSpread, setDetuneSpread] = useState(12);
  const [velocityScale, setVelocityScale] = useState(0.8);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { mode, detuneSpread, velocityScale });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as HarmonicStackMode;
    setMode(value);
    if (enabled) {
      onChange(enabled, { mode: value, detuneSpread, velocityScale });
    }
  };

  const handleDetuneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDetuneSpread(value);
    if (enabled) {
      onChange(enabled, { mode, detuneSpread: value, velocityScale });
    }
  };

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVelocityScale(value);
    if (enabled) {
      onChange(enabled, { mode, detuneSpread, velocityScale: value });
    }
  };

  return (
    <EffectCard title="Harmonic Stack" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Mode</span>
        <select value={mode} onChange={handleModeChange} {...stylex.props(sliderStyle)}>
          <option value="detune">Detune (Supersaw)</option>
          <option value="octave">Octave</option>
          <option value="fifth">Fifth</option>
          <option value="powerChord">Power Chord</option>
        </select>
      </label>
      {mode === 'detune' && (
        <label {...stylex.props(labelStyle)}>
          <span {...stylex.props(labelTextStyle)}>Spread: {detuneSpread}¢</span>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={detuneSpread}
            onChange={handleDetuneChange}
            {...stylex.props(sliderStyle)}
          />
        </label>
      )}
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Layer Vol: {Math.round(velocityScale * 100)}%</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={velocityScale}
          onChange={handleVelocityChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
