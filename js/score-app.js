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
    t1Color: $('#t1Color'),

    t2Name: $('#t2Name'),
    t2Score: $('#t2Score'),
    t2Logo: $('#t2Logo'),
    t2LogoPreviewRow: $('#t2LogoPreviewRow'),
    t2LogoPreview: $('#t2LogoPreview'),
    t2LogoClear: $('#t2LogoClear'),
    t2Color: $('#t2Color'),

    timerMode: $('#timerMode'),
    durationWrap: $('#durationWrap'),
    durMinutes: $('#durMinutes'),
    durSeconds: $('#durSeconds'),

    templateGallery: $('#templateGallery'),
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

          // PNG keeps transparency (most team logos need it); if the
          // resulting PNG is unusually large, fall back to JPEG which
          // compresses much better for photographic/complex logos.
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
            <div class="team-row" data-team="1">
              <div class="logo-fallback">HM</div>
              <div class="team-name">Home</div>
              <div class="team-score">2</div>
            </div>
            <div class="team-row" data-team="2">
              <div class="logo-fallback">AW</div>
              <div class="team-name">Away</div>
              <div class="team-score">1</div>
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
    els.t1Color.value = tpl.colors.c1;
    els.t2Color.value = tpl.colors.c2;
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
    if (els.t1Color.value && els.t1Color.value.toLowerCase() !== (tplDefaults.c1 || '').toLowerCase()) {
      params.set('c1', els.t1Color.value);
    }
    if (els.t2Color.value && els.t2Color.value.toLowerCase() !== (tplDefaults.c2 || '').toLowerCase()) {
      params.set('c2', els.t2Color.value);
    }

    const timerMode = els.timerMode.value;
    if (timerMode !== 'off') {
      params.set('timer', timerMode);
      if (timerMode === 'countdown') {
        const m = parseInt(els.durMinutes.value, 10) || 0;
        const s = parseInt(els.durSeconds.value, 10) || 0;
        params.set('duration', String(m * 60 + s));
      }
    }

    if (!els.showControls.checked) params.set('controls', '0');
    params.set('id', els.widgetId.value.trim() || 'score-1');

    if (els.customCss.value.trim()) {
      // reuse the same base64 helper pattern as the Timer widget
      const bytes = new TextEncoder().encode(els.customCss.value);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      params.set('css', btoa(binary));
    }

    return params;
  }

  function refreshTimerVisibility() {
    els.durationWrap.style.display = els.timerMode.value === 'countdown' ? '' : 'none';
  }

  let debounceTimer = null;
  function update() {
    refreshTimerVisibility();

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
      els.t1Name, els.t1Score, els.t1Color,
      els.t2Name, els.t2Score, els.t2Color,
      els.timerMode, els.durMinutes, els.durSeconds,
      els.showControls, els.widgetId, els.customCss,
    ].forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    wireLogoInput(els.t1Logo, els.t1LogoPreviewRow, els.t1LogoPreview, els.t1LogoClear, (v) => (logo1DataUrl = v));
    wireLogoInput(els.t2Logo, els.t2LogoPreviewRow, els.t2LogoPreview, els.t2LogoClear, (v) => (logo2DataUrl = v));

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
