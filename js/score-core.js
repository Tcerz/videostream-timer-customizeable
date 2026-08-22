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
 *   half1                   seconds for the 1st half, used when
 *                           timer=football, default 2700 (45 minutes)
 *   half2                   seconds for the 2nd half, used when
 *                           timer=football, default: same as half1
 *   half                    legacy alias — sets both half1 AND half2 at
 *                           once (kept for old links). Ignored if half1
 *                           and/or half2 are present.
 *   timerVisible            0 to start with the timer hidden (still
 *                           toggleable live from vMix/OBS either way)
 *
 *   -- controls --
 *   controls                1 (default) to show the on-widget buttons
 *   id                      widget instance name, keeps this scoreboard's
 *                           live state separate from any other instance,
 *                           default "score"
 *
 *   -- match log --
 *   logApi                  optional MockAPI (or any REST) resource URL,
 *                           e.g. https://<project-id>.mockapi.io/matchlog
 *                           When set, clicking the 📋 (log match) button
 *                           POSTs the result there instead of only saving
 *                           to this browser's local storage — so every
 *                           scoreboard instance, in any browser (including
 *                           vMix/OBS's embedded one), logs to one shared
 *                           place that matchlog.html can read from any
 *                           browser too. Falls back to local storage if
 *                           the request fails.
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
    const legacyHalf = parseInt(params.get('half'), 10);
    const half1Param = parseInt(params.get('half1'), 10);
    const half2Param = parseInt(params.get('half2'), 10);
    // half1/half2 = length of each half in seconds, set independently by
    // the operator. Falls back to the legacy single `half` param (applied
    // to both halves) for old links, then to 45 minutes.
    const half1Length = !isNaN(half1Param) ? half1Param : (!isNaN(legacyHalf) ? legacyHalf : 2700);
    const half2Length = !isNaN(half2Param) ? half2Param : half1Length;

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
      half1Length, // seconds, 1st half
      half2Length, // seconds, 2nd half
      initialTimerVisible: params.get('timerVisible') !== '0',

      controlsEnabled: params.get('controls') !== '0',
      widgetId: params.get('id') || 'score',

      // Optional MockAPI (or any REST endpoint) resource URL, e.g.
      // https://<project-id>.mockapi.io/matchlog — when set, logged matches
      // are POSTed there (centrally, readable from any browser) in addition
      // to the local per-browser fallback. Leave unset to keep the old
      // local-storage-only behavior.
      logApi: (params.get('logApi') || '').trim(),
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
      <span class="ctrl-divider"></span>
      <div class="ctrl-cluster">
        <button type="button" class="ctrl-btn ctrl-log-match" data-action="log-match" title="Log this result &amp; start next match">&#128203;</button>
      </div>
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
            <button type="button" class="ctrl-btn ctrl-added-time" data-action="toggle-added-time" title="Turn running added time on/off">&#9201;</button>
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

  // ---------------- match log (shared across all scoreboards in this browser) ----------------
  // Read/written by every scoreboard widget instance so the operator can
  // log match after match throughout the day, then print one combined
  // report from matchlog.html at the end.
  const MATCH_LOG_KEY = 'sb-matchlog';

  function saveMatchToLocalLog(entry) {
    let list = [];
    try {
      const raw = window.localStorage.getItem(MATCH_LOG_KEY);
      list = raw ? JSON.parse(raw) : [];
    } catch (e) {
      list = [];
    }
    list.push(entry);
    try {
      window.localStorage.setItem(MATCH_LOG_KEY, JSON.stringify(list));
    } catch (e) {
      /* ignore — logging just won't persist */
    }
  }

  // Sends a logged match to the operator's own MockAPI (or any REST)
  // endpoint via POST. Falls back to the local per-browser log (same as
  // before this feature existed) if no endpoint is configured, or if the
  // request fails for any reason (offline, wrong URL, MockAPI down, etc.)
  // — so a match is never silently lost.
  function logMatchResult(config, state) {
    const entry = {
      id: 'm-' + Date.now(),
      timestamp: new Date().toISOString(),
      t1: config.t1,
      t2: config.t2,
      s1: state.s1,
      s2: state.s2,
      timerMode: config.timerMode,
      widgetId: config.widgetId,
    };
    if (config.timerMode === 'football') {
      entry.half1Minutes = Math.round(config.half1Length / 60);
      entry.half2Minutes = Math.round(config.half2Length / 60);
      entry.halfReached = state.half;
      // Per-half stoppage/added time, so both halves are reported even
      // though the match may have ended in half 2. Falls back to whatever
      // is currently live if a half's tracked value was never set (older
      // saved state before this field existed).
      entry.stoppageHalf1Minutes = state.stoppageHalf1 || 0;
      entry.stoppageHalf2Minutes = state.stoppageHalf2 || 0;
      entry.finalClock = formatFootballClock(
        state.halfElapsedMs,
        (state.half === 1 ? config.half1Length : config.half2Length) * 1000,
        state.half === 1 ? 0 : config.half1Length * 1000,
        state.stoppageClockActive
      );
    } else if (config.timerMode === 'countup') {
      entry.elapsedClock = formatClock(state.elapsedMs);
    } else if (config.timerMode === 'countdown') {
      entry.remainingClock = formatClock(state.remainingMs);
    }

    if (!config.logApi) {
      saveMatchToLocalLog(entry);
      return;
    }

    // MockAPI assigns its own `id` on POST — drop ours so it doesn't clash,
    // matchlog.html reads whichever `id` comes back from the API.
    const { id, ...entryForApi } = entry;
    fetch(config.logApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryForApi),
    })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
      })
      .catch((err) => {
        console.error('[score-core] Failed to log match to', config.logApi, '— saving locally instead.', err);
        saveMatchToLocalLog(entry);
      });
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
      stoppageMinutes: 0, // football — announced "+3' added" badge, CURRENT half only
      stoppageHalf1: 0, // football — final stoppage minutes announced in half 1 (kept after switching to half 2)
      stoppageHalf2: 0, // football — final stoppage minutes announced in half 2
      stoppageClockActive: false, // football — running "+MM:SS" clock on/off
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

  // Football display, capped style: normal mm:ss counting up from the
  // start of the match (half 1 begins at 0:00, half 2 continues from the
  // half length e.g. 45:00, so the clock reads continuously across both
  // halves like a real broadcast clock). By default it STOPS/pins at the
  // end of the current half (e.g. "45:00") and never shows a "+" suffix.
  // Only while `stoppageActive` is manually toggled on does it switch to
  // the classic "45:00+01:12" overflow style and keep counting past the
  // half length; turning it back off pins the display again.
  function formatFootballClock(halfElapsedMs, halfLengthMs, baseOffsetMs, stoppageActive) {
    if (halfElapsedMs <= halfLengthMs) {
      return formatClock(baseOffsetMs + halfElapsedMs);
    }
    if (!stoppageActive) {
      // Past the half length but added time isn't turned on: pin the
      // display at the end of the half instead of rolling over.
      return formatClock(baseOffsetMs + halfLengthMs);
    }
    return formatClock(baseOffsetMs + halfLengthMs) + '+' + formatClock(halfElapsedMs - halfLengthMs);
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
      // visibility (not display) keeps the box's height reserved in the
      // layout even while hidden, so the scoreboard above/below it never
      // shifts position when the timer is shown/hidden.
      matchInfo.style.visibility = state.timerVisible ? '' : 'hidden';
      if (!state.timerVisible) return;

      const timerEl = matchInfo.querySelector('.match-timer');
      if (config.timerMode === 'countup') {
        timerEl.textContent = formatClock(state.elapsedMs);
      } else if (config.timerMode === 'countdown') {
        timerEl.textContent = formatClock(state.remainingMs);
      } else if (config.timerMode === 'football') {
        // Half 1 always starts the clock at 0:00. Half 2 continues from
        // wherever half 1's own length ends (e.g. 25:00 if the operator
        // set the 1st half to 25 minutes) — not from half 2's own length.
        const baseOffsetMs = state.half === 1 ? 0 : config.half1Length * 1000;
        const currentHalfLengthMs = (state.half === 1 ? config.half1Length : config.half2Length) * 1000;
        timerEl.textContent = formatFootballClock(
          state.halfElapsedMs,
          currentHalfLengthMs,
          baseOffsetMs,
          state.stoppageClockActive
        );
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

    function flashLogged(btn) {
      if (!btn) return;
      const original = btn.innerHTML;
      btn.innerHTML = '&#10003;'; // checkmark
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 1200);
    }

    function updateControlsUI() {
      if (!controlsBar) return;
      const playBtn = controlsBar.querySelector('.ctrl-play');
      const pauseBtn = controlsBar.querySelector('.ctrl-pause');
      if (playBtn) playBtn.disabled = state.timerStatus === 'running';
      if (pauseBtn) pauseBtn.disabled = state.timerStatus !== 'running';
      const toggleBtn = controlsBar.querySelector('.ctrl-timer-toggle');
      if (toggleBtn) toggleBtn.classList.toggle('ctrl-timer-hidden', !state.timerVisible);
      const addedTimeBtn = controlsBar.querySelector('.ctrl-added-time');
      if (addedTimeBtn) addedTimeBtn.classList.toggle('ctrl-added-time-active', !!state.stoppageClockActive);
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
          if (state.half === 1) state.stoppageHalf1 = 0;
          else state.stoppageHalf2 = 0;
          state.stoppageClockActive = false;
          state.lastUpdate = now;
        } else if (action === 'add-stoppage') {
          state.stoppageMinutes += 1;
          // Mirror the live badge into the per-half tracker so it survives
          // a "next half" transition (which resets the live badge back to 0).
          if (state.half === 1) state.stoppageHalf1 = state.stoppageMinutes;
          else state.stoppageHalf2 = state.stoppageMinutes;
        } else if (action === 'toggle-added-time') {
          state.stoppageClockActive = !state.stoppageClockActive;
        } else if (action === 'next-half') {
          state.half = state.half === 1 ? 2 : 1;
          state.halfElapsedMs = 0;
          // Reset only the LIVE badge counter for the half we're entering —
          // stoppageHalf1/stoppageHalf2 (the finalized per-half totals) are
          // intentionally left untouched so both halves' added time can
          // still be reported when the match is logged later.
          state.stoppageMinutes = 0;
          state.stoppageClockActive = false;
          state.timerStatus = 'paused';
          state.lastUpdate = now;
        } else if (action === 'toggle-timer-visible') {
          state.timerVisible = !state.timerVisible;
        } else if (action === 'log-match') {
          logMatchResult(config, state);
          flashLogged(btn);
          // ready the board for the next match
          state.s1 = config.s1;
          state.s2 = config.s2;
          state.timerStatus = 'paused';
          state.elapsedMs = 0;
          state.remainingMs = config.duration * 1000;
          state.half = 1;
          state.halfElapsedMs = 0;
          state.stoppageMinutes = 0;
          state.stoppageHalf1 = 0;
          state.stoppageHalf2 = 0;
          state.stoppageClockActive = false;
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
