import * as stylex from '@stylexjs/stylex';
import {
  BreathPatternOptions,
  NoteSkipOptions,
  PointillistDecayOptions,
  HarmonicStackOptions,
  StutterOptions,
  VelocityHumanizeOptions,
  LegatoOptions,
  NoteSkipWidget,
  StutterWidget,
  VelocityHumanizeWidget,
  DecayWidget,
  HarmonicStackWidget,
  BreathPatternWidget,
  LegatoWidget,
} from '../effects';

const styles = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
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
  legatoDisabled,
  stutterDisabled,
  decayDisabled,
}: EffectsPanelProps) {
  return (
    <section>
      <h2>Effects</h2>
      <div {...stylex.props(styles.grid)}>
        <NoteSkipWidget onChange={onNoteSkipChange} />
        <StutterWidget onChange={onStutterChange} disabled={stutterDisabled} />
        <VelocityHumanizeWidget onChange={onVelocityHumanizeChange} />
        <DecayWidget onChange={onPointillistDecayChange} disabled={decayDisabled} />
        <HarmonicStackWidget onChange={onHarmonicStackChange} />
        <BreathPatternWidget onChange={onBreathPatternChange} />
        <LegatoWidget onChange={onLegatoChange} disabled={legatoDisabled} />
      </div>
    </section>
  );
}
