import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EffectCard, labelStyle, labelTextStyle, sliderStyle } from './EffectCard';
import { VoiceAllocationOptions } from './voiceAllocation';

interface VoiceAllocationWidgetProps {
  onChange: (enabled: boolean, options: VoiceAllocationOptions) => void;
}

export function VoiceAllocationWidget({ onChange }: VoiceAllocationWidgetProps) {
  const [enabled, setEnabled] = useState(false);
  const [maxVoices, setMaxVoices] = useState(4);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onChange(newEnabled, { maxVoices });
  };

  const handleMaxVoicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxVoices(parseInt(e.target.value));
  };

  const handleCommit = () => {
    if (enabled) {
      onChange(enabled, { maxVoices });
    }
  };

  return (
    <EffectCard title="Voice Allocation" enabled={enabled} onToggle={handleToggle}>
      <label {...stylex.props(labelStyle)}>
        <span {...stylex.props(labelTextStyle)}>Max Voices: {maxVoices}</span>
        <input
          type="range"
          min="2"
          max="8"
          step="1"
          value={maxVoices}
          onChange={handleMaxVoicesChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          {...stylex.props(sliderStyle)}
        />
      </label>
    </EffectCard>
  );
}
