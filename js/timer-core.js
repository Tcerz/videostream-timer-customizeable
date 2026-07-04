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
 *   duration    whole seconds to count down from, starting the moment the
 *               page loads (good for "starts in 10:00" style timers)
 *   loop        1 to restart the duration countdown automatically when it
 *               hits zero (ignored when `target` is used)
 *   endText     text shown once the countdown reaches zero
 *               default: "00:00:00"
 *
 *   -- countup mode --
 *   startAt     ISO date-time to count up from. If omitted, counting starts
 *               the moment the page loads (a simple stopwatch).
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
 *               viewer's local timezone (i.e. OBS machine's system time).
 *
 *   -- styling --
 *   template    id of a built-in template, 1-12 (see templates.js)
 *   css         base64-encoded custom CSS, applied AFTER the template so it
 *               can override anything. Target these class names:
 *               .timer-wrap, .segment, .value, .label, .sep, .date-line
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

  // Break a millisecond duration into d/h/m/s (non-negative, floored)
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
    const map = {
      YYYY: String(y),
      MM: pad2(mo + 1),
      MMM: MONTHS[mo],
      DD: pad2(d),
    };
    return tokenFormat.replace(/YYYY|MMM|MM|DD/g, (tok) => map[tok] ?? tok);
  }

  function loadConfigFromParams(params) {
    const mode = params.get('mode') || 'clock';
    const fieldsRaw = params.get('fields') || (mode === 'clock' ? 'date,h,m,s' : 'h,m,s');
    const fields = fieldsRaw.split(',').map((f) => f.trim()).filter(Boolean);

    return {
      mode,
      target: params.get('target') || '',
      duration: params.has('duration') ? parseInt(params.get('duration'), 10) : null,
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
      customCss: params.has('css') ? base64ToUtf8(params.get('css')) : '',
    };
  }

  const LABELS = { d: 'Days', h: 'Hours', m: 'Minutes', s: 'Seconds' };

  function buildDom(root, config) {
    root.innerHTML = '';
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

    root.appendChild(wrap);
    return wrap;
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

    let customTag = document.getElementById('custom-style');
    if (!customTag) {
      customTag = document.createElement('style');
      customTag.id = 'custom-style';
      document.head.appendChild(customTag);
    }
    customTag.textContent = config.customCss || '';

    document.body.className = 'template-' + config.template;
  }

  function formatValue(n, config) {
    return config.pad ? pad2(n) : String(Math.floor(Math.max(n, 0)));
  }

  function start(rootSelector) {
    const params = getParams();
    const config = loadConfigFromParams(params);
    const root = document.querySelector(rootSelector);
    applyCss(config);
    const wrap = buildDom(root, config);

    let countdownFinished = false;
    let durationStartedAt = performance.now();

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
      } else if (config.mode === 'countup') {
        const start = config.startAt ? new Date(config.startAt) : null;
        const startMs = start && !isNaN(start) ? start.getTime() : (window.__timerStartUp ?? (window.__timerStartUp = Date.now()));
        const diff = Date.now() - startMs;
        const b = breakdown(diff);
        writeBreakdown(b);
      } else {
        // countdown
        let remainingMs;
        if (config.target) {
          const targetDate = new Date(config.target);
          remainingMs = targetDate.getTime() - Date.now();
        } else if (config.duration != null && !isNaN(config.duration)) {
          const elapsedSec = (performance.now() - durationStartedAt) / 1000;
          let remainingSec = config.duration - elapsedSec;
          if (remainingSec <= 0 && config.loop) {
            durationStartedAt = performance.now();
            remainingSec = config.duration;
          }
          remainingMs = remainingSec * 1000;
        } else {
          remainingMs = 0;
        }

        if (remainingMs <= 0) {
          if (!countdownFinished) {
            countdownFinished = true;
            wrap.classList.add('finished');
            wrap.innerHTML = `<div class="ended-text">${config.endText}</div>`;
          }
        } else {
          if (countdownFinished) {
            countdownFinished = false;
            wrap.classList.remove('finished');
            wrap.innerHTML = '';
            buildDomInto(wrap, config);
          }
          const b = breakdown(remainingMs);
          writeBreakdown(b);
        }
      }
    }

    function buildDomInto(wrap, config) {
      const tmp = document.createElement('div');
      const built = buildDom(tmp, config);
      wrap.innerHTML = built.innerHTML;
    }

    function writeBreakdown(b) {
      config.fields.forEach((field) => {
        const el = wrap.querySelector(`[data-field="${field}"] .value`);
        if (!el) return;
        el.textContent = formatValue(b[field] ?? 0, config);
      });
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
