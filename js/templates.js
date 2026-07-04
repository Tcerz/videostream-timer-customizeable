/**
 * templates.js
 * Built-in visual templates. Each template is plain CSS scoped by the
 * .template-N class, targeting this DOM contract:
 *
 *   .template-N
 *     .timer-wrap
 *       .segment
 *         .value
 *         .label
 *       .sep
 *       .date-line
 *       .ended-text
 *
 * Body background is transparent by default so the widget composites
 * cleanly over video in OBS / vMix. Templates that want a visible card
 * paint the background on .timer-wrap instead of body.
 */

window.TIMER_TEMPLATES = {
  '1': {
    name: 'Minimal Flat',
    css: `
.template-1 { background: transparent; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
.template-1 .timer-wrap { display:flex; align-items:baseline; gap:10px; }
.template-1 .value { font-size:96px; font-weight:700; color:#FFFFFF; line-height:1; letter-spacing:-2px; }
.template-1 .label { display:block; font-size:14px; color:#C9C9C9; text-align:center; margin-top:4px; letter-spacing:2px; text-transform:uppercase; }
.template-1 .segment { display:flex; flex-direction:column; align-items:center; }
.template-1 .sep { font-size:96px; font-weight:700; color:#FFFFFF; }
.template-1 .date-line { font-size:32px; color:#EDEDED; font-weight:500; }
.template-1 .ended-text { font-size:64px; font-weight:700; color:#FFFFFF; }
`,
  },

  '2': {
    name: 'Neon Glow',
    css: `
.template-2 { background: transparent; font-family: 'Courier New', monospace; }
.template-2 .timer-wrap { display:flex; align-items:baseline; gap:8px; }
.template-2 .value { font-size:92px; font-weight:700; color:#00F6FF; text-shadow:0 0 10px #00F6FF,0 0 30px #00F6FF,0 0 60px #FF00E5; line-height:1; }
.template-2 .label { display:block; font-size:13px; color:#FF00E5; text-align:center; text-shadow:0 0 8px #FF00E5; margin-top:6px; letter-spacing:3px; }
.template-2 .segment { display:flex; flex-direction:column; align-items:center; }
.template-2 .sep { font-size:92px; color:#FF00E5; text-shadow:0 0 10px #FF00E5; }
.template-2 .date-line { font-size:30px; color:#00F6FF; text-shadow:0 0 8px #00F6FF; }
.template-2 .ended-text { font-size:60px; color:#FF00E5; text-shadow:0 0 20px #FF00E5; }
`,
  },

  '3': {
    name: 'LCD Digital',
    css: `
@import url('https://fonts.googleapis.com/css2?family=DSEG7-Classic&display=swap');
.template-3 { background: transparent; font-family: 'Courier New', monospace; }
.template-3 .timer-wrap { display:flex; align-items:center; gap:6px; background:#0C1A0C; padding:20px 32px; border-radius:8px; border:2px solid #1E3B1E; box-shadow: inset 0 0 20px rgba(0,0,0,.6); }
.template-3 .value { font-size:80px; font-weight:700; color:#7CFF7C; letter-spacing:4px; text-shadow:0 0 6px rgba(124,255,124,.7); line-height:1; }
.template-3 .label { display:block; font-size:11px; color:#4EAA4E; text-align:center; margin-top:2px; letter-spacing:2px; }
.template-3 .segment { display:flex; flex-direction:column; align-items:center; }
.template-3 .sep { font-size:80px; color:#3E6E3E; }
.template-3 .date-line { font-size:26px; color:#7CFF7C; text-shadow:0 0 6px rgba(124,255,124,.7); }
.template-3 .ended-text { font-size:50px; color:#7CFF7C; text-shadow:0 0 10px #7CFF7C; }
`,
  },

  '4': {
    name: 'Broadcast Tally',
    css: `
.template-4 { background: transparent; font-family:'Arial Narrow', Arial, sans-serif; }
.template-4 .timer-wrap { display:flex; align-items:stretch; gap:4px; }
.template-4 .segment { display:flex; flex-direction:column; align-items:center; background:#B01717; padding:10px 18px; border-radius:2px; }
.template-4 .value { font-size:70px; font-weight:900; color:#FFFFFF; line-height:1; }
.template-4 .label { display:block; font-size:11px; color:#FFD6D6; text-align:center; margin-top:2px; letter-spacing:2px; text-transform:uppercase; font-weight:700; }
.template-4 .sep { display:none; }
.template-4 .date-line { font-size:26px; color:#FFFFFF; background:#1A1A1A; padding:6px 14px; font-weight:700; }
.template-4 .ended-text { font-size:46px; font-weight:900; color:#FFFFFF; background:#B01717; padding:14px 26px; }
`,
  },

  '5': {
    name: 'Glassmorphism',
    css: `
.template-5 { background: transparent; font-family:'Segoe UI', Roboto, sans-serif; }
.template-5 .timer-wrap { display:flex; align-items:baseline; gap:14px; background:rgba(255,255,255,0.12); backdrop-filter: blur(14px); border:1px solid rgba(255,255,255,0.35); padding:22px 36px; border-radius:20px; }
.template-5 .value { font-size:80px; font-weight:600; color:#FFFFFF; line-height:1; }
.template-5 .label { display:block; font-size:12px; color:rgba(255,255,255,0.75); text-align:center; margin-top:4px; letter-spacing:2px; }
.template-5 .segment { display:flex; flex-direction:column; align-items:center; }
.template-5 .sep { font-size:80px; color:rgba(255,255,255,0.6); }
.template-5 .date-line { font-size:26px; color:#FFFFFF; }
.template-5 .ended-text { font-size:52px; color:#FFFFFF; }
`,
  },

  '6': {
    name: 'Retro Flip Clock',
    css: `
.template-6 { background: transparent; font-family:'Helvetica Neue', Arial, sans-serif; }
.template-6 .timer-wrap { display:flex; align-items:center; gap:10px; }
.template-6 .segment { display:flex; flex-direction:column; align-items:center; }
.template-6 .value { position:relative; font-size:76px; font-weight:700; color:#F2F2F2; background:#222429; line-height:1; padding:14px 18px; border-radius:6px; box-shadow:0 4px 0 #0B0C0E, inset 0 -2px 0 rgba(255,255,255,.05); }
.template-6 .value::after { content:''; position:absolute; left:0; right:0; top:50%; height:2px; background:#0B0C0E; }
.template-6 .label { display:block; font-size:12px; color:#9A9A9A; text-align:center; margin-top:6px; letter-spacing:2px; text-transform:uppercase; }
.template-6 .sep { font-size:60px; color:#9A9A9A; font-weight:700; align-self:flex-start; margin-top:12px; }
.template-6 .date-line { font-size:24px; color:#F2F2F2; }
.template-6 .ended-text { font-size:48px; color:#F2F2F2; background:#222429; padding:14px 24px; border-radius:6px; }
`,
  },

  '7': {
    name: 'Elegant Serif',
    css: `
.template-7 { background: transparent; font-family: Georgia, 'Times New Roman', serif; }
.template-7 .timer-wrap { display:flex; align-items:baseline; gap:18px; border-top:1px solid rgba(255,255,255,.5); border-bottom:1px solid rgba(255,255,255,.5); padding:16px 6px; }
.template-7 .value { font-size:78px; font-weight:400; color:#FAF7F0; line-height:1; }
.template-7 .label { display:block; font-size:13px; color:#D8CFC0; text-align:center; margin-top:6px; letter-spacing:3px; font-style:italic; }
.template-7 .segment { display:flex; flex-direction:column; align-items:center; }
.template-7 .sep { font-size:60px; color:#D8CFC0; align-self:center; }
.template-7 .date-line { font-size:28px; color:#FAF7F0; letter-spacing:1px; }
.template-7 .ended-text { font-size:46px; color:#FAF7F0; font-style:italic; }
`,
  },

  '8': {
    name: 'Gradient Bold',
    css: `
.template-8 { background: transparent; font-family:'Poppins', 'Segoe UI', sans-serif; }
.template-8 .timer-wrap { display:flex; align-items:baseline; gap:10px; }
.template-8 .value { font-size:100px; font-weight:800; line-height:1; background:linear-gradient(135deg,#FF7A18,#AF002D 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .label { display:block; font-size:14px; color:#FF7A18; text-align:center; margin-top:4px; letter-spacing:2px; font-weight:600; }
.template-8 .segment { display:flex; flex-direction:column; align-items:center; }
.template-8 .sep { font-size:100px; font-weight:800; background:linear-gradient(135deg,#FF7A18,#AF002D 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .date-line { font-size:30px; font-weight:700; background:linear-gradient(135deg,#FF7A18,#AF002D 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.template-8 .ended-text { font-size:60px; font-weight:800; background:linear-gradient(135deg,#FF7A18,#AF002D 70%); -webkit-background-clip:text; background-clip:text; color:transparent; }
`,
  },

  '9': {
    name: 'Outline Terminal',
    css: `
.template-9 { background: transparent; font-family:'Courier New', monospace; }
.template-9 .timer-wrap { display:flex; align-items:center; gap:4px; border:2px solid #3BD16F; padding:16px 26px; background:rgba(0,0,0,0.55); }
.template-9 .value { font-size:72px; font-weight:700; color:#3BD16F; line-height:1; }
.template-9 .label { display:block; font-size:11px; color:#2A9856; text-align:center; margin-top:4px; letter-spacing:2px; }
.template-9 .segment { display:flex; flex-direction:column; align-items:center; }
.template-9 .sep { font-size:72px; color:#3BD16F; }
.template-9 .date-line { font-size:24px; color:#3BD16F; }
.template-9 .ended-text { font-size:44px; color:#3BD16F; }
.template-9 .timer-wrap::before { content:'> '; color:#3BD16F; font-size:72px; }
`,
  },

  '10': {
    name: 'Sports Scoreboard',
    css: `
.template-10 { background: transparent; font-family:'Arial Black', Arial, sans-serif; }
.template-10 .timer-wrap { display:flex; align-items:center; gap:6px; background:#000000; padding:18px 30px; border:4px solid #FFC400; }
.template-10 .value { font-size:84px; font-weight:900; color:#FFC400; line-height:1; }
.template-10 .label { display:block; font-size:12px; color:#FFC400; text-align:center; margin-top:4px; letter-spacing:2px; }
.template-10 .segment { display:flex; flex-direction:column; align-items:center; }
.template-10 .sep { font-size:84px; color:#FFC400; }
.template-10 .date-line { font-size:26px; color:#FFC400; font-weight:900; }
.template-10 .ended-text { font-size:50px; color:#FFC400; font-weight:900; background:#000; padding:10px 20px; }
`,
  },

  '11': {
    name: 'Soft Pastel',
    css: `
.template-11 { background: transparent; font-family:'Segoe UI', Roboto, sans-serif; }
.template-11 .timer-wrap { display:flex; align-items:baseline; gap:14px; background:#FFF6F2; padding:20px 30px; border-radius:24px; box-shadow:0 6px 18px rgba(0,0,0,.12); }
.template-11 .value { font-size:78px; font-weight:700; color:#6B5B95; line-height:1; }
.template-11 .label { display:block; font-size:12px; color:#B694C7; text-align:center; margin-top:4px; letter-spacing:1px; }
.template-11 .segment { display:flex; flex-direction:column; align-items:center; }
.template-11 .sep { font-size:78px; color:#F7A9A8; }
.template-11 .date-line { font-size:26px; color:#6B5B95; font-weight:600; }
.template-11 .ended-text { font-size:48px; color:#6B5B95; }
`,
  },

  '12': {
    name: 'Cyberpunk',
    css: `
.template-12 { background: transparent; font-family:'Orbitron', 'Courier New', monospace; }
.template-12 .timer-wrap { display:flex; align-items:center; gap:8px; background:linear-gradient(120deg,#1A0B2E,#3B0764); padding:18px 30px; border-radius:4px; border-left:4px solid #F72585; border-right:4px solid #4CC9F0; }
.template-12 .value { font-size:78px; font-weight:700; color:#F72585; text-shadow:2px 0 #4CC9F0; line-height:1; }
.template-12 .label { display:block; font-size:11px; color:#4CC9F0; text-align:center; margin-top:4px; letter-spacing:2px; }
.template-12 .segment { display:flex; flex-direction:column; align-items:center; }
.template-12 .sep { font-size:78px; color:#4CC9F0; }
.template-12 .date-line { font-size:26px; color:#F72585; text-shadow:1px 0 #4CC9F0; }
.template-12 .ended-text { font-size:48px; color:#F72585; text-shadow:2px 0 #4CC9F0; }
`,
  },
};
