/**
 * score-core.js
 * Engine for the Scoreboard widget — two teams, live score, and an
 * optional match timer (including a proper 2-half football clock with
 * stoppage time), all controllable directly from buttons rendered on the
 * widget itself.
 *
 * URL parameters (all optional unless noted):
 *
 *   -- teams --
 *   t1, t2                 team names, default "Team 1" / "Team 2"
 *   s1, s2                 starting score, default 0
 *   logo1, logo2            a data: URI (base64 image), built automatically
 *                           by the builder when you upload a logo. If
 *                           omitted, a colored circle with initials shows.
 *
 *   -- colors (independent per team, so text never collides with its own
 *      background) --
 *   t1logo, t1bg, t1score    team 1: logo badge color, row/block background,
 *                             score text color
 *   t2logo, t2bg, t2score    same, for team 2
 *
 *   -- styling --
 *   template                id of a built-in layout, 1-6
 *   css                     base64-encoded custom CSS, applied after
 *                            everything else
 *
 *   -- sizing --
 *   scale                   size multiplier, default 1
 *   sizeControls            0 to hide the on-widget −/⟲/+ size buttons
 *
 *   -- match timer --
 *   timer                   off | countup | countdown | football
 *                           default: off
 *   duration                seconds, used when timer=countdown
 *   half                    seconds per half, used when timer=football,
 *                           default 2700 (45 minutes)
 *   timerVisible            0 to start with the timer hidden (still
 *                           toggleable live from vMix/OBS either way)
 *
 *   -- controls --
 *   controls                1 (default) to show the on-widget buttons
 *   id                      widget instance name, keeps this scoreboard's
 *                           live state separate from any other instance,
 *                           default "score"
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

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function clampScale(v) {
    return Math.round(clamp(v, 0.4, 3) * 100) / 100;
  }

  function initials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function loadConfigFromParams(params) {
    const scaleParam = parseFloat(params.get('scale'));
    return {
      t1: params.get('t1') || 'Team 1',
      t2: params.get('t2') || 'Team 2',
      s1: parseInt(params.get('s1'), 10) || 0,
      s2: parseInt(params.get('s2'), 10) || 0,
      logo1: params.get('logo1') || '',
      logo2: params.get('logo2') || '',

      t1logo: params.get('t1logo') || '',
      t1bg: params.get('t1bg') || '',
      t1score: params.get('t1score') || '',
      t2logo: params.get('t2logo') || '',
      t2bg: params.get('t2bg') || '',
      t2score: params.get('t2score') || '',

      template: params.get('template') || '1',
      customCss: params.has('css') ? base64ToUtf8(params.get('css')) : '',

      initialScale: isNaN(scaleParam) ? 1 : clampScale(scaleParam),
      sizeControlsEnabled: params.get('sizeControls') !== '0',

      timerMode: params.get('timer') || 'off', // off | countup | countdown | football
      duration: parseInt(params.get('duration'), 10) || 600,
      halfLength: parseInt(params.get('half'), 10) || 2700, // 45 min
      initialTimerVisible: params.get('timerVisible') !== '0',

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

    const defaults = (tpl && tpl.colors) || {};
    const map = {
      '--t1-logo': config.t1logo || defaults.t1logo,
      '--t1-bg': config.t1bg || defaults.t1bg,
      '--t1-score': config.t1score || defaults.t1score,
      '--t2-logo': config.t2logo || defaults.t2logo,
      '--t2-bg': config.t2bg || defaults.t2bg,
      '--t2-score': config.t2score || defaults.t2score,
    };
    Object.keys(map).forEach((k) => {
      if (map[k]) document.body.style.setProperty(k, map[k]);
    });

    let customTag = document.getElementById('custom-style');
    if (!customTag) {
      customTag = document.createElement('style');
      customTag.id = 'custom-style';
      document.head.appendChild(customTag);
    }
    customTag.textContent = config.customCss || '';
  }

  function applyScale(value) {
    document.body.style.setProperty('--wscale', value);
  }

  // ---------------- DOM building ----------------

  function buildTeamBlock(config, teamNum) {
    const name = teamNum === 1 ? config.t1 : config.t2;
    const logo = teamNum === 1 ? config.logo1 : config.logo2;

    const block = document.createElement('div');
    block.className = 'team-block';
    block.dataset.team = String(teamNum);

    if (logo) {
      const img = document.createElement('img');
      img.className = 'team-logo';
      img.src = logo;
      img.alt = name;
      block.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'logo-fallback';
      fallback.textContent = initials(name);
      block.appendChild(fallback);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'team-name';
    nameEl.textContent = name;
    block.appendChild(nameEl);

    return block;
  }

  function buildScoreboard(config) {
    const wrap = document.createElement('div');
    wrap.className = 'scoreboard-wrap';

    wrap.appendChild(buildTeamBlock(config, 1));

    const scoreBlock = document.createElement('div');
    scoreBlock.className = 'score-block';
    const s1 = document.createElement('div');
    s1.className = 'team-score';
    s1.dataset.team = '1';
    s1.textContent = String(config.s1);
    const sep = document.createElement('div');
    sep.className = 'score-sep';
    sep.textContent = '-';
    const s2 = document.createElement('div');
    s2.className = 'team-score';
    s2.dataset.team = '2';
    s2.textContent = String(config.s2);
    scoreBlock.appendChild(s1);
    scoreBlock.appendChild(sep);
    scoreBlock.appendChild(s2);
    wrap.appendChild(scoreBlock);

    wrap.appendChild(buildTeamBlock(config, 2));

    return wrap;
  }

  function buildMatchInfo(config) {
    if (config.timerMode === 'off') return null;
    const info = document.createElement('div');
    info.className = 'match-info';

    if (config.timerMode === 'football') {
      const halfLabel = document.createElement('span');
      halfLabel.className = 'half-label';
      halfLabel.textContent = '1ST HALF';
      info.appendChild(halfLabel);
    }

    const timer = document.createElement('span');
    timer.className = 'match-timer';
    timer.textContent = '00:00';
    info.appendChild(timer);

    if (config.timerMode === 'football') {
      const badge = document.createElement('span');
      badge.className = 'stoppage-badge';
      badge.style.display = 'none';
      info.appendChild(badge);
    }

    return info;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildControls(config) {
    const bar = document.createElement('div');
    bar.className = 'score-controls';
    let html = '';

    if (config.sizeControlsEnabled) {
      html += `
        <div class="ctrl-cluster">
          <button type="button" class="ctrl-btn ctrl-size-down" data-action="size-down" title="Smaller">&#8722;</button>
          <button type="button" class="ctrl-btn ctrl-size-reset" data-action="size-reset" title="Reset size">&#8635;</button>
          <button type="button" class="ctrl-btn ctrl-size-up" data-action="size-up" title="Bigger">&#43;</button>
        </div>
      `;
    }

    html += `
      <div class="ctrl-cluster">
        <span class="score-ctrl-label">${escapeHtml(config.t1)}</span>
        <button type="button" class="ctrl-btn ctrl-score-minus" data-action="s1-minus" title="-1">&#8722;</button>
        <button type="button" class="ctrl-btn ctrl-score-plus" data-action="s1-plus" title="+1">&#43;</button>
      </div>
      <div class="ctrl-cluster">
        <span class="score-ctrl-label">${escapeHtml(config.t2)}</span>
        <button type="button" class="ctrl-btn ctrl-score-minus" data-action="s2-minus" title="-1">&#8722;</button>
        <button type="button" class="ctrl-btn ctrl-score-plus" data-action="s2-plus" title="+1">&#43;</button>
      </div>
      <button type="button" class="ctrl-btn ctrl-score-reset" data-action="reset-scores" title="Reset scores">&#8635;</button>
    `;

    if (config.timerMode !== 'off') {
      html += `<span class="ctrl-divider"></span>`;
      html += `
        <div class="ctrl-cluster">
          <button type="button" class="ctrl-btn ctrl-play" data-action="play" title="Play">&#9654;</button>
          <button type="button" class="ctrl-btn ctrl-pause" data-action="pause" title="Pause">&#10074;&#10074;</button>
          <button type="button" class="ctrl-btn ctrl-reset" data-action="reset-timer" title="Reset current half/time">&#8635;</button>
        </div>
      `;
      if (config.timerMode === 'football') {
        html += `
          <div class="ctrl-cluster">
            <button type="button" class="ctrl-btn ctrl-stoppage" data-action="add-stoppage" title="+1' stoppage time">+1&#8242;</button>
            <button type="button" class="ctrl-btn ctrl-next-half" data-action="next-half" title="Next half">&#8677;</button>
          </div>
        `;
      }
      html += `<button type="button" class="ctrl-btn ctrl-timer-toggle" data-action="toggle-timer-visible" title="Show/hide timer">&#128065;</button>`;
    }

    bar.innerHTML = html;
    return bar;
  }

  // ---------------- persisted state ----------------

  function storageKey(config) {
    return 'scoreboard:' + config.widgetId;
  }

  function freshState(config) {
    return {
      s1: config.s1,
      s2: config.s2,
      timerStatus: 'paused',
      lastUpdate: Date.now(),
      elapsedMs: 0, // countup
      remainingMs: config.duration * 1000, // countdown
      half: 1, // football
      halfElapsedMs: 0, // football
      stoppageMinutes: 0, // football
      timerVisible: config.initialTimerVisible,
    };
  }

  function loadState(config) {
    try {
      const raw = window.localStorage.getItem(storageKey(config));
      if (raw) return Object.assign(freshState(config), JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
    return freshState(config);
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

  // Football display: normal mm:ss up to the half length, then pins the
  // base at the half length and shows the overflow separately, e.g.
  // "45:00+01:12" — the standard way stoppage time is shown in broadcasts.
  function formatFootballClock(elapsedMs, halfLengthMs) {
    if (elapsedMs <= halfLengthMs) return formatClock(elapsedMs);
    return formatClock(halfLengthMs) + '+' + formatClock(elapsedMs - halfLengthMs);
  }

  function start(rootSelector) {
    const params = getParams();
    const config = loadConfigFromParams(params);
    const root = document.querySelector(rootSelector);
    applyCss(config);

    let scale = config.initialScale;
    try {
      const savedScale = window.localStorage.getItem('scoreboard:' + config.widgetId + ':scale');
      if (savedScale !== null) scale = clampScale(parseFloat(savedScale));
    } catch (e) {
      /* ignore */
    }
    applyScale(scale);

    const wrap = buildScoreboard(config);
    root.appendChild(wrap);

    const matchInfo = buildMatchInfo(config);
    if (matchInfo) root.appendChild(matchInfo);

    const controlsBar = config.controlsEnabled ? buildControls(config) : null;
    if (controlsBar) root.appendChild(controlsBar);

    const state = loadState(config);

    function saveScale() {
      try {
        window.localStorage.setItem('scoreboard:' + config.widgetId + ':scale', String(scale));
      } catch (e) {
        /* ignore */
      }
    }

    function renderScores() {
      const s1El = wrap.querySelector('.team-score[data-team="1"]');
      const s2El = wrap.querySelector('.team-score[data-team="2"]');
      if (s1El) s1El.textContent = String(state.s1);
      if (s2El) s2El.textContent = String(state.s2);
    }

    function renderTimer() {
      if (!matchInfo) return;
      matchInfo.style.display = state.timerVisible ? '' : 'none';
      if (!state.timerVisible) return;

      const timerEl = matchInfo.querySelector('.match-timer');
      if (config.timerMode === 'countup') {
        timerEl.textContent = formatClock(state.elapsedMs);
      } else if (config.timerMode === 'countdown') {
        timerEl.textContent = formatClock(state.remainingMs);
      } else if (config.timerMode === 'football') {
        timerEl.textContent = formatFootballClock(state.halfElapsedMs, config.halfLength);
        const halfLabel = matchInfo.querySelector('.half-label');
        if (halfLabel) halfLabel.textContent = state.half === 1 ? '1ST HALF' : '2ND HALF';
        const badge = matchInfo.querySelector('.stoppage-badge');
        if (badge) {
          if (state.stoppageMinutes > 0) {
            badge.textContent = `+${state.stoppageMinutes}\u2032 added`;
            badge.style.display = '';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    }

    function updateControlsUI() {
      if (!controlsBar) return;
      const playBtn = controlsBar.querySelector('.ctrl-play');
      const pauseBtn = controlsBar.querySelector('.ctrl-pause');
      if (playBtn) playBtn.disabled = state.timerStatus === 'running';
      if (pauseBtn) pauseBtn.disabled = state.timerStatus !== 'running';
      const toggleBtn = controlsBar.querySelector('.ctrl-timer-toggle');
      if (toggleBtn) toggleBtn.classList.toggle('ctrl-timer-hidden', !state.timerVisible);
    }

    if (controlsBar) {
      controlsBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.ctrl-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const now = Date.now();

        if (action === 'size-down') {
          scale = clampScale(scale - 0.1);
          applyScale(scale);
          saveScale();
          return;
        }
        if (action === 'size-up') {
          scale = clampScale(scale + 0.1);
          applyScale(scale);
          saveScale();
          return;
        }
        if (action === 'size-reset') {
          scale = config.initialScale;
          applyScale(scale);
          saveScale();
          return;
        }

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
          state.elapsedMs = 0;
          state.remainingMs = config.duration * 1000;
          state.halfElapsedMs = 0;
          state.stoppageMinutes = 0;
          state.lastUpdate = now;
        } else if (action === 'add-stoppage') {
          state.stoppageMinutes += 1;
        } else if (action === 'next-half') {
          state.half = state.half === 1 ? 2 : 1;
          state.halfElapsedMs = 0;
          state.stoppageMinutes = 0;
          state.timerStatus = 'paused';
          state.lastUpdate = now;
        } else if (action === 'toggle-timer-visible') {
          state.timerVisible = !state.timerVisible;
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
          state.elapsedMs += delta;
        } else if (config.timerMode === 'countdown') {
          state.remainingMs = Math.max(0, state.remainingMs - delta);
          if (state.remainingMs <= 0) state.timerStatus = 'paused';
        } else if (config.timerMode === 'football') {
          state.halfElapsedMs += delta;
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
