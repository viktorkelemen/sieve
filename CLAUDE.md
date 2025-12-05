# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sieve is a browser-based MIDI processing tool that loads MIDI files, applies real-time effects, and outputs to hardware synths via WebMIDI. The project is inspired by Caterina Barbieri's generative arp techniques.

## Commands

- `npm run dev` - Start Vite dev server
- `npm run build` - TypeScript check + Vite production build
- `npm run preview` - Preview production build
- `npm test` - Run unit tests (run after major changes)

## Architecture

### Core Data Flow

1. **MidiFileLoader** parses MIDI files using @tonejs/midi → array of `Note` objects
2. **App** applies effects chain via `useMemo` (Note Skip → Breath Pattern)
3. **Transport** manages WebMIDI output selection and playback control
4. **player.ts** schedules notes using setTimeout, supports looping with hot-swappable notes

### Key Files

- `src/player.ts` - Note scheduler with loop support and real-time note updates
- `src/midi-io.ts` - WebMIDI wrapper (init, output selection, note on/off, panic)
- `src/effects/` - Modular effects system with isolated, testable effect functions

### Note Type

```typescript
interface Note {
  midi: number;      // MIDI note number
  time: number;      // Start time in seconds
  duration: number;  // Duration in seconds
  velocity: number;  // 0-1 range
}
```

### Effects System

Effects are pure functions: `(notes: Note[], options) => Note[]`. The effects system is organized in `src/effects/`:
- `types.ts` - Shared Note and Effect interfaces
- `breathPattern.ts` - Creates periodic gaps mimicking breathing rhythm
- `noteSkip.ts` - Play:skip ratio pattern for thinning sequences
- `index.ts` - Re-exports and effects registry

When adding new effects:
1. Create a new file in `src/effects/` with the effect function and options interface
2. Export from `index.ts`
3. Add to the `effects` registry array in `index.ts`
4. Wire through `App.tsx` with state and useMemo chain

### Visualization

- **PianoRoll** - Canvas-based scrolling piano roll view
- **ScoreView** - VexFlow-based staff notation (experimental)
