(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    t1Name: $('#t1Name'),
    t1Score: $('#t1Score'),
    t1Logo: $('#t1Logo'),
    t1LogoPreviewRow: $('#t1LogoPreviewRow'),
    t1LogoPreview: $('#t1LogoPreview'),
    t1LogoClear: $('#t1LogoClear'),
    t1ColorTitle: $('#t1ColorTitle'),
    t1LogoColor: $('#t1LogoColor'),
    t1BgColor: $('#t1BgColor'),
    t1ScoreColor: $('#t1ScoreColor'),

    t2Name: $('#t2Name'),
    t2Score: $('#t2Score'),
    t2Logo: $('#t2Logo'),
    t2LogoPreviewRow: $('#t2LogoPreviewRow'),
    t2LogoPreview: $('#t2LogoPreview'),
    t2LogoClear: $('#t2LogoClear'),
    t2ColorTitle: $('#t2ColorTitle'),
    t2LogoColor: $('#t2LogoColor'),
    t2BgColor: $('#t2BgColor'),
    t2ScoreColor: $('#t2ScoreColor'),

    vsChip1: $('#vsChip1'),
    vsChip2: $('#vsChip2'),
    resetTeamColors: $('#resetTeamColors'),

    timerMode: $('#timerMode'),
    halfLengthWrap: $('#halfLengthWrap'),
    totalMatchMinutes: $('#totalMatchMinutes'),
    halfSplitHint: $('#halfSplitHint'),
    durationWrap: $('#durationWrap'),
    durMinutes: $('#durMinutes'),
    durSeconds: $('#durSeconds'),
    timerVisibleWrap: $('#timerVisibleWrap'),
    timerVisibleDefault: $('#timerVisibleDefault'),
    timerVisibleHint: $('#timerVisibleHint'),

    templateGallery: $('#templateGallery'),

    scale: $('#scale'),
    scaleValue: $('#scaleValue'),
    sizeControls: $('#sizeControls'),

    showControls: $('#showControls'),
    widgetId: $('#widgetId'),
    customCss: $('#customCss'),

    previewFrame: $('#previewFrame'),
    outputUrl: $('#outputUrl'),
    copyBtn: $('#copyBtn'),
    copyConfirm: $('#copyConfirm'),
    urlLengthHint: $('#urlLengthHint'),
  };

  let selectedTemplate = '1';
  let logo1DataUrl = '';
  let logo2DataUrl = '';

  const MAX_LOGO_DIMENSION = 100; // px — keeps the encoded link a reasonable length
  const LOGO_JPEG_QUALITY = 0.82;

  // ---------- logo upload -> resized data URL ----------
  function resizeImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not decode image'));
        img.onload = () => {
          const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          let dataUrl = canvas.toDataURL('image/png');
          if (dataUrl.length > 40000) {
            dataUrl = canvas.toDataURL('image/jpeg', LOGO_JPEG_QUALITY);
          }
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function wireLogoInput(fileInput, previewRow, previewImg, clearBtn, setter) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const dataUrl = await resizeImageFile(file);
        setter(dataUrl);
        previewImg.src = dataUrl;
        previewRow.style.display = 'flex';
        update();
      } catch (e) {
        alert('Could not load that image. Try a different file.');
      }
    });

    clearBtn.addEventListener('click', () => {
      setter('');
      fileInput.value = '';
      previewRow.style.display = 'none';
      update();
    });
  }

  // ---------- template gallery ----------
  function buildGallery() {
    const templates = window.SCORE_TEMPLATES;
    Object.keys(templates).forEach((id) => {
      const tpl = templates[id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'tpl-card' + (id === selectedTemplate ? ' selected' : '');
      card.dataset.id = id;
      card.innerHTML = `
        <div class="tpl-frame template-${id}">
          <div class="scoreboard-wrap">
            <div class="team-block" data-team="1">
              <div class="logo-fallback">HM</div>
              <div class="team-name">Home</div>
            </div>
            <div class="score-block">
              <div class="team-score" data-team="1">2</div>
              <div class="score-sep">-</div>
              <div class="team-score" data-team="2">1</div>
            </div>
            <div class="team-block" data-team="2">
              <div class="logo-fallback">AW</div>
              <div class="team-name">Away</div>
            </div>
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
    const tpl = window.SCORE_TEMPLATES[id];
    if (!tpl || !tpl.colors) return;
    els.t1LogoColor.value = tpl.colors.t1logo;
    els.t1BgColor.value = tpl.colors.t1bg;
    els.t1ScoreColor.value = tpl.colors.t1score;
    els.t2LogoColor.value = tpl.colors.t2logo;
    els.t2BgColor.value = tpl.colors.t2bg;
    els.t2ScoreColor.value = tpl.colors.t2score;
  }

  // ---------- timer mode visibility ----------
  function refreshTimerVisibility() {
    const mode = els.timerMode.value;
    els.halfLengthWrap.style.display = mode === 'football' ? '' : 'none';
    els.durationWrap.style.display = mode === 'countdown' ? '' : 'none';
    const hasTimer = mode !== 'off';
    els.timerVisibleWrap.style.display = hasTimer ? '' : 'none';
    els.timerVisibleHint.style.display = hasTimer ? '' : 'none';

    if (mode === 'football') {
      const totalMin = parseInt(els.totalMatchMinutes.value, 10) || 90;
      const perHalf = totalMin / 2;
      const perHalfLabel = Number.isInteger(perHalf) ? perHalf : perHalf.toFixed(1);
      els.halfSplitHint.textContent = `= ${perHalfLabel} minutes per half`;
    }
  }

  // ---------- build params + preview ----------
  function buildParams() {
    const params = new URLSearchParams();
    params.set('t1', els.t1Name.value.trim() || 'Team 1');
    params.set('t2', els.t2Name.value.trim() || 'Team 2');
    params.set('s1', String(parseInt(els.t1Score.value, 10) || 0));
    params.set('s2', String(parseInt(els.t2Score.value, 10) || 0));

    if (logo1DataUrl) params.set('logo1', logo1DataUrl);
    if (logo2DataUrl) params.set('logo2', logo2DataUrl);

    params.set('template', selectedTemplate);
    const tplDefaults = window.SCORE_TEMPLATES[selectedTemplate].colors || {};
    const colorFields = [
      ['t1logo', els.t1LogoColor, tplDefaults.t1logo],
      ['t1bg', els.t1BgColor, tplDefaults.t1bg],
      ['t1score', els.t1ScoreColor, tplDefaults.t1score],
      ['t2logo', els.t2LogoColor, tplDefaults.t2logo],
      ['t2bg', els.t2BgColor, tplDefaults.t2bg],
      ['t2score', els.t2ScoreColor, tplDefaults.t2score],
    ];
    colorFields.forEach(([key, input, defaultVal]) => {
      if (input.value && defaultVal && input.value.toLowerCase() !== defaultVal.toLowerCase()) {
        params.set(key, input.value);
      }
    });

    const timerMode = els.timerMode.value;
    if (timerMode !== 'off') {
      params.set('timer', timerMode);
      if (timerMode === 'countdown') {
        const m = parseInt(els.durMinutes.value, 10) || 0;
        const s = parseInt(els.durSeconds.value, 10) || 0;
        params.set('duration', String(m * 60 + s));
      } else if (timerMode === 'football') {
        // User enters the FULL match length (both halves combined); we
        // split it evenly in half here so each half gets total/2 minutes.
        const totalMin = parseInt(els.totalMatchMinutes.value, 10) || 90;
        const halfSeconds = Math.round((totalMin * 60) / 2);
        params.set('half', String(halfSeconds));
      }
      if (!els.timerVisibleDefault.checked) params.set('timerVisible', '0');
    }

    const scaleVal = parseFloat(els.scale.value);
    if (Math.abs(scaleVal - 1) > 0.001) params.set('scale', String(scaleVal));
    if (!els.sizeControls.checked) params.set('sizeControls', '0');

    if (!els.showControls.checked) params.set('controls', '0');
    params.set('id', els.widgetId.value.trim() || 'score-1');

    if (els.customCss.value.trim()) {
      const bytes = new TextEncoder().encode(els.customCss.value);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      params.set('css', btoa(binary));
    }

    return params;
  }

  let debounceTimer = null;
  function update() {
    refreshTimerVisibility();
    els.scaleValue.textContent = Math.round(parseFloat(els.scale.value) * 100) + '%';

    // live "vs" preview + labels
    const t1Name = els.t1Name.value.trim() || 'Team 1';
    const t2Name = els.t2Name.value.trim() || 'Team 2';
    els.t1ColorTitle.textContent = t1Name;
    els.t2ColorTitle.textContent = t2Name;
    els.vsChip1.textContent = t1Name;
    els.vsChip2.textContent = t2Name;
    els.vsChip1.style.background = els.t1BgColor.value;
    els.vsChip1.style.color = els.t1ScoreColor.value;
    els.vsChip2.style.background = els.t2BgColor.value;
    els.vsChip2.style.color = els.t2ScoreColor.value;

    const params = buildParams();
    const base = window.location.href.replace(/[^/]*$/, '') + 'score.html';
    const fullUrl = base + '?' + params.toString();
    els.outputUrl.value = fullUrl;

    const approxKB = Math.round(fullUrl.length / 1024 * 10) / 10;
    if (fullUrl.length > 6000) {
      els.urlLengthHint.textContent = `Link is ~${approxKB} KB — quite long because of the logo image(s). Most software handles this fine, but if a field rejects it, try a smaller/simpler logo image.`;
    } else {
      els.urlLengthHint.textContent = '';
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      els.previewFrame.src = 'score.html?' + params.toString();
    }, 300);
  }

  function bindEvents() {
    [
      els.t1Name, els.t1Score,
      els.t1LogoColor, els.t1BgColor, els.t1ScoreColor,
      els.t2Name, els.t2Score,
      els.t2LogoColor, els.t2BgColor, els.t2ScoreColor,
      els.timerMode, els.totalMatchMinutes, els.durMinutes, els.durSeconds,
      els.timerVisibleDefault,
      els.scale, els.sizeControls,
      els.showControls, els.widgetId, els.customCss,
    ].forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    wireLogoInput(els.t1Logo, els.t1LogoPreviewRow, els.t1LogoPreview, els.t1LogoClear, (v) => (logo1DataUrl = v));
    wireLogoInput(els.t2Logo, els.t2LogoPreviewRow, els.t2LogoPreview, els.t2LogoClear, (v) => (logo2DataUrl = v));

    els.resetTeamColors.addEventListener('click', () => {
      applyTemplateDefaultColors(selectedTemplate);
      update();
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
