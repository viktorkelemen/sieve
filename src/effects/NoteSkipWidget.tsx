import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { NoteSkipOptions } from './noteSkip';

interface NoteSkipWidgetProps {
  onChange: (enabled: boolean, options: NoteSkipOptions) => void;
}

export function NoteSkipWidget({ onChange }: NoteSkipWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [play, setPlay] = useState(1);
  const [skip, setSkip] = useState(1);
  const [offset, setOffset] = useState(0);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { play, skip, offset });
  };

  const handlePlayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPlay(value);
    const cycleLength = value + skip;
    const newOffset = offset >= cycleLength ? 0 : offset;
    setOffset(newOffset);
    if (enabled) {
      onChange(enabled, { play: value, skip, offset: newOffset });
    }
  };

  const handleSkipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkip(value);
    const cycleLength = play + value;
    const newOffset = offset >= cycleLength ? 0 : offset;
    setOffset(newOffset);
    if (enabled) {
      onChange(enabled, { play, skip: value, offset: newOffset });
    }
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setOffset(value);
    if (enabled) {
      onChange(enabled, { play, skip, offset: value });
    }
  };

  return (
    <EffectCard title="Note Skip" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Play: {play}</span>
        <input
          type="range"
          min="1"
          max="8"
          step="1"
          value={play}
          onChange={handlePlayChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Skip: {skip}</span>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={skip}
          onChange={handleSkipChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Offset: {offset}</span>
        <input
          type="range"
          min="0"
          max={play + skip - 1}
          step="1"
          value={offset}
          onChange={handleOffsetChange}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
