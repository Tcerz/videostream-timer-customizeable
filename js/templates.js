/**
 * templates.js
 * Built-in visual templates. Each template is plain CSS scoped by the
 * body.template-N class, targeting this DOM contract:
 *
 *   body.template-N
 *     #timer
 *       .timer-wrap
 *         .segment
 *           .value
 *           .label
 *         .sep
 *         .date-line
 *         .ended-text
 *       .timer-controls   (play / pause / reset — added when enabled)
 *
 * Body background is transparent by default so the widget composites
 * cleanly over video in OBS / vMix. Templates that want a visible card
 * paint the background on .timer-wrap instead of body.
 *
 * Every template exposes two CSS custom properties, --c1 and --c2, with a
 * sensible default baked into every rule via var(--c1, #default). The
 * builder's color pickers just set --c1 / --c2 on <body>, so any template
 * can be recolored without writing CSS. `colors` below documents the
 * factory default for each, used to reset the pickers when a template is
 * selected.
 */

window.TIMER_TEMPLATES = {
  '1': {
    name: 'Minimal Flat',
    colors: { c1: '#FFFFFF', c2: '#C9C9C9' },
    css: `
.template-1 { background: transparent; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
.template-1 .timer-wrap { display:flex; align-items:baseline; gap:calc(0.93vmin * var(--wscale,1)); }
.template-1 .value { font-size:calc(8.89vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#FFFFFF); line-height:1; letter-spacing:-2px; }
.template-1 .label { display:block; font-size:calc(1.30vmin * var(--wscale,1)); color:var(--c2,#C9C9C9); text-align:center; margin-top:4px; letter-spacing:2px; text-transform:uppercase; }
.template-1 .segment { display:flex; flex-direction:column; align-items:center; }
.template-1 .sep { font-size:calc(8.89vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#FFFFFF); }
.template-1 .date-line { font-size:calc(2.96vmin * var(--wscale,1)); color:var(--c1,#EDEDED); font-weight:500; }
.template-1 .ended-text { font-size:calc(5.93vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#FFFFFF); }
`,
  },

  '2': {
    name: 'Neon Glow',
    colors: { c1: '#00F6FF', c2: '#FF00E5' },
    css: `
.template-2 { background: transparent; font-family: 'Courier New', monospace; }
.template-2 .timer-wrap { display:flex; align-items:baseline; gap:calc(0.74vmin * var(--wscale,1)); }
.template-2 .value { font-size:calc(8.52vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#00F6FF); text-shadow:0 0 10px var(--c1,#00F6FF),0 0 30px var(--c1,#00F6FF),0 0 60px var(--c2,#FF00E5); line-height:1; }
.template-2 .label { display:block; font-size:calc(1.20vmin * var(--wscale,1)); color:var(--c2,#FF00E5); text-align:center; text-shadow:0 0 8px var(--c2,#FF00E5); margin-top:6px; letter-spacing:3px; }
.template-2 .segment { display:flex; flex-direction:column; align-items:center; }
.template-2 .sep { font-size:calc(8.52vmin * var(--wscale,1)); color:var(--c2,#FF00E5); text-shadow:0 0 10px var(--c2,#FF00E5); }
.template-2 .date-line { font-size:calc(2.78vmin * var(--wscale,1)); color:var(--c1,#00F6FF); text-shadow:0 0 8px var(--c1,#00F6FF); }
.template-2 .ended-text { font-size:calc(5.56vmin * var(--wscale,1)); color:var(--c2,#FF00E5); text-shadow:0 0 20px var(--c2,#FF00E5); }
`,
  },

  '3': {
    name: 'LCD Digital',
    colors: { c1: '#7CFF7C', c2: '#4EAA4E' },
    css: `
.template-3 { background: transparent; font-family: 'Courier New', monospace; }
.template-3 .timer-wrap { display:flex; align-items:center; gap:calc(0.56vmin * var(--wscale,1)); background:#0C1A0C; padding:calc(1.85vmin * var(--wscale,1)) calc(2.96vmin * var(--wscale,1)); border-radius:8px; border:2px solid #1E3B1E; box-shadow: inset 0 0 20px rgba(0,0,0,.6); }
.template-3 .value { font-size:calc(7.41vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#7CFF7C); letter-spacing:4px; text-shadow:0 0 6px var(--c1,#7CFF7C); line-height:1; }
.template-3 .label { display:block; font-size:calc(1.02vmin * var(--wscale,1)); color:var(--c2,#4EAA4E); text-align:center; margin-top:2px; letter-spacing:2px; }
.template-3 .segment { display:flex; flex-direction:column; align-items:center; }
.template-3 .sep { font-size:calc(7.41vmin * var(--wscale,1)); color:var(--c2,#3E6E3E); }
.template-3 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:var(--c1,#7CFF7C); text-shadow:0 0 6px var(--c1,#7CFF7C); }
.template-3 .ended-text { font-size:calc(4.63vmin * var(--wscale,1)); color:var(--c1,#7CFF7C); text-shadow:0 0 10px var(--c1,#7CFF7C); }
`,
  },

  '4': {
    name: 'Broadcast Tally',
    colors: { c1: '#B01717', c2: '#FFD6D6' },
    css: `
.template-4 { background: transparent; font-family:'Arial Narrow', Arial, sans-serif; }
.template-4 .timer-wrap { display:flex; align-items:stretch; gap:calc(0.37vmin * var(--wscale,1)); }
.template-4 .segment { display:flex; flex-direction:column; align-items:center; background:var(--c1,#B01717); padding:calc(0.93vmin * var(--wscale,1)) calc(1.67vmin * var(--wscale,1)); border-radius:2px; }
.template-4 .value { font-size:calc(6.48vmin * var(--wscale,1)); font-weight:900; color:#FFFFFF; line-height:1; }
.template-4 .label { display:block; font-size:calc(1.02vmin * var(--wscale,1)); color:var(--c2,#FFD6D6); text-align:center; margin-top:2px; letter-spacing:2px; text-transform:uppercase; font-weight:700; }
.template-4 .sep { display:none; }
.template-4 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:#FFFFFF; background:#1A1A1A; padding:calc(0.56vmin * var(--wscale,1)) calc(1.30vmin * var(--wscale,1)); font-weight:700; }
.template-4 .ended-text { font-size:calc(4.26vmin * var(--wscale,1)); font-weight:900; color:#FFFFFF; background:var(--c1,#B01717); padding:calc(1.30vmin * var(--wscale,1)) calc(2.41vmin * var(--wscale,1)); }
`,
  },

  '5': {
    name: 'Glassmorphism',
    colors: { c1: '#FFFFFF', c2: '#FFFFFF' },
    css: `
.template-5 { background: transparent; font-family:'Segoe UI', Roboto, sans-serif; }
.template-5 .timer-wrap { display:flex; align-items:baseline; gap:calc(1.30vmin * var(--wscale,1)); background:rgba(255,255,255,0.12); backdrop-filter: blur(14px); border:1px solid rgba(255,255,255,0.35); padding:calc(2.04vmin * var(--wscale,1)) calc(3.33vmin * var(--wscale,1)); border-radius:20px; }
.template-5 .value { font-size:calc(7.41vmin * var(--wscale,1)); font-weight:600; color:var(--c1,#FFFFFF); line-height:1; }
.template-5 .label { display:block; font-size:calc(1.11vmin * var(--wscale,1)); color:var(--c2,rgba(255,255,255,0.75)); text-align:center; margin-top:4px; letter-spacing:2px; }
.template-5 .segment { display:flex; flex-direction:column; align-items:center; }
.template-5 .sep { font-size:calc(7.41vmin * var(--wscale,1)); color:var(--c2,rgba(255,255,255,0.6)); }
.template-5 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:var(--c1,#FFFFFF); }
.template-5 .ended-text { font-size:calc(4.81vmin * var(--wscale,1)); color:var(--c1,#FFFFFF); }
`,
  },

  '6': {
    name: 'Retro Flip Clock',
    colors: { c1: '#F2F2F2', c2: '#9A9A9A' },
    css: `
.template-6 { background: transparent; font-family:'Helvetica Neue', Arial, sans-serif; }
.template-6 .timer-wrap { display:flex; align-items:center; gap:calc(0.93vmin * var(--wscale,1)); }
.template-6 .segment { display:flex; flex-direction:column; align-items:center; }
.template-6 .value { position:relative; font-size:calc(7.04vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#F2F2F2); background:#222429; line-height:1; padding:calc(1.30vmin * var(--wscale,1)) calc(1.67vmin * var(--wscale,1)); border-radius:6px; box-shadow:0 4px 0 #0B0C0E, inset 0 -2px 0 rgba(255,255,255,.05); }
.template-6 .value::after { content:''; position:absolute; left:0; right:0; top:50%; height:2px; background:#0B0C0E; }
.template-6 .label { display:block; font-size:calc(1.11vmin * var(--wscale,1)); color:var(--c2,#9A9A9A); text-align:center; margin-top:6px; letter-spacing:2px; text-transform:uppercase; }
.template-6 .sep { font-size:calc(5.56vmin * var(--wscale,1)); color:var(--c2,#9A9A9A); font-weight:700; align-self:flex-start; margin-top:12px; }
.template-6 .date-line { font-size:calc(2.22vmin * var(--wscale,1)); color:var(--c1,#F2F2F2); }
.template-6 .ended-text { font-size:calc(4.44vmin * var(--wscale,1)); color:var(--c1,#F2F2F2); background:#222429; padding:calc(1.30vmin * var(--wscale,1)) calc(2.22vmin * var(--wscale,1)); border-radius:6px; }
`,
  },

  '7': {
    name: 'Elegant Serif',
    colors: { c1: '#FAF7F0', c2: '#D8CFC0' },
    css: `
.template-7 { background: transparent; font-family: Georgia, 'Times New Roman', serif; }
.template-7 .timer-wrap { display:flex; align-items:baseline; gap:calc(1.67vmin * var(--wscale,1)); border-top:1px solid rgba(255,255,255,.5); border-bottom:1px solid rgba(255,255,255,.5); padding:calc(1.48vmin * var(--wscale,1)) calc(0.56vmin * var(--wscale,1)); }
.template-7 .value { font-size:calc(7.22vmin * var(--wscale,1)); font-weight:400; color:var(--c1,#FAF7F0); line-height:1; }
.template-7 .label { display:block; font-size:calc(1.20vmin * var(--wscale,1)); color:var(--c2,#D8CFC0); text-align:center; margin-top:6px; letter-spacing:3px; font-style:italic; }
.template-7 .segment { display:flex; flex-direction:column; align-items:center; }
.template-7 .sep { font-size:calc(5.56vmin * var(--wscale,1)); color:var(--c2,#D8CFC0); align-self:center; }
.template-7 .date-line { font-size:calc(2.59vmin * var(--wscale,1)); color:var(--c1,#FAF7F0); letter-spacing:1px; }
.template-7 .ended-text { font-size:calc(4.26vmin * var(--wscale,1)); color:var(--c1,#FAF7F0); font-style:italic; }
`,
  },

  '8': {
    name: 'Gradient Bold',
    colors: { c1: '#FF7A18', c2: '#AF002D' },
    css: `
.template-8 { background: transparent; font-family:'Poppins', 'Segoe UI', sans-serif; }
.template-8 .timer-wrap { display:flex; align-items:baseline; gap:calc(0.93vmin * var(--wscale,1)); }
.template-8 .value { font-size:calc(9.26vmin * var(--wscale,1)); font-weight:800; line-height:1; background:linear-gradient(135deg,var(--c1,#FF7A18),var(--c2,#AF002D) 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .label { display:block; font-size:calc(1.30vmin * var(--wscale,1)); color:var(--c1,#FF7A18); text-align:center; margin-top:4px; letter-spacing:2px; font-weight:600; }
.template-8 .segment { display:flex; flex-direction:column; align-items:center; }
.template-8 .sep { font-size:calc(9.26vmin * var(--wscale,1)); font-weight:800; background:linear-gradient(135deg,var(--c1,#FF7A18),var(--c2,#AF002D) 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .date-line { font-size:calc(2.78vmin * var(--wscale,1)); font-weight:700; background:linear-gradient(135deg,var(--c1,#FF7A18),var(--c2,#AF002D) 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .ended-text { font-size:calc(5.56vmin * var(--wscale,1)); font-weight:800; background:linear-gradient(135deg,var(--c1,#FF7A18),var(--c2,#AF002D) 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
`,
  },

  '9': {
    name: 'Outline Terminal',
    colors: { c1: '#3BD16F', c2: '#2A9856' },
    css: `
.template-9 { background: transparent; font-family:'Courier New', monospace; }
.template-9 .timer-wrap { display:flex; align-items:center; gap:calc(0.37vmin * var(--wscale,1)); border:2px solid var(--c1,#3BD16F); padding:calc(1.48vmin * var(--wscale,1)) calc(2.41vmin * var(--wscale,1)); background:rgba(0,0,0,0.55); }
.template-9 .value { font-size:calc(6.67vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#3BD16F); line-height:1; }
.template-9 .label { display:block; font-size:calc(1.02vmin * var(--wscale,1)); color:var(--c2,#2A9856); text-align:center; margin-top:4px; letter-spacing:2px; }
.template-9 .segment { display:flex; flex-direction:column; align-items:center; }
.template-9 .sep { font-size:calc(6.67vmin * var(--wscale,1)); color:var(--c1,#3BD16F); }
.template-9 .date-line { font-size:calc(2.22vmin * var(--wscale,1)); color:var(--c1,#3BD16F); }
.template-9 .ended-text { font-size:calc(4.07vmin * var(--wscale,1)); color:var(--c1,#3BD16F); }
.template-9 .timer-wrap::before { content:'> '; color:var(--c1,#3BD16F); font-size:calc(6.67vmin * var(--wscale,1)); }
`,
  },

  '10': {
    name: 'Sports Scoreboard',
    colors: { c1: '#FFC400', c2: '#FFC400' },
    css: `
.template-10 { background: transparent; font-family:'Arial Black', Arial, sans-serif; }
.template-10 .timer-wrap { display:flex; align-items:center; gap:calc(0.56vmin * var(--wscale,1)); background:#000000; padding:calc(1.67vmin * var(--wscale,1)) calc(2.78vmin * var(--wscale,1)); border:4px solid var(--c1,#FFC400); }
.template-10 .value { font-size:calc(7.78vmin * var(--wscale,1)); font-weight:900; color:var(--c1,#FFC400); line-height:1; }
.template-10 .label { display:block; font-size:calc(1.11vmin * var(--wscale,1)); color:var(--c1,#FFC400); text-align:center; margin-top:4px; letter-spacing:2px; }
.template-10 .segment { display:flex; flex-direction:column; align-items:center; }
.template-10 .sep { font-size:calc(7.78vmin * var(--wscale,1)); color:var(--c1,#FFC400); }
.template-10 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:var(--c1,#FFC400); font-weight:900; }
.template-10 .ended-text { font-size:calc(4.63vmin * var(--wscale,1)); color:var(--c1,#FFC400); font-weight:900; background:#000; padding:calc(0.93vmin * var(--wscale,1)) calc(1.85vmin * var(--wscale,1)); }
`,
  },

  '11': {
    name: 'Soft Pastel',
    colors: { c1: '#6B5B95', c2: '#F7A9A8' },
    css: `
.template-11 { background: transparent; font-family:'Segoe UI', Roboto, sans-serif; }
.template-11 .timer-wrap { display:flex; align-items:baseline; gap:calc(1.30vmin * var(--wscale,1)); background:#FFF6F2; padding:calc(1.85vmin * var(--wscale,1)) calc(2.78vmin * var(--wscale,1)); border-radius:24px; box-shadow:0 6px 18px rgba(0,0,0,.12); }
.template-11 .value { font-size:calc(7.22vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#6B5B95); line-height:1; }
.template-11 .label { display:block; font-size:calc(1.11vmin * var(--wscale,1)); color:var(--c2,#B694C7); text-align:center; margin-top:4px; letter-spacing:1px; }
.template-11 .segment { display:flex; flex-direction:column; align-items:center; }
.template-11 .sep { font-size:calc(7.22vmin * var(--wscale,1)); color:var(--c2,#F7A9A8); }
.template-11 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:var(--c1,#6B5B95); font-weight:600; }
.template-11 .ended-text { font-size:calc(4.44vmin * var(--wscale,1)); color:var(--c1,#6B5B95); }
`,
  },

  '12': {
    name: 'Cyberpunk',
    colors: { c1: '#F72585', c2: '#4CC9F0' },
    css: `
.template-12 { background: transparent; font-family:'Orbitron', 'Courier New', monospace; }
.template-12 .timer-wrap { display:flex; align-items:center; gap:calc(0.74vmin * var(--wscale,1)); background:linear-gradient(120deg,#1A0B2E,#3B0764); padding:calc(1.67vmin * var(--wscale,1)) calc(2.78vmin * var(--wscale,1)); border-radius:4px; border-left:4px solid var(--c1,#F72585); border-right:4px solid var(--c2,#4CC9F0); }
.template-12 .value { font-size:calc(7.22vmin * var(--wscale,1)); font-weight:700; color:var(--c1,#F72585); text-shadow:2px 0 var(--c2,#4CC9F0); line-height:1; }
.template-12 .label { display:block; font-size:calc(1.02vmin * var(--wscale,1)); color:var(--c2,#4CC9F0); text-align:center; margin-top:4px; letter-spacing:2px; }
.template-12 .segment { display:flex; flex-direction:column; align-items:center; }
.template-12 .sep { font-size:calc(7.22vmin * var(--wscale,1)); color:var(--c2,#4CC9F0); }
.template-12 .date-line { font-size:calc(2.41vmin * var(--wscale,1)); color:var(--c1,#F72585); text-shadow:1px 0 var(--c2,#4CC9F0); }
.template-12 .ended-text { font-size:calc(4.44vmin * var(--wscale,1)); color:var(--c1,#F72585); text-shadow:2px 0 var(--c2,#4CC9F0); }
`,
  },
};
