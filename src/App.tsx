import { useState, useMemo } from 'react';
import { MidiFileLoader } from './components/MidiFileLoader';
import { NotesList } from './components/NotesList';
import { PianoRoll } from './components/PianoRoll';
import { ScoreView } from './components/ScoreView';
import { Transport } from './components/Transport';
import { EffectsPanel } from './components/EffectsPanel';
import { Note } from './player';
import { applyBreathPattern, applyNoteSkip, applyPointillistDecay, applyHarmonicStack, BreathPatternOptions, NoteSkipOptions, PointillistDecayOptions, HarmonicStackOptions } from './effects';

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

    // Apply Pointillist Decay (modifies duration)
    if (pointillistDecaySettings.enabled) {
      result = applyPointillistDecay(result, pointillistDecaySettings.options);
    }

    // Then apply Breath Pattern
    if (breathSettings.enabled) {
      result = applyBreathPattern(result, breathSettings.options);
    }

    return result;
  }, [notes, breathSettings, noteSkipSettings, pointillistDecaySettings, harmonicStackSettings]);

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

  return (
    <div id="app">
      <MidiFileLoader onLoad={setNotes} />
      <Transport notes={processedNotes} originalNotes={notes} onPlayingChange={setIsPlaying} />
      <EffectsPanel
        onBreathPatternChange={handleBreathPatternChange}
        onNoteSkipChange={handleNoteSkipChange}
        onPointillistDecayChange={handlePointillistDecayChange}
        onHarmonicStackChange={handleHarmonicStackChange}
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
