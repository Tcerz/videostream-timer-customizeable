/**
 * score-templates.js
 * Built-in visual templates for the Scoreboard widget.
 *
 * DOM contract (single horizontal row, like a real broadcast scoreboard):
 *
 *   body.template-N
 *     .scoreboard-wrap
 *       .team-block[data-team="1"]
 *         .team-logo (img) OR .logo-fallback (initials)
 *         .team-name
 *       .score-block
 *         .team-score[data-team="1"]
 *         .score-sep            ("-")
 *         .team-score[data-team="2"]
 *       .team-block[data-team="2"]
 *         (same as team 1)
 *     .match-info                (only present when a timer mode is set)
 *       .half-label              (e.g. "1ST HALF" — football mode only)
 *       .match-timer
 *       .stoppage-badge          (e.g. "+3'" — football mode only)
 *     .score-controls             (on-widget buttons)
 *
 * Colors: each team has THREE independent custom properties so logo,
 * background, and score text can never accidentally collide (e.g. black
 * text on a black background):
 *   --t1-logo, --t1-bg, --t1-score   (team 1)
 *   --t2-logo, --t2-bg, --t2-score   (team 2)
 *
 * Sizing: every font-size/dimension is in vmin, multiplied by --wscale
 * (default 1, adjustable live via the on-widget −/+ buttons), so the
 * whole scoreboard can be resized from within OBS/vMix without ever
 * looking blurry or pixelated — it re-renders sharp at any size.
 */

