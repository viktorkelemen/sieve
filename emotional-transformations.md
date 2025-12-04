# Emotional MIDI Transformations

How different MIDI transformations map to emotional qualities.

## Emotional Dimensions in Music

Music psychology research (Hevner, Russell, Thayer) identifies two primary emotional axes:
- **Valence**: positive (happy/joyful) <-> negative (sad/melancholic)
- **Arousal**: high energy (excited/tense) <-> low energy (calm/peaceful)

## MIDI Parameters and Their Emotional Mappings

### Tempo/Time Manipulations

| Transformation | Emotional Effect |
|----------------|------------------|
| Accelerando (gradual speed up) | Building excitement, anticipation, anxiety |
| Ritardando (gradual slow down) | Resolution, sadness, contemplation, ending |
| Rubato (tempo fluctuation) | Expressiveness, intimacy, human feel |
| Strict quantization | Mechanical, cold, hypnotic, trance-like |

### Velocity Dynamics

| Transformation | Emotional Effect |
|----------------|------------------|
| High velocity, consistent | Power, anger, intensity |
| Low velocity, consistent | Intimacy, sadness, tenderness |
| Crescendo patterns | Building tension, hope, anticipation |
| Decrescendo patterns | Fading, loss, acceptance, calm |
| Random velocity variance | Organic, human, unpredictable |
| Velocity accents on beats | Drive, confidence, assertion |

### Pitch/Interval Transformations

| Transformation | Emotional Effect |
|----------------|------------------|
| Transpose up | Brightness, lightness, hope, innocence |
| Transpose down | Darkness, weight, gravity, seriousness |
| Octave scatter (randomize octaves) | Spaciousness, dreaminess, disorientation |
| Interval expansion | Opening up, freedom, release |
| Interval contraction | Tension, claustrophobia, anxiety |
| Chromatic insertions | Tension, sophistication, unease |

### Note Density/Rhythm

| Transformation | Emotional Effect |
|----------------|------------------|
| Note removal (probabilistic) | Spaciousness, contemplation, minimalism |
| Note doubling/ratcheting | Urgency, excitement, nervousness |
| Euclidean redistribution | Hypnotic, tribal, ritualistic |
| Syncopation injection | Groove, playfulness, surprise |
| Regularization | Stability, meditation, order |

### Articulation/Duration

| Transformation | Emotional Effect |
|----------------|------------------|
| Staccato (shorten notes) | Playfulness, nervousness, precision |
| Legato (extend/overlap) | Smoothness, sadness, flow |
| Note overlap increase | Lush, romantic, overwhelming |
| Gaps/rests insertion | Breath, contemplation, suspense |

### Temporal Displacement

| Transformation | Emotional Effect |
|----------------|------------------|
| Slight humanization (+/-10-30ms) | Warmth, organic feel |
| Ahead of beat (negative delay) | Urgency, pushing forward, anxiety |
| Behind beat (positive delay) | Laid back, relaxed, groovy |
| Echo/delay patterns | Space, memory, reflection |
| Phasing (gradual drift) | Hypnotic, meditative, psychedelic |

## Compound Emotional Recipes

### Joy/Euphoria
- Higher register (+12 semitones)
- Major intervals emphasized
- Moderate-high velocity with crescendos
- Faster tempo
- Staccato articulation
- Syncopation

### Melancholy/Sadness
- Lower register
- Legato articulation
- Slow tempo with ritardando
- Lower velocity
- Note removal for space
- Behind-beat timing

### Tension/Anxiety
- Chromatic insertions
- Accelerando
- Interval contraction
- Ahead-of-beat timing
- Ratcheting/note doubling
- Velocity accents

### Serenity/Peace
- Consistent low velocity
- Very legato
- Slow, steady tempo
- Sparse notes (high probability removal)
- Wide intervals
- Perfect quantization or gentle rubato

### Mystery/Wonder
- Octave scatter
- Velocity randomization
- Echo patterns
- Modal transposition
- Irregular rhythm patterns

### Nostalgia
- Slight detuning/pitch wobble
- Behind-beat timing
- Decrescendo patterns
- Note removal increasing over time
- Lower register drift

## Implementation Ideas

### Emotional Arc
Apply transformations that evolve over the loop duration (e.g., start sparse and build, or start bright and fade).

### Probability Gate with Velocity Coupling
Notes that survive probability gate get velocity boost (survivors feel more intentional).

### Gravity Transform
Notes drift toward a target pitch over time (like being pulled emotionally toward resolution).

### Breath Pattern
Insert periodic gaps that mimic breathing rhythm (creates organic, living feel).

### Memory Decay
Each loop iteration, notes have increasing probability of being removed (like fading memory).

### Emotional Crossfade
Blend between two transformation presets over time (e.g., crossfade from "joy" to "melancholy").
