/**
 * Core note type used throughout the effects system.
 * Matches the Note interface from player.ts
 */
export interface Note {
  midi: number;      // MIDI note number
  time: number;      // Start time in seconds
  duration: number;  // Duration in seconds
  velocity: number;  // 0-1 range
}

/**
 * Generic effect interface for the effects registry.
 */
export interface Effect {
  name: string;
  apply: (notes: Note[], options?: Record<string, unknown>) => Note[];
}
