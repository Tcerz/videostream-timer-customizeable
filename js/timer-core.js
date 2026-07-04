/**
 * timer-core.js
 * Shared engine for the OBS/vMix countdown & clock widget.
 *
 * URL parameters (all optional unless noted):
 *
 *   mode        countdown | countup | clock          default: clock
 *
 *   -- countdown mode --
 *   target      ISO date-time to count down to, e.g. 2026-12-31T23:59:59
 *               (either `target` OR `duration` is required for countdown)
 *   duration    whole seconds to count down from. Required for Play/Pause/
 *               Reset controls to be available.
 *   loop        1 to restart the duration countdown automatically at zero
 *   endText     text shown once the countdown reaches zero
 *               default: "00:00:00"
 *
 *   -- countup mode --
 *   startAt     ISO date-time to seed the initial elapsed time from, only
 *               used the very first time the widget loads (no saved state
 *               yet). If omitted, counting starts from zero.
 *
 *   -- clock mode --
 *   (no extra params needed - just shows the current time / date)
 *
 *   -- shared display options --
 *   fields      comma list of units to show, in the order shown.
 *               countdown/countup: any of d,h,m,s   e.g. "h,m,s" or "m,s"
 *               clock: any of date,h,m,s             e.g. "date,h,m,s"
 *               default: "h,m,s"
 *   showLabels  1 to show a small label under each number (Days, Hours...)
 *   pad         1 (default) to zero-pad values, 0 to show raw numbers
 *   sep         separator string between segments, default ":"
 *   dateFormat  token string for date rendering, tokens: YYYY MM DD MMM
 *               default: "DD MMM YYYY"
 *   timezone    IANA timezone name, e.g. "Asia/Jakarta". Defaults to the
 *               viewer's local timezone (i.e. OBS/vMix machine's clock).
 *
 *   -- styling --
 *   template    id of a built-in template, 1-12 (see templates.js)
 *   c1, c2      hex colors that override the template's --c1 / --c2
 *               custom properties (its two accent colors)
 *   css         base64-encoded custom CSS, applied AFTER template + colors
 *               so it can override anything. Target these class names:
 *               .timer-wrap, .segment, .value, .label, .sep, .date-line,
 *               .timer-controls
 *
 *   -- play / pause / reset controls --
 *   controls    1 (default) to show the control bar. Only rendered for
 *               `mode=countdown` with `duration` set, or `mode=countup`
 *               — a fixed `target` date or a plain clock can't be paused.
 *   autostart   1 (default) to start running immediately the very first
 *               time the widget loads. Ignored on later loads — once a
 *               saved state exists (browser localStorage), it always
 *               resumes from that, so reloading the browser source in
 *               OBS/vMix does not reset an in-progress timer.
 *   id          a short name identifying this widget instance, default
 *               "timer". Give each simultaneous timer a different id so
 *               their play/pause state doesn't collide in storage.
 */

