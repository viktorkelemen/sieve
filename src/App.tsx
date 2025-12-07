import { useState, useMemo } from 'react';
import { MidiFileLoader } from './components/MidiFileLoader';
import { NotesList } from './components/NotesList';
import { PianoRoll } from './components/PianoRoll';
import { ScoreView } from './components/ScoreView';
import { Transport } from './components/Transport';
import { EffectsPanel } from './components/EffectsPanel';
import { Note } from './player';
import { applyBreathPattern, applyNoteSkip, applyPointillistDecay, applyHarmonicStack, applyStutter, applyVelocityHumanize, applyLegato, BreathPatternOptions, NoteSkipOptions, PointillistDecayOptions, HarmonicStackOptions, StutterOptions, VelocityHumanizeOptions, LegatoOptions } from './effects';

type ViewMode = 'pianoroll' | 'score';

interface BreathSettings {
  enabled: boolean;
  options: BreathPatternOptions;
}

interface NoteSkipSettings {
  enabled: boolean;
  options: NoteSkipOptions;
}

interface PointillistDecaySettings {
  enabled: boolean;
  options: PointillistDecayOptions;
}

interface HarmonicStackSettings {
  enabled: boolean;
  options: HarmonicStackOptions;
}

interface StutterSettings {
  enabled: boolean;
  options: StutterOptions;
}

interface VelocityHumanizeSettings {
  enabled: boolean;
  options: VelocityHumanizeOptions;
}

interface LegatoSettings {
  enabled: boolean;
  options: LegatoOptions;
}

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('pianoroll');
  const [breathSettings, setBreathSettings] = useState<BreathSettings>({
    enabled: false,
    options: { breathDuration: 4, inhaleRatio: 0.6, fadeEdges: 0.3 },
  });
  const [noteSkipSettings, setNoteSkipSettings] = useState<NoteSkipSettings>({
    enabled: false,
    options: { play: 1, skip: 1, offset: 0 },
  });
  const [pointillistDecaySettings, setPointillistDecaySettings] = useState<PointillistDecaySettings>({
    enabled: false,
    options: { decayFactor: 0.5, minDuration: 0.01 },
  });
  const [harmonicStackSettings, setHarmonicStackSettings] = useState<HarmonicStackSettings>({
    enabled: false,
    options: { mode: 'octave', detuneSpread: 12, velocityScale: 0.8 },
  });
  const [stutterSettings, setStutterSettings] = useState<StutterSettings>({
    enabled: false,
    options: { repetitions: 3, velocityDecay: 0.85, gapRatio: 0.1 },
  });
  const [velocityHumanizeSettings, setVelocityHumanizeSettings] = useState<VelocityHumanizeSettings>({
    enabled: false,
    options: { amount: 0.1, accentEvery: 0, accentStrength: 0.2 },
  });
  const [legatoSettings, setLegatoSettings] = useState<LegatoSettings>({
    enabled: false,
    options: { overlap: 20, maxGap: 0.5 },
  });

  const processedNotes = useMemo(() => {
    let result = notes;

    // Apply Note Skip first (reduces note count)
    if (noteSkipSettings.enabled) {
      result = applyNoteSkip(result, noteSkipSettings.options);
    }

    // Apply Harmonic Stack (adds layered notes)
    if (harmonicStackSettings.enabled) {
      result = applyHarmonicStack(result, harmonicStackSettings.options);
    }

    // Apply Legato (extends notes to connect smoothly) - must run before Stutter/Decay
    if (legatoSettings.enabled) {
      result = applyLegato(result, legatoSettings.options);
    }

    // Apply Stutter (multiplies notes with rapid repetitions)
    if (stutterSettings.enabled) {
      result = applyStutter(result, stutterSettings.options);
    }

    // Apply Velocity Humanize (adds variation and accents)
    if (velocityHumanizeSettings.enabled) {
      result = applyVelocityHumanize(result, velocityHumanizeSettings.options);
    }

    // Apply Pointillist Decay (modifies duration)
    if (pointillistDecaySettings.enabled) {
      result = applyPointillistDecay(result, pointillistDecaySettings.options);
    }

    // Then apply Breath Pattern
    if (breathSettings.enabled) {
      result = applyBreathPattern(result, breathSettings.options);
    }

    return result;
  }, [notes, breathSettings, noteSkipSettings, pointillistDecaySettings, harmonicStackSettings, stutterSettings, velocityHumanizeSettings, legatoSettings]);

  const handleBreathPatternChange = (enabled: boolean, options: BreathPatternOptions) => {
    setBreathSettings({ enabled, options });
  };

  const handleNoteSkipChange = (enabled: boolean, options: NoteSkipOptions) => {
    setNoteSkipSettings({ enabled, options });
  };

  const handlePointillistDecayChange = (enabled: boolean, options: PointillistDecayOptions) => {
    setPointillistDecaySettings({ enabled, options });
  };

  const handleHarmonicStackChange = (enabled: boolean, options: HarmonicStackOptions) => {
    setHarmonicStackSettings({ enabled, options });
  };

  const handleStutterChange = (enabled: boolean, options: StutterOptions) => {
    setStutterSettings({ enabled, options });
  };

  const handleVelocityHumanizeChange = (enabled: boolean, options: VelocityHumanizeOptions) => {
    setVelocityHumanizeSettings({ enabled, options });
  };

  const handleLegatoChange = (enabled: boolean, options: LegatoOptions) => {
    setLegatoSettings({ enabled, options });
  };

  return (
    <div id="app">
      <MidiFileLoader onLoad={setNotes} />
      <Transport notes={processedNotes} originalNotes={notes} onPlayingChange={setIsPlaying} />
      <EffectsPanel
        onBreathPatternChange={handleBreathPatternChange}
        onNoteSkipChange={handleNoteSkipChange}
        onPointillistDecayChange={handlePointillistDecayChange}
        onHarmonicStackChange={handleHarmonicStackChange}
        onStutterChange={handleStutterChange}
        onVelocityHumanizeChange={handleVelocityHumanizeChange}
        onLegatoChange={handleLegatoChange}
        legatoDisabled={stutterSettings.enabled || pointillistDecaySettings.enabled}
        stutterDisabled={legatoSettings.enabled}
        decayDisabled={legatoSettings.enabled}
      />

      {notes.length > 0 && (
        <div className="view-toggle">
          <button
            className={viewMode === 'pianoroll' ? 'active' : ''}
            onClick={() => setViewMode('pianoroll')}
          >
            Piano Roll
          </button>
          <button
            className={viewMode === 'score' ? 'active' : ''}
            onClick={() => setViewMode('score')}
          >
            Score
          </button>
        </div>
      )}

      {viewMode === 'pianoroll' ? (
        <PianoRoll notes={processedNotes} isPlaying={isPlaying} />
      ) : (
        <ScoreView notes={processedNotes} isPlaying={isPlaying} />
      )}

      <NotesList notes={processedNotes} />
    </div>
  );
}
