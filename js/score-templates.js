/**
 * score-templates.js
 * Built-in visual templates for the Scoreboard widget. Each template is
 * plain CSS scoped by the body.template-N class, targeting this DOM
 * contract:
 *
 *   body.template-N
 *     .scoreboard-wrap
 *       .team-row[data-team="1"]
 *         .team-logo (img, or .logo-fallback with initials if no logo set)
 *         .team-name
 *         .team-score
 *       .team-row[data-team="2"]
 *         (same structure)
 *       .match-timer          (only present when a timer mode is set)
 *     .score-controls          (on-widget +/- and timer buttons)
 *
 * Every template exposes --c1 / --c2 custom properties for team 1 / team 2
 * accent colors, so the builder's color pickers work the same way they do
 * for the Timer & Clock templates.
 */

window.SCORE_TEMPLATES = {
  '1': {
    name: 'Broadcast Bar',
    colors: { c1: '#1E63C9', c2: '#C91E1E' },
    css: `
.template-1 { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
.template-1 .scoreboard-wrap { display:flex; flex-direction:column; gap:3px; }
.template-1 .team-row { display:flex; align-items:center; gap:14px; background:#111318; padding:10px 18px; min-width:340px; }
.template-1 .team-row[data-team="1"] { border-left:6px solid var(--c1,#1E63C9); }
.template-1 .team-row[data-team="2"] { border-left:6px solid var(--c2,#C91E1E); }
.template-1 .team-logo { width:36px; height:36px; border-radius:4px; object-fit:contain; background:rgba(255,255,255,.06); }
.template-1 .logo-fallback { width:36px; height:36px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; color:#fff; }
.template-1 .team-row[data-team="1"] .logo-fallback { background:var(--c1,#1E63C9); }
.template-1 .team-row[data-team="2"] .logo-fallback { background:var(--c2,#C91E1E); }
.template-1 .team-name { flex:1; color:#F2F2F2; font-size:20px; font-weight:600; letter-spacing:.3px; }
.template-1 .team-score { color:#FFFFFF; font-size:26px; font-weight:800; min-width:40px; text-align:center; }
.template-1 .match-timer { text-align:center; background:#000; color:#FFC400; font-size:16px; font-weight:700; padding:5px; letter-spacing:2px; font-family:'IBM Plex Mono',monospace; }
`,
  },

  '2': {
    name: 'Box Score',
    colors: { c1: '#2B7A4B', c2: '#7A2B2B' },
    css: `
.template-2 { font-family:'Segoe UI', Roboto, sans-serif; }
.template-2 .scoreboard-wrap { display:flex; flex-direction:column; background:rgba(15,17,20,.92); border-radius:10px; overflow:hidden; min-width:320px; box-shadow:0 8px 24px rgba(0,0,0,.35); }
.template-2 .team-row { display:flex; align-items:center; gap:12px; padding:12px 16px; }
.template-2 .team-row[data-team="1"] { background:rgba(255,255,255,.03); }
.template-2 .team-logo { width:32px; height:32px; border-radius:50%; object-fit:contain; background:rgba(255,255,255,.08); }
.template-2 .logo-fallback { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; color:#fff; }
.template-2 .team-row[data-team="1"] .logo-fallback { background:var(--c1,#2B7A4B); }
.template-2 .team-row[data-team="2"] .logo-fallback { background:var(--c2,#7A2B2B); }
.template-2 .team-name { flex:1; color:#EDEDED; font-size:18px; font-weight:600; }
.template-2 .team-score { color:#fff; font-size:22px; font-weight:700; background:rgba(255,255,255,.08); border-radius:6px; min-width:36px; text-align:center; padding:2px 8px; }
.template-2 .match-timer { text-align:center; color:#CFCFCF; font-size:14px; font-weight:600; padding:8px; letter-spacing:1px; font-family:'IBM Plex Mono',monospace; border-top:1px solid rgba(255,255,255,.08); }
`,
  },

  '3': {
    name: 'Minimal Clean',
    colors: { c1: '#111111', c2: '#111111' },
    css: `
.template-3 { font-family:'Inter', sans-serif; }
.template-3 .scoreboard-wrap { display:flex; flex-direction:column; gap:8px; min-width:300px; }
.template-3 .team-row { display:flex; align-items:center; gap:12px; background:#FFFFFF; padding:10px 16px; border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,.12); }
.template-3 .team-logo { width:28px; height:28px; object-fit:contain; }
.template-3 .logo-fallback { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; color:#fff; background:#333; }
.template-3 .team-name { flex:1; color:#151515; font-size:17px; font-weight:600; }
.template-3 .team-score { color:#151515; font-size:20px; font-weight:800; min-width:30px; text-align:right; }
.template-3 .match-timer { text-align:center; color:#151515; font-size:14px; font-weight:700; background:#FFFFFF; border-radius:6px; padding:6px; box-shadow:0 2px 10px rgba(0,0,0,.12); font-family:'IBM Plex Mono',monospace; }
`,
  },

  '4': {
    name: 'Esports Neon',
    colors: { c1: '#00F6FF', c2: '#FF00E5' },
    css: `
.template-4 { font-family:'Courier New', monospace; }
.template-4 .scoreboard-wrap { display:flex; flex-direction:column; gap:4px; min-width:340px; }
.template-4 .team-row { display:flex; align-items:center; gap:12px; background:#0A0A0F; padding:10px 18px; border:1px solid rgba(255,255,255,.08); }
.template-4 .team-row[data-team="1"] { box-shadow: inset 4px 0 0 var(--c1,#00F6FF); }
.template-4 .team-row[data-team="2"] { box-shadow: inset 4px 0 0 var(--c2,#FF00E5); }
.template-4 .team-logo { width:32px; height:32px; object-fit:contain; }
.template-4 .logo-fallback { width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; color:#0A0A0F; }
.template-4 .team-row[data-team="1"] .logo-fallback { background:var(--c1,#00F6FF); }
.template-4 .team-row[data-team="2"] .logo-fallback { background:var(--c2,#FF00E5); }
.template-4 .team-name { flex:1; color:#F2F2F2; font-size:17px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
.template-4 .team-row[data-team="1"] .team-score { color:var(--c1,#00F6FF); text-shadow:0 0 8px var(--c1,#00F6FF); }
.template-4 .team-row[data-team="2"] .team-score { color:var(--c2,#FF00E5); text-shadow:0 0 8px var(--c2,#FF00E5); }
.template-4 .team-score { font-size:24px; font-weight:800; min-width:34px; text-align:center; }
.template-4 .match-timer { text-align:center; color:#F2F2F2; font-size:15px; font-weight:700; padding:6px; background:#0A0A0F; border:1px solid rgba(255,255,255,.08); letter-spacing:2px; }
`,
  },

  '5': {
    name: 'Football Classic',
    colors: { c1: '#0B3D0B', c2: '#FFFFFF' },
    css: `
.template-5 { font-family:'Arial Narrow', Arial, sans-serif; }
.template-5 .scoreboard-wrap { display:flex; flex-direction:column; min-width:340px; box-shadow:0 6px 18px rgba(0,0,0,.3); }
.template-5 .team-row { display:flex; align-items:center; gap:12px; padding:9px 16px; }
.template-5 .team-row[data-team="1"] { background:var(--c1,#0B3D0B); }
.template-5 .team-row[data-team="2"] { background:#151515; }
.template-5 .team-logo { width:30px; height:30px; object-fit:contain; background:rgba(255,255,255,.9); border-radius:3px; padding:2px; }
.template-5 .logo-fallback { width:30px; height:30px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; background:#fff; color:#151515; }
.template-5 .team-name { flex:1; color:#fff; font-size:18px; font-weight:800; text-transform:uppercase; letter-spacing:.5px; }
.template-5 .team-score { color:#fff; font-size:22px; font-weight:900; background:rgba(0,0,0,.35); min-width:34px; text-align:center; padding:2px 6px; border-radius:2px; }
.template-5 .match-timer { text-align:center; color:#151515; font-size:15px; font-weight:800; padding:6px; background:#FFC400; letter-spacing:2px; font-family:'IBM Plex Mono',monospace; }
`,
  },

  '6': {
    name: 'Basketball Bold',
    colors: { c1: '#FF6A00', c2: '#1D3557' },
    css: `
.template-6 { font-family:'Arial Black', Arial, sans-serif; }
.template-6 .scoreboard-wrap { display:flex; flex-direction:column; gap:3px; min-width:340px; }
.template-6 .team-row { display:flex; align-items:center; gap:12px; background:#0E0E12; padding:11px 18px; clip-path: polygon(0 0, 100% 0, 96% 100%, 0% 100%); }
.template-6 .team-logo { width:34px; height:34px; object-fit:contain; }
.template-6 .logo-fallback { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px; color:#0E0E12; }
.template-6 .team-row[data-team="1"] .logo-fallback { background:var(--c1,#FF6A00); }
.template-6 .team-row[data-team="2"] .logo-fallback { background:var(--c2,#1D3557); }
.template-6 .team-name { flex:1; color:#F5F5F5; font-size:18px; letter-spacing:.5px; }
.template-6 .team-row[data-team="1"] .team-score { color:var(--c1,#FF6A00); }
.template-6 .team-row[data-team="2"] .team-score { color:var(--c2,#1D3557); background:#F5F5F5; border-radius:3px; padding:1px 8px; }
.template-6 .team-score { font-size:26px; min-width:38px; text-align:center; }
.template-6 .match-timer { text-align:center; color:#0E0E12; font-size:15px; font-weight:900; padding:6px; background:#F5F5F5; letter-spacing:2px; font-family:'IBM Plex Mono',monospace; }
`,
  },
};
