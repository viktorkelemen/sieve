# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sieve is a browser-based MIDI processing tool that loads MIDI files, applies real-time effects, and outputs to hardware synths via WebMIDI. The project is inspired by Caterina Barbieri's generative arp techniques.

## Commands

- `npm run dev` - Start Vite dev server
- `npm run build` - TypeScript check + Vite production build
- `npm run preview` - Preview production build

## Architecture

### Core Data Flow

1. **MidiFileLoader** parses MIDI files using @tonejs/midi → array of `Note` objects
2. **App** applies effects chain via `useMemo` (Note Skip → Breath Pattern)
3. **Transport** manages WebMIDI output selection and playback control
4. **player.ts** schedules notes using setTimeout, supports looping with hot-swappable notes

### Key Files

- `src/player.ts` - Note scheduler with loop support and real-time note updates
- `src/midi-io.ts` - WebMIDI wrapper (init, output selection, note on/off, panic)
- `src/effects.ts` - Effect functions that transform `Note[]` arrays

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

Effects are pure functions: `(notes: Note[], options) => Note[]`. Current effects:
- **Breath Pattern** - Creates periodic gaps mimicking breathing rhythm
- **Note Skip** - Plays every Nth note for thinning out busy sequences

When adding new effects, follow the pattern in `effects.ts` and wire them through `App.tsx` with a useMemo chain.

### Visualization

- **PianoRoll** - Canvas-based scrolling piano roll view
- **ScoreView** - VexFlow-based staff notation (experimental)
