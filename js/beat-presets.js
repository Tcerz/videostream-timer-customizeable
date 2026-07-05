/**
 * beat-presets.js
 * Quick-pick color moods for the Beat Pulse widget. Each preset is just a
 * "calm" and "energetic" color — the widget interpolates between them live
 * based on detected audio energy, and picks up the palette from these two
 * anchor colors (see beat-core.js).
 */

window.BEAT_PRESETS = {
  '1': { name: 'Chill → Hype', calm: '#3A6FF7', energetic: '#FF2E63' },
  '2': { name: 'Ocean → Fire', calm: '#12C2E9', energetic: '#FF512F' },
  '3': { name: 'Purple Haze', calm: '#5B247A', energetic: '#E94057' },
  '4': { name: 'Neon Club', calm: '#00F6FF', energetic: '#FF00E5' },
  '5': { name: 'Sunset Groove', calm: '#FFB75E', energetic: '#ED213A' },
  '6': { name: 'Mono Pulse', calm: '#2B2B2B', energetic: '#FFFFFF' },
};
