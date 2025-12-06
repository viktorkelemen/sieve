import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BreathPatternOptions, NoteSkipOptions, PointillistDecayOptions, HarmonicStackOptions, HarmonicStackMode, StutterOptions, VelocityHumanizeOptions } from '../effects';

const styles = stylex.create({
  paramLabel: {
    minWidth: 85,
    display: 'inline-block',
  },
});

interface EffectsPanelProps {
  onBreathPatternChange: (enabled: boolean, options: BreathPatternOptions) => void;
  onNoteSkipChange: (enabled: boolean, options: NoteSkipOptions) => void;
  onPointillistDecayChange: (enabled: boolean, options: PointillistDecayOptions) => void;
  onHarmonicStackChange: (enabled: boolean, options: HarmonicStackOptions) => void;
  onStutterChange: (enabled: boolean, options: StutterOptions) => void;
  onVelocityHumanizeChange: (enabled: boolean, options: VelocityHumanizeOptions) => void;
}

export function EffectsPanel({ onBreathPatternChange, onNoteSkipChange, onPointillistDecayChange, onHarmonicStackChange, onStutterChange, onVelocityHumanizeChange }: EffectsPanelProps) {
  // Breath Pattern state
  const [breathEnabled, setBreathEnabled] = useState(false);
  const [breathDuration, setBreathDuration] = useState(4);
  const [inhaleRatio, setInhaleRatio] = useState(0.6);

  // Note Skip state
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [skipPlay, setSkipPlay] = useState(1);
  const [skipSkip, setSkipSkip] = useState(1);
  const [skipOffset, setSkipOffset] = useState(0);

  // Pointillist Decay state
  const [decayEnabled, setDecayEnabled] = useState(false);
  const [decayFactor, setDecayFactor] = useState(0.5);

  // Harmonic Stack state
  const [stackEnabled, setStackEnabled] = useState(false);
  const [stackMode, setStackMode] = useState<HarmonicStackMode>('octave');
  const [detuneSpread, setDetuneSpread] = useState(12);
  const [velocityScale, setVelocityScale] = useState(0.8);

  // Stutter state
  const [stutterEnabled, setStutterEnabled] = useState(false);
  const [stutterReps, setStutterReps] = useState(3);
  const [stutterDecay, setStutterDecay] = useState(0.85);
  const [stutterGap, setStutterGap] = useState(0.1);

  // Velocity Humanize state
  const [humanizeEnabled, setHumanizeEnabled] = useState(false);
  const [humanizeAmount, setHumanizeAmount] = useState(0.1);
  const [accentEvery, setAccentEvery] = useState(0);
  const [accentStrength, setAccentStrength] = useState(0.2);

  const handleBreathToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setBreathEnabled(newEnabled);
    onBreathPatternChange(newEnabled, { breathDuration, inhaleRatio, fadeEdges: 0.3 });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBreathDuration(value);
    if (breathEnabled) {
      onBreathPatternChange(breathEnabled, { breathDuration: value, inhaleRatio, fadeEdges: 0.3 });
    }
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInhaleRatio(value);
    if (breathEnabled) {
      onBreathPatternChange(breathEnabled, { breathDuration, inhaleRatio: value, fadeEdges: 0.3 });
    }
  };

  const handleSkipToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setSkipEnabled(newEnabled);
    onNoteSkipChange(newEnabled, { play: skipPlay, skip: skipSkip, offset: skipOffset });
  };

  const handlePlayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipPlay(value);
    // Reset offset if it's >= cycle length
    const cycleLength = value + skipSkip;
    const newOffset = skipOffset >= cycleLength ? 0 : skipOffset;
    setSkipOffset(newOffset);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: value, skip: skipSkip, offset: newOffset });
    }
  };

  const handleSkipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipSkip(value);
    // Reset offset if it's >= cycle length
    const cycleLength = skipPlay + value;
    const newOffset = skipOffset >= cycleLength ? 0 : skipOffset;
    setSkipOffset(newOffset);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: skipPlay, skip: value, offset: newOffset });
    }
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSkipOffset(value);
    if (skipEnabled) {
      onNoteSkipChange(skipEnabled, { play: skipPlay, skip: skipSkip, offset: value });
    }
  };

  const handleDecayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setDecayEnabled(newEnabled);
    onPointillistDecayChange(newEnabled, { decayFactor, minDuration: 0.01 });
  };

  const handleDecayFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDecayFactor(value);
    if (decayEnabled) {
      // Only update local state for smooth UI
      // onPointillistDecayChange is called in onMouseUp
    }
  };

  const handleDecayFactorCommit = () => {
    if (decayEnabled) {
      onPointillistDecayChange(decayEnabled, { decayFactor, minDuration: 0.01 });
    }
  };

  const handleStackToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setStackEnabled(newEnabled);
    onHarmonicStackChange(newEnabled, { mode: stackMode, detuneSpread, velocityScale });
  };

  const handleStackModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as HarmonicStackMode;
    setStackMode(value);
    if (stackEnabled) {
      onHarmonicStackChange(stackEnabled, { mode: value, detuneSpread, velocityScale });
    }
  };

  const handleDetuneSpreadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDetuneSpread(value);
    if (stackEnabled) {
      onHarmonicStackChange(stackEnabled, { mode: stackMode, detuneSpread: value, velocityScale });
    }
  };

  const handleVelocityScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVelocityScale(value);
    if (stackEnabled) {
      onHarmonicStackChange(stackEnabled, { mode: stackMode, detuneSpread, velocityScale: value });
    }
  };

  const handleStutterToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setStutterEnabled(newEnabled);
    onStutterChange(newEnabled, { repetitions: stutterReps, velocityDecay: stutterDecay, gapRatio: stutterGap });
  };

  const handleStutterRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStutterReps(parseInt(e.target.value));
    // Only update local state for smooth UI - onStutterChange called in commit
  };

  const handleStutterDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStutterDecay(parseFloat(e.target.value));
    // Only update local state for smooth UI - onStutterChange called in commit
  };

  const handleStutterGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStutterGap(parseFloat(e.target.value));
    // Only update local state for smooth UI - onStutterChange called in commit
  };

  const handleStutterCommit = () => {
    if (stutterEnabled) {
      onStutterChange(stutterEnabled, { repetitions: stutterReps, velocityDecay: stutterDecay, gapRatio: stutterGap });
    }
  };

  const handleHumanizeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setHumanizeEnabled(newEnabled);
    onVelocityHumanizeChange(newEnabled, { amount: humanizeAmount, accentEvery, accentStrength });
  };

  const handleHumanizeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHumanizeAmount(parseFloat(e.target.value));
    // Only update local state for smooth UI - commit on release
  };

  const handleAccentEveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentEvery(parseInt(e.target.value));
    // Only update local state for smooth UI - commit on release
  };

  const handleAccentStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentStrength(parseFloat(e.target.value));
    // Only update local state for smooth UI - commit on release
  };

  const handleHumanizeCommit = () => {
    if (humanizeEnabled) {
      onVelocityHumanizeChange(humanizeEnabled, { amount: humanizeAmount, accentEvery, accentStrength });
    }
  };

  return (
    <section>
      <h2>Effects</h2>

      <div className="effects-grid">
        {/* Note Skip */}
        <div className={`effect-card ${skipEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={skipEnabled}
              onChange={handleSkipToggle}
            />
            <span>Note Skip</span>
          </div>
          <div className="effect-card-params">
            <label>
              Play: {skipPlay}
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={skipPlay}
                onChange={handlePlayChange}
              />
            </label>
            <label>
              Skip: {skipSkip}
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={skipSkip}
                onChange={handleSkipChange}
              />
            </label>
            <label>
              Offset: {skipOffset}
              <input
                type="range"
                min="0"
                max={skipPlay + skipSkip - 1}
                step="1"
                value={skipOffset}
                onChange={handleOffsetChange}
              />
            </label>
          </div>
        </div>

        {/* Stutter */}
        <div className={`effect-card ${stutterEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={stutterEnabled}
              onChange={handleStutterToggle}
            />
            <span>Stutter</span>
          </div>
          <div className="effect-card-params">
            <label>
              <span {...stylex.props(styles.paramLabel)}>Reps: {stutterReps}</span>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={stutterReps}
                onChange={handleStutterRepsChange}
                onMouseUp={handleStutterCommit}
                onTouchEnd={handleStutterCommit}
              />
            </label>
            <label>
              <span {...stylex.props(styles.paramLabel)}>Decay: {Math.round(stutterDecay * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={stutterDecay}
                onChange={handleStutterDecayChange}
                onMouseUp={handleStutterCommit}
                onTouchEnd={handleStutterCommit}
              />
            </label>
            <label>
              <span {...stylex.props(styles.paramLabel)}>Gap: {Math.round(stutterGap * 100)}%</span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={stutterGap}
                onChange={handleStutterGapChange}
                onMouseUp={handleStutterCommit}
                onTouchEnd={handleStutterCommit}
              />
            </label>
          </div>
        </div>

        {/* Velocity Humanize */}
        <div className={`effect-card ${humanizeEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={humanizeEnabled}
              onChange={handleHumanizeToggle}
            />
            <span>Humanize</span>
          </div>
          <div className="effect-card-params">
            <label>
              <span {...stylex.props(styles.paramLabel)}>Jitter: ±{Math.round(humanizeAmount * 100)}%</span>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={humanizeAmount}
                onChange={handleHumanizeAmountChange}
                onMouseUp={handleHumanizeCommit}
                onTouchEnd={handleHumanizeCommit}
              />
            </label>
            <label>
              <span {...stylex.props(styles.paramLabel)}>Accent: {accentEvery === 0 ? 'Off' : `1/${accentEvery}`}</span>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={accentEvery}
                onChange={handleAccentEveryChange}
                onMouseUp={handleHumanizeCommit}
                onTouchEnd={handleHumanizeCommit}
              />
            </label>
            {accentEvery > 0 && (
              <label>
                <span {...stylex.props(styles.paramLabel)}>Boost: +{Math.round(accentStrength * 100)}%</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={accentStrength}
                  onChange={handleAccentStrengthChange}
                  onMouseUp={handleHumanizeCommit}
                  onTouchEnd={handleHumanizeCommit}
                />
              </label>
            )}
          </div>
        </div>

        {/* Pointillist Decay */}
        <div className={`effect-card ${decayEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={decayEnabled}
              onChange={handleDecayToggle}
            />
            <span>Decay</span>
          </div>
          <div className="effect-card-params">
            <label>
              <span {...stylex.props(styles.paramLabel)}>Decay: {Math.round(decayFactor * 100)}%</span>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={decayFactor}
                onChange={handleDecayFactorChange}
                onMouseUp={handleDecayFactorCommit}
                onTouchEnd={handleDecayFactorCommit}
              />
            </label>
          </div>
        </div>

        {/* Harmonic Stack */}
        <div className={`effect-card ${stackEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={stackEnabled}
              onChange={handleStackToggle}
            />
            <span>Harmonic Stack</span>
          </div>
          <div className="effect-card-params">
            <label>
              Mode
              <select value={stackMode} onChange={handleStackModeChange}>
                <option value="detune">Detune (Supersaw)</option>
                <option value="octave">Octave</option>
                <option value="fifth">Fifth</option>
                <option value="powerChord">Power Chord</option>
              </select>
            </label>
            {stackMode === 'detune' && (
              <label>
                Spread: {detuneSpread}¢
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={detuneSpread}
                  onChange={handleDetuneSpreadChange}
                />
              </label>
            )}
            <label>
              Layer Vol: {Math.round(velocityScale * 100)}%
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={velocityScale}
                onChange={handleVelocityScaleChange}
              />
            </label>
          </div>
        </div>

        {/* Breath Pattern */}
        <div className={`effect-card ${breathEnabled ? 'enabled' : ''}`}>
          <div className="effect-card-header">
            <input
              type="checkbox"
              checked={breathEnabled}
              onChange={handleBreathToggle}
            />
            <span>Breath Pattern</span>
          </div>
          <div className="effect-card-params">
            <label>
              Cycle: {breathDuration.toFixed(1)}s
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={breathDuration}
                onChange={handleDurationChange}
              />
            </label>
            <label>
              Inhale: {Math.round(inhaleRatio * 100)}%
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={inhaleRatio}
                onChange={handleRatioChange}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
