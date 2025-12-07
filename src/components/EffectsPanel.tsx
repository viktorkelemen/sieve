import * as stylex from '@stylexjs/stylex';
import {
  BreathPatternOptions,
  NoteSkipOptions,
  PointillistDecayOptions,
  HarmonicStackOptions,
  StutterOptions,
  VelocityHumanizeOptions,
  LegatoOptions,
  VoiceAllocationOptions,
  NoteSkipWidget,
  StutterWidget,
  VelocityHumanizeWidget,
  DecayWidget,
  HarmonicStackWidget,
  BreathPatternWidget,
  LegatoWidget,
  VoiceAllocationWidget,
} from '../effects';

const styles = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
});

interface EffectsPanelProps {
  onBreathPatternChange: (enabled: boolean, options: BreathPatternOptions) => void;
  onNoteSkipChange: (enabled: boolean, options: NoteSkipOptions) => void;
  onPointillistDecayChange: (enabled: boolean, options: PointillistDecayOptions) => void;
  onHarmonicStackChange: (enabled: boolean, options: HarmonicStackOptions) => void;
  onStutterChange: (enabled: boolean, options: StutterOptions) => void;
  onVelocityHumanizeChange: (enabled: boolean, options: VelocityHumanizeOptions) => void;
  onLegatoChange: (enabled: boolean, options: LegatoOptions) => void;
  onVoiceAllocationChange: (enabled: boolean, options: VoiceAllocationOptions) => void;
  legatoDisabled?: boolean;
  stutterDisabled?: boolean;
  decayDisabled?: boolean;
}

export function EffectsPanel({
  onBreathPatternChange,
  onNoteSkipChange,
  onPointillistDecayChange,
  onHarmonicStackChange,
  onStutterChange,
  onVelocityHumanizeChange,
  onLegatoChange,
  onVoiceAllocationChange,
  legatoDisabled,
  stutterDisabled,
  decayDisabled,
}: EffectsPanelProps) {
  return (
    <section>
      <h2>Effects</h2>
      <div {...stylex.props(styles.grid)}>
        <NoteSkipWidget onChange={onNoteSkipChange} />
        <VoiceAllocationWidget onChange={onVoiceAllocationChange} />
        <HarmonicStackWidget onChange={onHarmonicStackChange} />
        <LegatoWidget onChange={onLegatoChange} disabled={legatoDisabled} />
        <StutterWidget onChange={onStutterChange} disabled={stutterDisabled} />
        <VelocityHumanizeWidget onChange={onVelocityHumanizeChange} />
        <DecayWidget onChange={onPointillistDecayChange} disabled={decayDisabled} />
        <BreathPatternWidget onChange={onBreathPatternChange} />
      </div>
    </section>
  );
}
