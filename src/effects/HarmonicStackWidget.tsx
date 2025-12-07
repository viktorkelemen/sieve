import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { HarmonicStackOptions, HarmonicStackMode } from './harmonicStack';

const styles = stylex.create({
  checkbox: {
    width: 14,
    height: 14,
    cursor: 'pointer',
    margin: 0,
  },
});

interface HarmonicStackWidgetProps {
  onChange: (enabled: boolean, options: HarmonicStackOptions) => void;
}

export function HarmonicStackWidget({ onChange }: HarmonicStackWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<HarmonicStackMode>('octave');
  const [detuneSpread, setDetuneSpread] = useState(12);
  const [velocityScale, setVelocityScale] = useState(0.8);
  const [spreadChannels, setSpreadChannels] = useState(false);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { mode, detuneSpread, velocityScale, spreadChannels });
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as HarmonicStackMode;
    setMode(value);
    if (enabled) {
      onChange(enabled, { mode: value, detuneSpread, velocityScale, spreadChannels });
    }
  };

  const handleDetuneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDetuneSpread(value);
    if (enabled) {
      onChange(enabled, { mode, detuneSpread: value, velocityScale, spreadChannels });
    }
  };

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVelocityScale(value);
    if (enabled) {
      onChange(enabled, { mode, detuneSpread, velocityScale: value, spreadChannels });
    }
  };

  const handleSpreadChannelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setSpreadChannels(value);
    if (enabled) {
      onChange(enabled, { mode, detuneSpread, velocityScale, spreadChannels: value });
    }
  };

  return (
    <EffectCard title="Harmonic Stack" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Mode</span>
        <select value={mode} onChange={handleModeChange} {...stylex.props(sliderStyle)}>
          <optgroup label="Basic">
            <option value="detune">Detune (Supersaw)</option>
            <option value="octave">Octave</option>
            <option value="fifth">Fifth</option>
            <option value="powerChord">Power Chord</option>
          </optgroup>
          <optgroup label="Thirds">
            <option value="majorThird">Major Third</option>
            <option value="minorThird">Minor Third</option>
          </optgroup>
          <optgroup label="Triads">
            <option value="triad">Major Triad</option>
            <option value="minorTriad">Minor Triad</option>
            <option value="sus2">Sus2</option>
            <option value="sus4">Sus4</option>
          </optgroup>
          <optgroup label="Extended">
            <option value="seventh">Major 7th</option>
            <option value="minorSeventh">Minor 7th</option>
            <option value="add9">Add9</option>
          </optgroup>
          <optgroup label="Parallel">
            <option value="parallelFifths">Parallel Fifths</option>
            <option value="doubleOctave">Double Octave</option>
          </optgroup>
          <optgroup label="Experimental">
            <option value="harmonicSeries">Harmonic Series</option>
            <option value="quartal">Quartal</option>
            <option value="cluster">Cluster</option>
          </optgroup>
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
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Multi-channel</span>
        <input
          type="checkbox"
          checked={spreadChannels}
          onChange={handleSpreadChannelsChange}
          {...stylex.props(styles.checkbox)}
        />
      </label>
    </EffectCard>
  );
}
