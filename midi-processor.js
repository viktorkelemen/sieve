// MIDI Processor for Max for Live
// Receives MIDI note data and passes it through (for now)

inlets = 1;
outlets = 1;

// Handle note messages: pitch, velocity
function note(pitch, velocity) {
    outlet(0, "note", pitch, velocity);
}

// Handle all other MIDI messages passthrough
function msg_int(val) {
    outlet(0, val);
}

function list() {
    var args = arrayfromargs(arguments);
    outlet(0, args);
}

// Log when loaded
post("midi-processor.js loaded\n");