window.TimerCore = (function () {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function pad2(n) {
    n = Math.floor(Math.max(n, 0));
    return n < 10 ? '0' + n : String(n);
  }

  function base64ToUtf8(b64) {
    try {
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      console.warn('Could not decode custom css param', e);
      return '';
    }
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  function breakdown(ms) {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { d, h, m, s, totalSeconds };
  }

  function nowInTZ(timezone) {
    if (!timezone) return new Date();
    try {
      const str = new Date().toLocaleString('en-US', { timeZone: timezone });
      return new Date(str);
    } catch (e) {
      return new Date();
    }
  }

  function formatDate(date, tokenFormat) {
    const y = date.getFullYear();
    const mo = date.getMonth();
    const d = date.getDate();
    const map = { YYYY: String(y), MM: pad2(mo + 1), MMM: MONTHS[mo], DD: pad2(d) };
    return tokenFormat.replace(/YYYY|MMM|MM|DD/g, (tok) => map[tok] ?? tok);
  }

  function loadConfigFromParams(params) {
    const mode = params.get('mode') || 'clock';
    const fieldsRaw = params.get('fields') || (mode === 'clock' ? 'date,h,m,s' : 'h,m,s');
    const fields = fieldsRaw.split(',').map((f) => f.trim()).filter(Boolean);
    const hasDuration = params.has('duration') && !isNaN(parseInt(params.get('duration'), 10));

    return {
      mode,
      target: params.get('target') || '',
      duration: hasDuration ? parseInt(params.get('duration'), 10) : null,
      loop: params.get('loop') === '1',
      endText: params.get('endText') || '00:00:00',
      startAt: params.get('startAt') || '',
      fields,
      showLabels: params.get('showLabels') === '1',
      pad: params.get('pad') !== '0',
      sep: params.has('sep') ? params.get('sep') : ':',
      dateFormat: params.get('dateFormat') || 'DD MMM YYYY',
      timezone: params.get('timezone') || '',
      template: params.get('template') || '1',
      c1: params.get('c1') || '',
      c2: params.get('c2') || '',
      customCss: params.has('css') ? base64ToUtf8(params.get('css')) : '',
      controlsEnabled: params.get('controls') !== '0' && (mode === 'countup' || (mode === 'countdown' && hasDuration)),
      autostart: params.get('autostart') !== '0',
      widgetId: params.get('id') || 'timer',
    };
  }

  const LABELS = { d: 'Days', h: 'Hours', m: 'Minutes', s: 'Seconds' };

  function buildTimerWrap(config) {
    const wrap = document.createElement('div');
    wrap.className = 'timer-wrap';

    config.fields.forEach((field, i) => {
      if (field === 'date') {
        const dateEl = document.createElement('div');
        dateEl.className = 'date-line';
        dateEl.dataset.field = 'date';
        wrap.appendChild(dateEl);
        return;
      }
      const seg = document.createElement('div');
      seg.className = 'segment';
      seg.dataset.field = field;
      const val = document.createElement('span');
      val.className = 'value';
      val.textContent = '00';
      seg.appendChild(val);
      if (config.showLabels && LABELS[field]) {
        const lab = document.createElement('span');
        lab.className = 'label';
        lab.textContent = LABELS[field];
        seg.appendChild(lab);
      }
      wrap.appendChild(seg);

      const isLastNumeric = i === config.fields.length - 1;
      if (!isLastNumeric && config.sep) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = config.sep;
        wrap.appendChild(sep);
      }
    });

    return wrap;
  }

  function buildControls() {
    const bar = document.createElement('div');
    bar.className = 'timer-controls';
    bar.innerHTML = `
      <button type="button" class="ctrl-btn ctrl-play" data-action="play" title="Play">&#9654;</button>
      <button type="button" class="ctrl-btn ctrl-pause" data-action="pause" title="Pause">&#10074;&#10074;</button>
      <button type="button" class="ctrl-btn ctrl-reset" data-action="reset" title="Reset">&#8635;</button>
    `;
    return bar;
  }

  function applyCss(config) {
    let templateTag = document.getElementById('tpl-style');
    if (!templateTag) {
      templateTag = document.createElement('style');
      templateTag.id = 'tpl-style';
      document.head.appendChild(templateTag);
    }
    const tpl = window.TIMER_TEMPLATES ? window.TIMER_TEMPLATES[config.template] : null;
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

  function formatValue(n, config) {
    return config.pad ? pad2(n) : String(Math.floor(Math.max(n, 0)));
  }

  // ---------------- persisted play/pause/reset state ----------------

  function storageKey(config) {
    return 'timecode:' + config.widgetId;
  }

  function loadState(config) {
    try {
      const raw = window.localStorage.getItem(storageKey(config));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* storage unavailable — fall through to a fresh state */
    }
    if (config.mode === 'countup') {
      const seed = config.startAt ? new Date(config.startAt) : null;
      const elapsedMs = seed && !isNaN(seed) ? Date.now() - seed.getTime() : 0;
      return { status: config.autostart ? 'running' : 'paused', elapsedMs, lastUpdate: Date.now() };
    }
    // countdown with duration
    return {
      status: config.autostart ? 'running' : 'paused',
      remainingMs: (config.duration || 0) * 1000,
      lastUpdate: Date.now(),
    };
  }

  function saveState(config, state) {
    try {
      window.localStorage.setItem(storageKey(config), JSON.stringify(state));
    } catch (e) {
      /* ignore — widget still works, just won't survive a reload */
    }
  }

  function wireControls(bar, config, state, onChange) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.ctrl-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      const now = Date.now();

      if (action === 'play') {
        if (state.status === 'finished') {
          if (config.mode === 'countup') state.elapsedMs = 0;
          else state.remainingMs = (config.duration || 0) * 1000;
        }
        state.status = 'running';
        state.lastUpdate = now;
      } else if (action === 'pause') {
        state.status = 'paused';
        state.lastUpdate = now;
      } else if (action === 'reset') {
        if (config.mode === 'countup') state.elapsedMs = 0;
        else state.remainingMs = (config.duration || 0) * 1000;
        state.status = 'paused';
        state.lastUpdate = now;
      }

      saveState(config, state);
      onChange();
    });
  }

  function updateControlsUI(bar, state) {
    if (!bar) return;
    bar.querySelector('.ctrl-play').disabled = state.status === 'running';
    bar.querySelector('.ctrl-pause').disabled = state.status !== 'running';
  }

  function start(rootSelector) {
    const params = getParams();
    const config = loadConfigFromParams(params);
    const root = document.querySelector(rootSelector);
    applyCss(config);

    let wrap = buildTimerWrap(config);
    root.appendChild(wrap);

    let controlsBar = null;
    if (config.controlsEnabled) {
      controlsBar = buildControls();
      root.appendChild(controlsBar);
    }

    const state = loadState(config);

    function rebuildWrap() {
      const fresh = buildTimerWrap(config);
      wrap.replaceWith(fresh);
      wrap = fresh;
    }

    if (controlsBar) {
      wireControls(controlsBar, config, state, () => {
        if (wrap.querySelector('.ended-text')) rebuildWrap();
        tick();
      });
    }

    function writeBreakdown(b) {
      config.fields.forEach((field) => {
        const el = wrap.querySelector(`[data-field="${field}"] .value`);
        if (!el) return;
        el.textContent = formatValue(b[field] ?? 0, config);
      });
    }

    function showEnded() {
      wrap.innerHTML = `<div class="ended-text">${config.endText}</div>`;
      wrap.classList.add('finished');
    }

    function tick() {
      const now = nowInTZ(config.timezone);

      if (config.mode === 'clock') {
        config.fields.forEach((field) => {
          if (field === 'date') {
            const el = wrap.querySelector('[data-field="date"]');
            if (el) el.textContent = formatDate(now, config.dateFormat);
          } else {
            const el = wrap.querySelector(`[data-field="${field}"] .value`);
            if (!el) return;
            if (field === 'h') el.textContent = pad2(now.getHours());
            if (field === 'm') el.textContent = pad2(now.getMinutes());
            if (field === 's') el.textContent = pad2(now.getSeconds());
          }
        });
        return;
      }

      if (config.mode === 'countup') {
        const t = Date.now();
        if (state.status === 'running') {
          const delta = t - (state.lastUpdate || t);
          state.elapsedMs = (state.elapsedMs || 0) + delta;
          state.lastUpdate = t;
          saveState(config, state);
        }
        writeBreakdown(breakdown(state.elapsedMs || 0));
        updateControlsUI(controlsBar, state);
        return;
      }

      // countdown
      if (config.target && !config.controlsEnabled) {
        // fixed wall-clock target, no manual controls — always live
        const remainingMs = new Date(config.target).getTime() - Date.now();
        if (remainingMs <= 0) {
          if (!wrap.classList.contains('finished')) showEnded();
        } else {
          if (wrap.classList.contains('finished')) rebuildWrap();
          writeBreakdown(breakdown(remainingMs));
        }
        return;
      }

      // countdown with duration (controllable)
      const t = Date.now();
      if (state.status === 'running') {
        const delta = t - (state.lastUpdate || t);
        state.remainingMs = (state.remainingMs ?? (config.duration || 0) * 1000) - delta;
        state.lastUpdate = t;

        if (state.remainingMs <= 0) {
          if (config.loop && config.duration) {
            while (state.remainingMs <= 0) state.remainingMs += config.duration * 1000;
          } else {
            state.remainingMs = 0;
            state.status = 'finished';
          }
        }
        saveState(config, state);
      }

      if (state.status === 'finished' && (state.remainingMs ?? 0) <= 0) {
        if (!wrap.classList.contains('finished')) showEnded();
      } else {
        if (wrap.classList.contains('finished')) rebuildWrap();
        writeBreakdown(breakdown(state.remainingMs ?? (config.duration || 0) * 1000));
      }
      updateControlsUI(controlsBar, state);
    }

    tick();
    setInterval(tick, 250);
  }

  return {
    getParams,
    loadConfigFromParams,
    base64ToUtf8,
    utf8ToBase64,
    breakdown,
    formatDate,
    start,
  };
})();
