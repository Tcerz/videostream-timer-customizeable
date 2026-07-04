(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    mode: $('#mode'),
    optsTarget: $('#opts-target'),
    optsDuration: $('#opts-duration'),
    optsCountup: $('#opts-countup'),
    optsEndtext: $('#opts-endtext'),
    target: $('#target'),
    durHours: $('#durHours'),
    durMinutes: $('#durMinutes'),
    durSeconds: $('#durSeconds'),
    loop: $('#loop'),
    countupFromNow: $('#countupFromNow'),
    startAtWrap: $('#startAtWrap'),
    startAt: $('#startAt'),
    endText: $('#endText'),
    fieldToggles: $('#fieldToggles'),
    chipDate: $('#chipDate'),
    showLabels: $('#showLabels'),
    zeroPad: $('#zeroPad'),
    sep: $('#sep'),
    timezone: $('#timezone'),
    dateFormatWrap: $('#dateFormatWrap'),
    dateFormat: $('#dateFormat'),
    templateGallery: $('#templateGallery'),
    customCss: $('#customCss'),
    previewFrame: $('#previewFrame'),
    outputUrl: $('#outputUrl'),
    copyBtn: $('#copyBtn'),
    copyConfirm: $('#copyConfirm'),
    tallyStrip: $('#tallyStrip'),
    showControls: $('#showControls'),
    autostart: $('#autostart'),
    widgetId: $('#widgetId'),
    color1: $('#color1'),
    color2: $('#color2'),
    resetColors: $('#resetColors'),
  };

  let selectedTemplate = '1';

  // ---------- build template gallery ----------
  function buildGallery() {
    const templates = window.TIMER_TEMPLATES;
    Object.keys(templates).forEach((id) => {
      const tpl = templates[id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'tpl-card' + (id === selectedTemplate ? ' selected' : '');
      card.dataset.id = id;
      card.innerHTML = `
        <div class="tpl-frame template-${id}">
          <div class="timer-wrap">
            <div class="segment"><span class="value">12</span><span class="label">Hours</span></div>
            <span class="sep">:</span>
            <div class="segment"><span class="value">34</span><span class="label">Min</span></div>
          </div>
        </div>
        <div class="tpl-name">${tpl.name}</div>
      `;
      card.addEventListener('click', () => {
        selectedTemplate = id;
        $$('.tpl-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        applyTemplateDefaultColors(id);
        update();
      });
      els.templateGallery.appendChild(card);
    });
    applyTemplateDefaultColors(selectedTemplate);
  }

  function applyTemplateDefaultColors(id) {
    const tpl = window.TIMER_TEMPLATES[id];
    if (!tpl || !tpl.colors) return;
    els.color1.value = tpl.colors.c1;
    els.color2.value = tpl.colors.c2;
  }

  // ---------- mode-specific visibility ----------
  function refreshModeVisibility() {
    const mode = els.mode.value;
    els.optsTarget.style.display = mode === 'countdown-target' ? '' : 'none';
    els.optsDuration.style.display = mode === 'countdown-duration' ? '' : 'none';
    els.optsCountup.style.display = mode === 'countup' ? '' : 'none';
    els.optsEndtext.style.display = (mode === 'countdown-target' || mode === 'countdown-duration') ? '' : 'none';

    const isClock = mode === 'clock';
    els.chipDate.style.display = isClock ? '' : 'none';
    // hide day/hour/min/sec labels irrelevant to clock? keep h/m/s, hide 'd' for clock
    const dChip = els.fieldToggles.querySelector('input[value="d"]').closest('.chip');
    dChip.style.display = isClock ? 'none' : '';

    els.startAtWrap.style.display = els.countupFromNow.checked ? 'none' : '';

    const playbackStrip = document.getElementById('playbackStrip');
    playbackStrip.style.display = (mode === 'countdown-duration' || mode === 'countup') ? '' : 'none';
  }

  function getCheckedFields() {
    return $$('#fieldToggles input[type="checkbox"]:checked').map((el) => el.value);
  }

  function updateTallyLamps() {
    const checked = new Set(getCheckedFields());
    $$('.tally-lamp').forEach((lamp) => {
      const f = lamp.dataset.field;
      lamp.classList.toggle('on', checked.has(f) || (f === 's' && checked.has('date')));
    });
    // date field lights all lamps briefly is confusing; instead light nothing extra for 'date'
  }

  function updateChipActiveClass() {
    $$('.chip').forEach((chip) => {
      const input = chip.querySelector('input');
      chip.classList.toggle('active', input.checked);
    });
  }

  // ---------- build the query params from current UI state ----------
  function buildParams() {
    const params = new URLSearchParams();
    const mode = els.mode.value;
    const fields = getCheckedFields();

    if (mode === 'countdown-target') {
      params.set('mode', 'countdown');
      if (els.target.value) params.set('target', els.target.value);
      params.set('endText', els.endText.value || '00:00:00');
    } else if (mode === 'countdown-duration') {
      params.set('mode', 'countdown');
      const h = parseInt(els.durHours.value, 10) || 0;
      const m = parseInt(els.durMinutes.value, 10) || 0;
      const s = parseInt(els.durSeconds.value, 10) || 0;
      const totalSeconds = h * 3600 + m * 60 + s;
      params.set('duration', String(totalSeconds));
      if (els.loop.checked) params.set('loop', '1');
      params.set('endText', els.endText.value || '00:00:00');
    } else if (mode === 'countup') {
      params.set('mode', 'countup');
      if (!els.countupFromNow.checked && els.startAt.value) {
        params.set('startAt', els.startAt.value);
      }
    } else {
      params.set('mode', 'clock');
    }

    params.set('fields', fields.join(','));
    if (els.showLabels.checked) params.set('showLabels', '1');
    if (!els.zeroPad.checked) params.set('pad', '0');
    params.set('sep', els.sep.value || '');
    if (els.timezone.value.trim()) params.set('timezone', els.timezone.value.trim());
    if (fields.includes('date')) params.set('dateFormat', els.dateFormat.value);

    params.set('template', selectedTemplate);
    const tplDefaults = window.TIMER_TEMPLATES[selectedTemplate].colors || {};
    if (els.color1.value && els.color1.value.toLowerCase() !== (tplDefaults.c1 || '').toLowerCase()) {
      params.set('c1', els.color1.value);
    }
    if (els.color2.value && els.color2.value.toLowerCase() !== (tplDefaults.c2 || '').toLowerCase()) {
      params.set('c2', els.color2.value);
    }
    if (els.customCss.value.trim()) {
      params.set('css', TimerCore.utf8ToBase64(els.customCss.value));
    }

    if (mode === 'countdown-duration' || mode === 'countup') {
      if (!els.showControls.checked) params.set('controls', '0');
      if (!els.autostart.checked) params.set('autostart', '0');
      params.set('id', els.widgetId.value.trim() || 'timer-1');
    }

    return params;
  }

  let debounceTimer = null;
  function update() {
    refreshModeVisibility();
    updateTallyLamps();
    updateChipActiveClass();
    els.dateFormatWrap.style.display = getCheckedFields().includes('date') ? '' : 'none';

    const params = buildParams();
    const base = window.location.href.replace(/index\.html.*$/, '').replace(/\/$/, '') + '/widget.html';
    const fullUrl = base + '?' + params.toString();
    els.outputUrl.value = fullUrl;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      els.previewFrame.src = 'widget.html?' + params.toString();
    }, 250);
  }

  // ---------- wire up events ----------
  function bindEvents() {
    [
      els.mode, els.target, els.durHours, els.durMinutes, els.durSeconds, els.loop,
      els.countupFromNow, els.startAt, els.endText, els.showLabels, els.zeroPad,
      els.sep, els.timezone, els.dateFormat, els.customCss,
      els.showControls, els.autostart, els.widgetId, els.color1, els.color2,
    ].forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    els.resetColors.addEventListener('click', () => {
      applyTemplateDefaultColors(selectedTemplate);
      update();
    });

    $$('#fieldToggles input[type="checkbox"]').forEach((el) => {
      el.addEventListener('change', update);
    });

    els.copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(els.outputUrl.value);
      } catch (e) {
        els.outputUrl.select();
        document.execCommand('copy');
      }
      els.copyConfirm.classList.add('show');
      setTimeout(() => els.copyConfirm.classList.remove('show'), 1800);
    });
  }

  buildGallery();
  bindEvents();
  update();
})();
