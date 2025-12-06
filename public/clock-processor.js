// AudioWorklet Processor - runs on the audio thread
// This file is loaded via audioWorklet.addModule()

// SharedArrayBuffer layout (Int32):
// [0]: Tick count (main writes, worklet reads)
// [1]: Command (1=start, 2=stop, 3=continue, 0=none)
// [2]: Running state (written by worklet for main to read)

const TICK_COUNT = 0;
const COMMAND = 1;
const RUNNING_STATE = 2;

const CMD_NONE = 0;
const CMD_START = 1;
const CMD_STOP = 2;
const CMD_CONTINUE = 3;

const PPQ = 24;

class ClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.sharedArray = null;
    this.notes = [];
    this.loopLength = 0;
    this.lastPosition = 0;
    this.activeNotes = []; // { midi, startTime, endTime, crossesBoundary, hasWrapped }
    this.isRunning = false;

    // Timing state
    this.lastTickCount = 0;
    this.smoothedBpm = 120;
    this.samplesSinceTick = 0;
    this.totalSamples = 0;
    this.tickHistory = []; // Circular buffer of sample times for BPM averaging

    // Cumulative position tracking to avoid BPM drift
    this.cumulativePosition = 0;

    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'init':
        if (msg.buffer) {
          this.sharedArray = new Int32Array(msg.buffer);
          this.port.postMessage({ type: 'ready' });
        }
        break;
      case 'notes':
        if (msg.notes) {
          // Use new loop length for calculations if provided, otherwise current
          const newLoopLength = (typeof msg.loopLength === 'number' && msg.loopLength > 0)
            ? msg.loopLength
            : (this.loopLength || 0);

          // Minimum duration to ensure gates are registered (approx 5ms at 120bpm)
          const MIN_DURATION = 0.01;

          // Build a map of new notes for lookup
          // We use a spatial index approach for fuzzy matching since float times might drift slightly
          const newNotesByMidi = new Map();
          for (const n of msg.notes) {
            // Enforce minimum duration
            if (n.duration < MIN_DURATION) n.duration = MIN_DURATION;

            if (!newNotesByMidi.has(n.midi)) {
              newNotesByMidi.set(n.midi, []);
            }
            newNotesByMidi.get(n.midi).push(n);
          }

          // Process active notes
          if (this.activeNotes.length > 0) {
            const orphanedNotes = [];
            const updatedActiveNotes = [];

            for (const active of this.activeNotes) {
              // Find corresponding new note
              // Look for a note with same MIDI and start time within epsilon
              const candidates = newNotesByMidi.get(active.midi);
              let newNote = null;

              if (candidates) {
                // Fuzzy match start time (epsilon 0.001 beats)
                newNote = candidates.find(n => Math.abs(n.time - active.startTime) < 0.001);
              }

              if (!newNote) {
                // Note no longer exists - turn it off
                orphanedNotes.push(active.midi);
              } else {
                // Note still exists - update endTime based on new duration
                const rawEndTime = newNote.time + newNote.duration;
                const crossesBoundary = newLoopLength > 0 && rawEndTime > newLoopLength;
                const endTime = crossesBoundary
                  ? rawEndTime - newLoopLength
                  : rawEndTime;

                // Check if the note should have already ended with new duration
                // Use current cumulative position
                const pos = newLoopLength > 0
                  ? this.cumulativePosition % newLoopLength
                  : this.cumulativePosition;

                let shouldEnd = false;

                // Logic to determine if we passed the end time
                if (!crossesBoundary) {
                  // Simple case: start < end
                  // If we are past endTime, it should end.
                  if (endTime <= pos) shouldEnd = true;

                  // Special case: if we wrapped, and the note is not cross-boundary,
                  // it definitely ended in the previous loop.
                  if (active.hasWrapped && pos < active.startTime) shouldEnd = true;
                } else {
                  // Cross boundary case: start > end (wrapped)
                  // It ends if we have wrapped AND we are past endTime
                  if (active.hasWrapped && endTime <= pos) shouldEnd = true;

                  // If it WAS cross-boundary but now isn't (shortened), and we wrapped,
                  // it should have ended.
                  if (!crossesBoundary && active.crossesBoundary && active.hasWrapped) shouldEnd = true;
                }

                if (shouldEnd) {
                  orphanedNotes.push(active.midi);
                } else {
                  // Update the active note with new timing
                  updatedActiveNotes.push({
                    ...active,
                    endTime,
                    crossesBoundary,
                    // Preserve hasWrapped state
                  });
                }
              }
            }

            if (orphanedNotes.length > 0) {
              this.port.postMessage({ type: 'noteOff', notes: orphanedNotes });
            }
            this.activeNotes = updatedActiveNotes;
          }

          this.notes = msg.notes;
          this.loopLength = newLoopLength;

          // Reset position when notes change to catch notes at position 0
          // ONLY if not running (initial setup)
          if (!this.isRunning) {
            this.lastPosition = 0;
            this.cumulativePosition = 0;
          }
        }
        break;
    }
  }

  process(_inputs, _outputs, _parameters) {
    if (!this.sharedArray) return true;

    const blockSize = 128;
    this.totalSamples += blockSize;
    this.samplesSinceTick += blockSize;

    // Check for commands (exchange atomically reads and clears to prevent race)
    const command = Atomics.exchange(this.sharedArray, COMMAND, CMD_NONE);
    if (command !== CMD_NONE) {
      this.handleCommand(command);
    }

    // Check for new clock ticks
    const tickCount = Atomics.load(this.sharedArray, TICK_COUNT);
    if (tickCount !== this.lastTickCount && this.isRunning) {
      this.processTicks(tickCount);
    }

    return true;
  }

  handleCommand(command) {
    switch (command) {
      case CMD_START:
        this.isRunning = true;
        this.lastTickCount = 0;
        this.lastPosition = 0;
        this.cumulativePosition = 0;
        this.activeNotes = [];
        this.samplesSinceTick = 0;
        this.tickHistory = [];
        Atomics.store(this.sharedArray, RUNNING_STATE, 1);
        break;

      case CMD_STOP:
        this.isRunning = false;
        const noteOffs = this.activeNotes.map(n => n.midi);
        if (noteOffs.length > 0) {
          this.port.postMessage({ type: 'noteOff', notes: noteOffs });
        }
        this.activeNotes = [];
        Atomics.store(this.sharedArray, RUNNING_STATE, 0);
        break;

      case CMD_CONTINUE:
        this.isRunning = true;
        // Don't reset position - continue from where we left off
        Atomics.store(this.sharedArray, RUNNING_STATE, 1);
        break;
    }
  }

  processTicks(newTickCount) {
    const ticksDelta = newTickCount - this.lastTickCount;

    // Handle abnormal ticksDelta (negative from reset race, or huge from stale state)
    if (ticksDelta < 0 || ticksDelta > 100) {
      this.lastTickCount = newTickCount;
      this.samplesSinceTick = 0;
      return;
    }

    // Update BPM estimate using sliding window
    // Store sample time of this tick
    this.tickHistory.push(this.totalSamples);

    // Keep last 24 ticks (1 beat)
    if (this.tickHistory.length > 24) {
      this.tickHistory.shift();
    }

    // Only calculate if we have enough history (at least 1/4 beat)
    if (this.tickHistory.length >= 6) {
      const oldestSample = this.tickHistory[0];
      const newestSample = this.totalSamples;
      const ticksInWindow = this.tickHistory.length - 1;

      const samplesTotal = newestSample - oldestSample;
      const samplesPerTickAvg = samplesTotal / ticksInWindow;

      const measuredBpm = (sampleRate * 60) / (samplesPerTickAvg * PPQ);

      // Only update if measured BPM is within reasonable range (20-300)
      if (measuredBpm >= 20 && measuredBpm <= 300) {
        // Very slow exponential smoothing for stability
        // Alpha = 0.05 means it takes ~13 updates (0.5s at 120bpm) to reach 50% of change
        // This filters out jitter effectively
        const alpha = 0.05;
        this.smoothedBpm += alpha * (measuredBpm - this.smoothedBpm);
      }
    } else if (ticksDelta > 0 && this.samplesSinceTick > 0) {
      // Fallback for first few ticks: instantaneous measurement
      const samplesPerTickMeasured = this.samplesSinceTick / ticksDelta;
      const measuredBpm = (sampleRate * 60) / (samplesPerTickMeasured * PPQ);
      if (measuredBpm >= 20 && measuredBpm <= 300) {
        this.smoothedBpm = measuredBpm;
      }
    }

    // Calculate position in beats directly from ticks
    // 24 ticks = 1 beat
    const beatsDelta = ticksDelta / PPQ;
    this.cumulativePosition += beatsDelta;

    this.lastTickCount = newTickCount;
    this.samplesSinceTick = 0;

    // Calculate position and process notes
    this.processNotes();

    // Send position update to main thread
    // Convert beats back to seconds for UI display (assuming 120 BPM reference)
    // This is just for visualization, actual timing is beat-based
    this.port.postMessage({
      type: 'position',
      position: this.lastPosition / 2, // Convert beats back to seconds (120 BPM)
      bpm: Math.round(this.smoothedBpm),
    });
  }

  processNotes() {
    if (this.notes.length === 0) return;

    // Use cumulative position for accuracy
    const pos = this.loopLength > 0
      ? this.cumulativePosition % this.loopLength
      : this.cumulativePosition;

    // Detect loop wrap
    const isWrapping = pos < this.lastPosition && this.loopLength > 0;

    if (isWrapping) {
      // Turn off notes that don't cross the boundary
      const noteOffs = this.activeNotes
        .filter(n => !n.crossesBoundary)
        .map(n => n.midi);
      if (noteOffs.length > 0) {
        this.port.postMessage({ type: 'noteOff', notes: noteOffs });
      }
      // Keep only cross-boundary notes and mark them as wrapped
      this.activeNotes = this.activeNotes
        .filter(n => n.crossesBoundary)
        .map(n => ({ ...n, hasWrapped: true }));
    }

    // Check for notes to trigger
    const noteOns = [];

    for (const note of this.notes) {
      let shouldTrigger = false;

      if (isWrapping) {
        // During wrap: trigger notes from lastPosition to loopLength (exclusive), OR from 0 to pos
        // Use strict < for loopLength to avoid double-trigger with notes at time 0
        shouldTrigger =
          (note.time > this.lastPosition && note.time < this.loopLength) ||
          (note.time >= 0 && note.time <= pos);
      } else {
        shouldTrigger = note.time > this.lastPosition && note.time <= pos;
      }

      // First tick after start - catch notes at time 0
      // Only if not wrapping (wrapping case already handles time 0)
      if (!isWrapping && this.lastPosition === 0 && pos > 0 && note.time === 0) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Check if already active (same MIDI note number)
        const existingIdx = this.activeNotes.findIndex(a => a.midi === note.midi);
        if (existingIdx !== -1) {
          this.port.postMessage({ type: 'noteOff', notes: [note.midi] });
          this.activeNotes.splice(existingIdx, 1);
        }

        noteOns.push({ midi: note.midi, velocity: Math.round(note.velocity * 127) });

        // Calculate end time and check if it crosses the loop boundary
        const rawEndTime = note.time + note.duration;
        const crossesBoundary = this.loopLength > 0 && rawEndTime > this.loopLength;
        const endTime = crossesBoundary
          ? rawEndTime - this.loopLength  // Wrap to beginning
          : rawEndTime;

        this.activeNotes.push({
          midi: note.midi,
          startTime: note.time,
          endTime,
          crossesBoundary,
          hasWrapped: false
        });
      }
    }

    if (noteOns.length > 0) {
      this.port.postMessage({ type: 'noteOn', notes: noteOns });
    }

    // Check for notes to end
    const noteOffs = [];
    this.activeNotes = this.activeNotes.filter(active => {
      let shouldEnd = false;

      if (active.crossesBoundary) {
        // Cross-boundary note: only end after it has wrapped AND pos passes endTime
        if (active.hasWrapped) {
          if (active.endTime === 0) {
            // Special case: duration exactly fills loop, end immediately after wrap
            shouldEnd = true;
          } else {
            shouldEnd = this.lastPosition < active.endTime && active.endTime <= pos;
          }
        }
        // If not yet wrapped, don't end it
      } else {
        // Normal note ends when pos passes endTime
        shouldEnd = this.lastPosition < active.endTime && active.endTime <= pos;
      }

      if (shouldEnd) {
        noteOffs.push(active.midi);
        return false;
      }
      return true;
    });

    if (noteOffs.length > 0) {
      this.port.postMessage({ type: 'noteOff', notes: noteOffs });
    }

    this.lastPosition = pos;
  }
}

registerProcessor('clock-processor', ClockProcessor);
