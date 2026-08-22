/**
 * score-core.js
 * Engine for the Scoreboard widget — two teams, live score, and an
 * optional match timer, all controllable directly from buttons rendered
 * on the widget itself (so a VJ/operator can run it from vMix/OBS without
 * touching the builder page again).
 *
 * URL parameters (all optional unless noted):
 *
 *   -- teams --
 *   t1, t2       team names, default "Team 1" / "Team 2"
 *   s1, s2       starting score, default 0
 *   logo1, logo2 a data: URI (base64-encoded image) for each team's logo.
 *                Built automatically by the builder page when you upload
 *                an image — it resizes it first so the link stays a
 *                reasonable length. If omitted, a colored circle with the
 *                team's initials is shown instead.
 *
 *   -- styling --
 *   template     id of a built-in layout, 1-6 (see score-templates.js)
 *   c1, c2       hex colors overriding each team's accent color
 *   css          base64-encoded custom CSS, applied after the template.
 *                Target: .scoreboard-wrap, .team-row, .team-logo,
 *                .logo-fallback, .team-name, .team-score, .match-timer,
 *                .score-controls
 *
 *   -- match timer (optional) --
 *   timer        off | countup | countdown     default: off
 *   duration     seconds, only used when timer=countdown
 *
 *   -- controls --
 *   controls     1 (default) to show the +/− score buttons and (if a
 *                timer is set) play/pause/reset for it
 *   id           widget instance name — keeps this scoreboard's live
 *                score/timer state separate from any other instance,
 *                default "score"
 */