window.SCORE_TEMPLATES = {
  '1': {
    name: 'Broadcast Bar',
    colors: { t1logo: '#1E63C9', t1bg: '#0E1116', t1score: '#FFFFFF', t2logo: '#C91E1E', t2bg: '#0E1116', t2score: '#FFFFFF' },
    css: `
.template-1 { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
.template-1 .scoreboard-wrap { display:flex; align-items:stretch; background:#0E1116; border-radius:6px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,.35); }
.template-1 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.6vmin * var(--wscale,1)) calc(2.2vmin * var(--wscale,1)); }
.template-1 .team-block[data-team="1"] { background:var(--t1-bg,#0E1116); flex-direction:row; border-right:3px solid rgba(255,255,255,.08); }
.template-1 .team-block[data-team="2"] { background:var(--t2-bg,#0E1116); flex-direction:row-reverse; border-left:3px solid rgba(255,255,255,.08); }
.template-1 .team-logo { width:calc(5.2vmin * var(--wscale,1)); height:calc(5.2vmin * var(--wscale,1)); object-fit:contain; border-radius:4px; }
.template-1 .logo-fallback { width:calc(5.2vmin * var(--wscale,1)); height:calc(5.2vmin * var(--wscale,1)); border-radius:4px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:calc(1.9vmin * var(--wscale,1)); color:#fff; flex:none; }
.template-1 .team-block[data-team="1"] .logo-fallback { background:var(--t1-logo,#1E63C9); }
.template-1 .team-block[data-team="2"] .logo-fallback { background:var(--t2-logo,#C91E1E); }
.template-1 .team-name { color:#F2F2F2; font-size:calc(2.4vmin * var(--wscale,1)); font-weight:600; letter-spacing:.3px; white-space:nowrap; }
.template-1 .score-block { display:flex; align-items:center; gap:calc(1.2vmin * var(--wscale,1)); padding:0 calc(2vmin * var(--wscale,1)); background:#000; }
.template-1 .team-score[data-team="1"] { color:var(--t1-score,#FFFFFF); }
.template-1 .team-score[data-team="2"] { color:var(--t2-score,#FFFFFF); }
.template-1 .team-score { font-size:calc(4.2vmin * var(--wscale,1)); font-weight:800; min-width:calc(3.5vmin * var(--wscale,1)); text-align:center; }
.template-1 .score-sep { color:#666; font-size:calc(3vmin * var(--wscale,1)); font-weight:700; }
.template-1 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); background:#000; color:#FFC400; padding:calc(0.8vmin * var(--wscale,1)); font-family:'IBM Plex Mono',monospace; }
.template-1 .half-label { font-size:calc(1.5vmin * var(--wscale,1)); letter-spacing:2px; opacity:.85; }
.template-1 .match-timer { font-size:calc(2vmin * var(--wscale,1)); font-weight:700; letter-spacing:1px; }
.template-1 .stoppage-badge { font-size:calc(1.5vmin * var(--wscale,1)); color:#FF5C5C; }
`,
  },

  '2': {
    name: 'Box Score',
    colors: { t1logo: '#2B7A4B', t1bg: '#171A1E', t1score: '#7CFF9E', t2logo: '#7A2B2B', t2bg: '#171A1E', t2score: '#FF8C8C' },
    css: `
.template-2 { font-family:'Segoe UI', Roboto, sans-serif; }
.template-2 .scoreboard-wrap { display:flex; align-items:stretch; background:rgba(15,17,20,.92); border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.35); }
.template-2 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.6vmin * var(--wscale,1)) calc(2vmin * var(--wscale,1)); }
.template-2 .team-block[data-team="1"] { background:var(--t1-bg,#171A1E); }
.template-2 .team-block[data-team="2"] { background:var(--t2-bg,#171A1E); flex-direction:row-reverse; }
.template-2 .team-logo { width:calc(4.6vmin * var(--wscale,1)); height:calc(4.6vmin * var(--wscale,1)); border-radius:50%; object-fit:contain; }
.template-2 .logo-fallback { width:calc(4.6vmin * var(--wscale,1)); height:calc(4.6vmin * var(--wscale,1)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:calc(1.6vmin * var(--wscale,1)); color:#fff; flex:none; }
.template-2 .team-block[data-team="1"] .logo-fallback { background:var(--t1-logo,#2B7A4B); }
.template-2 .team-block[data-team="2"] .logo-fallback { background:var(--t2-logo,#7A2B2B); }
.template-2 .team-name { color:#EDEDED; font-size:calc(2.2vmin * var(--wscale,1)); font-weight:600; white-space:nowrap; }
.template-2 .score-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:0 calc(2vmin * var(--wscale,1)); }
.template-2 .team-score[data-team="1"] { color:var(--t1-score,#7CFF9E); }
.template-2 .team-score[data-team="2"] { color:var(--t2-score,#FF8C8C); }
.template-2 .team-score { font-size:calc(3.6vmin * var(--wscale,1)); font-weight:700; min-width:calc(3.2vmin * var(--wscale,1)); text-align:center; }
.template-2 .score-sep { color:#777; font-size:calc(2.6vmin * var(--wscale,1)); }
.template-2 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); color:#CFCFCF; padding:calc(0.9vmin * var(--wscale,1)); font-family:'IBM Plex Mono',monospace; border-top:1px solid rgba(255,255,255,.08); }
.template-2 .half-label { font-size:calc(1.4vmin * var(--wscale,1)); letter-spacing:1px; opacity:.8; }
.template-2 .match-timer { font-size:calc(1.9vmin * var(--wscale,1)); font-weight:600; }
.template-2 .stoppage-badge { font-size:calc(1.4vmin * var(--wscale,1)); color:#FF9E5C; }
`,
  },

  '3': {
    name: 'Minimal Clean',
    colors: { t1logo: '#1E63C9', t1bg: '#FFFFFF', t1score: '#151515', t2logo: '#C91E1E', t2bg: '#FFFFFF', t2score: '#151515' },
    css: `
.template-3 { font-family:'Inter', sans-serif; }
.template-3 .scoreboard-wrap { display:flex; align-items:stretch; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 14px rgba(0,0,0,.15); }
.template-3 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.5vmin * var(--wscale,1)) calc(2vmin * var(--wscale,1)); border-bottom:3px solid transparent; }
.template-3 .team-block[data-team="1"] { background:var(--t1-bg,#FFFFFF); border-bottom-color:var(--t1-logo,#1E63C9); }
.template-3 .team-block[data-team="2"] { background:var(--t2-bg,#FFFFFF); flex-direction:row-reverse; border-bottom-color:var(--t2-logo,#C91E1E); }
.template-3 .team-logo { width:calc(4.2vmin * var(--wscale,1)); height:calc(4.2vmin * var(--wscale,1)); object-fit:contain; }
.template-3 .logo-fallback { width:calc(4.2vmin * var(--wscale,1)); height:calc(4.2vmin * var(--wscale,1)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:calc(1.5vmin * var(--wscale,1)); color:#fff; flex:none; }
.template-3 .team-block[data-team="1"] .logo-fallback { background:var(--t1-logo,#1E63C9); }
.template-3 .team-block[data-team="2"] .logo-fallback { background:var(--t2-logo,#C91E1E); }
.template-3 .team-name { color:#151515; font-size:calc(2.1vmin * var(--wscale,1)); font-weight:600; white-space:nowrap; }
.template-3 .score-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:0 calc(1.8vmin * var(--wscale,1)); }
.template-3 .team-score[data-team="1"] { color:var(--t1-score,#151515); }
.template-3 .team-score[data-team="2"] { color:var(--t2-score,#151515); }
.template-3 .team-score { font-size:calc(3.4vmin * var(--wscale,1)); font-weight:800; min-width:calc(3vmin * var(--wscale,1)); text-align:center; }
.template-3 .score-sep { color:#BBB; font-size:calc(2.4vmin * var(--wscale,1)); }
.template-3 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); color:#151515; background:#fff; padding:calc(0.8vmin * var(--wscale,1)); margin-top:calc(0.6vmin * var(--wscale,1)); border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,.12); font-family:'IBM Plex Mono',monospace; }
.template-3 .half-label { font-size:calc(1.4vmin * var(--wscale,1)); letter-spacing:1px; opacity:.7; }
.template-3 .match-timer { font-size:calc(1.9vmin * var(--wscale,1)); font-weight:700; }
.template-3 .stoppage-badge { font-size:calc(1.4vmin * var(--wscale,1)); color:#C91E1E; }
`,
  },

  '4': {
    name: 'Esports Neon',
    colors: { t1logo: '#00F6FF', t1bg: '#0A0A0F', t1score: '#00F6FF', t2logo: '#FF00E5', t2bg: '#0A0A0F', t2score: '#FF00E5' },
    css: `
.template-4 { font-family:'Courier New', monospace; }
.template-4 .scoreboard-wrap { display:flex; align-items:stretch; background:#0A0A0F; border:1px solid rgba(255,255,255,.08); }
.template-4 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.5vmin * var(--wscale,1)) calc(2vmin * var(--wscale,1)); }
.template-4 .team-block[data-team="1"] { background:var(--t1-bg,#0A0A0F); box-shadow: inset -3px 0 0 var(--t1-logo,#00F6FF); }
.template-4 .team-block[data-team="2"] { background:var(--t2-bg,#0A0A0F); flex-direction:row-reverse; box-shadow: inset 3px 0 0 var(--t2-logo,#FF00E5); }
.template-4 .team-logo { width:calc(4.6vmin * var(--wscale,1)); height:calc(4.6vmin * var(--wscale,1)); object-fit:contain; }
.template-4 .logo-fallback { width:calc(4.6vmin * var(--wscale,1)); height:calc(4.6vmin * var(--wscale,1)); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:calc(1.6vmin * var(--wscale,1)); color:#0A0A0F; flex:none; }
.template-4 .team-block[data-team="1"] .logo-fallback { background:var(--t1-logo,#00F6FF); }
.template-4 .team-block[data-team="2"] .logo-fallback { background:var(--t2-logo,#FF00E5); }
.template-4 .team-name { color:#F2F2F2; font-size:calc(2vmin * var(--wscale,1)); font-weight:700; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; }
.template-4 .score-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:0 calc(2vmin * var(--wscale,1)); }
.template-4 .team-score[data-team="1"] { color:var(--t1-score,#00F6FF); text-shadow:0 0 8px var(--t1-score,#00F6FF); }
.template-4 .team-score[data-team="2"] { color:var(--t2-score,#FF00E5); text-shadow:0 0 8px var(--t2-score,#FF00E5); }
.template-4 .team-score { font-size:calc(3.8vmin * var(--wscale,1)); font-weight:800; min-width:calc(3.2vmin * var(--wscale,1)); text-align:center; }
.template-4 .score-sep { color:#666; font-size:calc(2.6vmin * var(--wscale,1)); }
.template-4 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); color:#F2F2F2; padding:calc(0.8vmin * var(--wscale,1)); background:#0A0A0F; border:1px solid rgba(255,255,255,.08); border-top:none; }
.template-4 .half-label { font-size:calc(1.4vmin * var(--wscale,1)); letter-spacing:2px; opacity:.8; }
.template-4 .match-timer { font-size:calc(1.9vmin * var(--wscale,1)); font-weight:700; }
.template-4 .stoppage-badge { font-size:calc(1.4vmin * var(--wscale,1)); color:#FF00E5; }
`,
  },

  '5': {
    name: 'Football Classic',
    colors: { t1logo: '#FFFFFF', t1bg: '#0B3D0B', t1score: '#FFFFFF', t2logo: '#FFFFFF', t2bg: '#7A0B0B', t2score: '#FFFFFF' },
    css: `
.template-5 { font-family:'Arial Narrow', Arial, sans-serif; }
.template-5 .scoreboard-wrap { display:flex; align-items:stretch; box-shadow:0 6px 18px rgba(0,0,0,.3); }
.template-5 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.4vmin * var(--wscale,1)) calc(2vmin * var(--wscale,1)); }
.template-5 .team-block[data-team="1"] { background:var(--t1-bg,#0B3D0B); }
.template-5 .team-block[data-team="2"] { background:var(--t2-bg,#7A0B0B); flex-direction:row-reverse; }
.template-5 .team-logo { width:calc(4.4vmin * var(--wscale,1)); height:calc(4.4vmin * var(--wscale,1)); object-fit:contain; background:rgba(255,255,255,.9); border-radius:3px; padding:2px; }
.template-5 .logo-fallback { width:calc(4.4vmin * var(--wscale,1)); height:calc(4.4vmin * var(--wscale,1)); border-radius:3px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:calc(1.5vmin * var(--wscale,1)); background:#fff; flex:none; }
.template-5 .team-block[data-team="1"] .logo-fallback { color:var(--t1-logo,#0B3D0B); }
.template-5 .team-block[data-team="2"] .logo-fallback { color:var(--t2-logo,#7A0B0B); }
.template-5 .team-name { color:#fff; font-size:calc(2.2vmin * var(--wscale,1)); font-weight:800; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }
.template-5 .score-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:0 calc(1.8vmin * var(--wscale,1)); background:rgba(0,0,0,.5); }
.template-5 .team-score[data-team="1"] { color:var(--t1-score,#FFFFFF); }
.template-5 .team-score[data-team="2"] { color:var(--t2-score,#FFFFFF); }
.template-5 .team-score { font-size:calc(3.8vmin * var(--wscale,1)); font-weight:900; min-width:calc(3.2vmin * var(--wscale,1)); text-align:center; }
.template-5 .score-sep { color:#ccc; font-size:calc(2.6vmin * var(--wscale,1)); }
.template-5 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); color:#151515; padding:calc(0.9vmin * var(--wscale,1)); background:#FFC400; font-family:'IBM Plex Mono',monospace; }
.template-5 .half-label { font-size:calc(1.5vmin * var(--wscale,1)); letter-spacing:1.5px; font-weight:800; }
.template-5 .match-timer { font-size:calc(2vmin * var(--wscale,1)); font-weight:900; }
.template-5 .stoppage-badge { font-size:calc(1.5vmin * var(--wscale,1)); font-weight:800; color:#7A0B0B; }
`,
  },

  '6': {
    name: 'Basketball Bold',
    colors: { t1logo: '#FF6A00', t1bg: '#0E0E12', t1score: '#FF6A00', t2logo: '#1D3557', t2bg: '#0E0E12', t2score: '#4C7FB5' },
    css: `
.template-6 { font-family:'Arial Black', Arial, sans-serif; }
.template-6 .scoreboard-wrap { display:flex; align-items:stretch; background:#0E0E12; }
.template-6 .team-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:calc(1.5vmin * var(--wscale,1)) calc(2vmin * var(--wscale,1)); border-top:3px solid transparent; }
.template-6 .team-block[data-team="1"] { background:var(--t1-bg,#0E0E12); border-top-color:var(--t1-logo,#FF6A00); }
.template-6 .team-block[data-team="2"] { background:var(--t2-bg,#0E0E12); flex-direction:row-reverse; border-top-color:var(--t2-logo,#1D3557); }
.template-6 .team-logo { width:calc(4.8vmin * var(--wscale,1)); height:calc(4.8vmin * var(--wscale,1)); object-fit:contain; }
.template-6 .logo-fallback { width:calc(4.8vmin * var(--wscale,1)); height:calc(4.8vmin * var(--wscale,1)); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:calc(1.7vmin * var(--wscale,1)); color:#0E0E12; flex:none; }
.template-6 .team-block[data-team="1"] .logo-fallback { background:var(--t1-logo,#FF6A00); }
.template-6 .team-block[data-team="2"] .logo-fallback { background:var(--t2-logo,#1D3557); }
.template-6 .team-name { color:#F5F5F5; font-size:calc(2.2vmin * var(--wscale,1)); letter-spacing:.5px; white-space:nowrap; }
.template-6 .score-block { display:flex; align-items:center; gap:calc(1vmin * var(--wscale,1)); padding:0 calc(2vmin * var(--wscale,1)); }
.template-6 .team-score[data-team="1"] { color:var(--t1-score,#FF6A00); }
.template-6 .team-score[data-team="2"] { color:var(--t2-score,#4C7FB5); }
.template-6 .team-score { font-size:calc(4vmin * var(--wscale,1)); min-width:calc(3.4vmin * var(--wscale,1)); text-align:center; }
.template-6 .score-sep { color:#555; font-size:calc(2.8vmin * var(--wscale,1)); }
.template-6 .match-info { display:flex; align-items:center; justify-content:center; gap:calc(1vmin * var(--wscale,1)); color:#0E0E12; padding:calc(0.8vmin * var(--wscale,1)); background:#F5F5F5; margin-top:calc(0.5vmin * var(--wscale,1)); font-family:'IBM Plex Mono',monospace; }
.template-6 .half-label { font-size:calc(1.4vmin * var(--wscale,1)); letter-spacing:1.5px; }
.template-6 .match-timer { font-size:calc(1.9vmin * var(--wscale,1)); font-weight:900; }
.template-6 .stoppage-badge { font-size:calc(1.4vmin * var(--wscale,1)); color:#7A0B0B; }
`,
  },
};