window.ScoreCore = (function () {
  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function base64ToUtf8(b64) {
    try {
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return '';
    }
  }

  function pad2(n) {
    n = Math.floor(Math.max(n, 0));
    return n < 10 ? '0' + n : String(n);
  }

  function initials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function loadConfigFromParams(params) {
    return {
      t1: params.get('t1') || 'Team 1',
      t2: params.get('t2') || 'Team 2',
      s1: parseInt(params.get('s1'), 10) || 0,
      s2: parseInt(params.get('s2'), 10) || 0,
      logo1: params.get('logo1') || '',
      logo2: params.get('logo2') || '',
      template: params.get('template') || '1',
      c1: params.get('c1') || '',
      c2: params.get('c2') || '',
      customCss: params.has('css') ? base64ToUtf8(params.get('css')) : '',
      timerMode: params.get('timer') || 'off', // off | countup | countdown
      duration: parseInt(params.get('duration'), 10) || 600,
      controlsEnabled: params.get('controls') !== '0',
      widgetId: params.get('id') || 'score',
    };
  }

  function applyCss(config) {
    let templateTag = document.getElementById('tpl-style');
    if (!templateTag) {
      templateTag = document.createElement('style');
      templateTag.id = 'tpl-style';
      document.head.appendChild(templateTag);
    }
    const tpl = window.SCORE_TEMPLATES ? window.SCORE_TEMPLATES[config.template] : null;
    templateTag.textContent = tpl ? tpl.css : '';

    document.body.className = 'template-' + config.template;
    if (config.c1) document.body.style.setProperty('--c1', config.c1);
    if (config.c2) document.body.style.setProperty('--c2', config.c2);

    let customTag = document.getElementById('custom-style');
    if (!customTag) {
      customTag = document.createElement('style');
      customTag.id = 'custom-style';
      document.head.appendChild(customTag);
    }
    customTag.textContent = config.customCss || '';
  }

  function buildTeamRow(config, teamNum) {
    const name = teamNum === 1 ? config.t1 : config.t2;
    const logo = teamNum === 1 ? config.logo1 : config.logo2;

    const row = document.createElement('div');
    row.className = 'team-row';
    row.dataset.team = String(teamNum);

    if (logo) {
      const img = document.createElement('img');
      img.className = 'team-logo';
      img.src = logo;
      img.alt = name;
      row.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'logo-fallback';
      fallback.textContent = initials(name);
      row.appendChild(fallback);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'team-name';
    nameEl.textContent = name;
    row.appendChild(nameEl);

    const scoreEl = document.createElement('div');
    scoreEl.className = 'team-score';
    scoreEl.textContent = String(teamNum === 1 ? config.s1 : config.s2);
    row.appendChild(scoreEl);

    return row;
  }

  function buildScoreboard(config) {
    const wrap = document.createElement('div');
    wrap.className = 'scoreboard-wrap';
    wrap.appendChild(buildTeamRow(config, 1));
    wrap.appendChild(buildTeamRow(config, 2));

    if (config.timerMode !== 'off') {
      const timerEl = document.createElement('div');
      timerEl.className = 'match-timer';
      timerEl.textContent = '00:00';
      wrap.appendChild(timerEl);
    }

    return wrap;
  }

  function buildControls(config) {
    const bar = document.createElement('div');
    bar.className = 'score-controls';
    let html = `
      <div class="score-ctrl-group" data-team="1">
        <span class="score-ctrl-label">${escapeHtml(config.t1)}</span>
        <button type="button" class="ctrl-btn ctrl-score-minus" data-action="s1-minus" title="-1">&#8722;</button>
        <button type="button" class="ctrl-btn ctrl-score-plus" data-action="s1-plus" title="+1">&#43;</button>
      </div>
      <div class="score-ctrl-group" data-team="2">
        <span class="score-ctrl-label">${escapeHtml(config.t2)}</span>
        <button type="button" class="ctrl-btn ctrl-score-minus" data-action="s2-minus" title="-1">&#8722;</button>
        <button type="button" class="ctrl-btn ctrl-score-plus" data-action="s2-plus" title="+1">&#43;</button>
      </div>
      <button type="button" class="ctrl-btn ctrl-score-reset" data-action="reset-scores" title="Reset scores">&#8635;</button>
    `;

    if (config.timerMode !== 'off') {
      html += `
        <span class="ctrl-divider"></span>
        <button type="button" class="ctrl-btn ctrl-play" data-action="play" title="Play">&#9654;</button>
        <button type="button" class="ctrl-btn ctrl-pause" data-action="pause" title="Pause">&#10074;&#10074;</button>
        <button type="button" class="ctrl-btn ctrl-reset" data-action="reset-timer" title="Reset timer">&#8635;</button>
      `;
    }

    bar.innerHTML = html;
    return bar;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------- persisted state ----------------

  function storageKey(config) {
    return 'scoreboard:' + config.widgetId;
  }

  function loadState(config) {
    try {
      const raw = window.localStorage.getItem(storageKey(config));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return {
      s1: config.s1,
      s2: config.s2,
      timerStatus: 'paused',
      timerElapsedMs: 0, // countup
      timerRemainingMs: config.duration * 1000, // countdown
      lastUpdate: Date.now(),
    };
  }

  function saveState(config, state) {
    try {
      window.localStorage.setItem(storageKey(config), JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function formatClock(totalMs) {
    const totalSeconds = Math.max(Math.floor(totalMs / 1000), 0);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return pad2(m) + ':' + pad2(s);
  }

  function start(rootSelector) {
    const params = getParams();
    const config = loadConfigFromParams(params);
    const root = document.querySelector(rootSelector);
    applyCss(config);

    const wrap = buildScoreboard(config);
    root.appendChild(wrap);

    const controlsBar = config.controlsEnabled ? buildControls(config) : null;
    if (controlsBar) root.appendChild(controlsBar);

    const state = loadState(config);

    function scoreEl(teamNum) {
      return wrap.querySelector(`.team-row[data-team="${teamNum}"] .team-score`);
    }

    function renderScores() {
      const s1El = scoreEl(1);
      const s2El = scoreEl(2);
      if (s1El) s1El.textContent = String(state.s1);
      if (s2El) s2El.textContent = String(state.s2);
    }

    function renderTimer() {
      const timerEl = wrap.querySelector('.match-timer');
      if (!timerEl) return;
      if (config.timerMode === 'countup') {
        timerEl.textContent = formatClock(state.timerElapsedMs);
      } else if (config.timerMode === 'countdown') {
        timerEl.textContent = formatClock(state.timerRemainingMs);
      }
    }

    function updateControlsUI() {
      if (!controlsBar) return;
      const playBtn = controlsBar.querySelector('.ctrl-play');
      const pauseBtn = controlsBar.querySelector('.ctrl-pause');
      if (playBtn) playBtn.disabled = state.timerStatus === 'running';
      if (pauseBtn) pauseBtn.disabled = state.timerStatus !== 'running';
    }

    if (controlsBar) {
      controlsBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.ctrl-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const now = Date.now();

        if (action === 's1-plus') state.s1 += 1;
        else if (action === 's1-minus') state.s1 = Math.max(0, state.s1 - 1);
        else if (action === 's2-plus') state.s2 += 1;
        else if (action === 's2-minus') state.s2 = Math.max(0, state.s2 - 1);
        else if (action === 'reset-scores') {
          state.s1 = config.s1;
          state.s2 = config.s2;
        } else if (action === 'play') {
          state.timerStatus = 'running';
          state.lastUpdate = now;
        } else if (action === 'pause') {
          state.timerStatus = 'paused';
          state.lastUpdate = now;
        } else if (action === 'reset-timer') {
          state.timerStatus = 'paused';
          state.timerElapsedMs = 0;
          state.timerRemainingMs = config.duration * 1000;
          state.lastUpdate = now;
        }

        saveState(config, state);
        renderScores();
        renderTimer();
        updateControlsUI();
      });
    }

    function tick() {
      if (config.timerMode !== 'off' && state.timerStatus === 'running') {
        const now = Date.now();
        const delta = now - (state.lastUpdate || now);
        state.lastUpdate = now;

        if (config.timerMode === 'countup') {
          state.timerElapsedMs += delta;
        } else if (config.timerMode === 'countdown') {
          state.timerRemainingMs = Math.max(0, state.timerRemainingMs - delta);
          if (state.timerRemainingMs <= 0) state.timerStatus = 'paused';
        }
        saveState(config, state);
      }
      renderTimer();
      updateControlsUI();
    }

    renderScores();
    renderTimer();
    updateControlsUI();
    setInterval(tick, 250);
  }

  return { getParams, loadConfigFromParams, start };
})();
