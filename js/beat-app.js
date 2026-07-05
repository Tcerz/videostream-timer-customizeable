(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    styleOptions: $('#styleOptions'),
    presetSwatches: $('#presetSwatches'),
    calmColor: $('#calmColor'),
    energeticColor: $('#energeticColor'),
    sensitivity: $('#sensitivity'),
    sensitivityValue: $('#sensitivityValue'),
    ambient: $('#ambient'),
    ambientValue: $('#ambientValue'),
    pulse: $('#pulse'),
    pulseValue: $('#pulseValue'),
    widgetId: $('#widgetId'),
    previewFrame: $('#previewFrame'),
    outputUrl: $('#outputUrl'),
    copyBtn: $('#copyBtn'),
    copyConfirm: $('#copyConfirm'),
  };

  function buildPresetSwatches() {
    Object.keys(window.BEAT_PRESETS).forEach((id) => {
      const preset = window.BEAT_PRESETS[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch';
      btn.title = preset.name;
      btn.innerHTML = `
        <span class="swatch-gradient" style="background:linear-gradient(90deg, ${preset.calm}, ${preset.energetic})"></span>
        <span class="swatch-name">${preset.name}</span>
      `;
      btn.addEventListener('click', () => {
        els.calmColor.value = preset.calm;
        els.energeticColor.value = preset.energetic;
        update();
      });
      els.presetSwatches.appendChild(btn);
    });
  }

  function getStyle() {
    const checked = els.styleOptions.querySelector('input[name="style"]:checked');
    return checked ? checked.value : 'glow';
  }

  function buildParams() {
    const params = new URLSearchParams();
    params.set('style', getStyle());
    params.set('calm', els.calmColor.value);
    params.set('energetic', els.energeticColor.value);
    params.set('sensitivity', els.sensitivity.value);
    params.set('ambient', els.ambient.value);
    params.set('pulse', els.pulse.value);
    params.set('id', els.widgetId.value.trim() || 'beat-1');
    return params;
  }

  let debounceTimer = null;
  function update() {
    els.sensitivityValue.textContent = els.sensitivity.value;
    els.ambientValue.textContent = els.ambient.value + '%';
    els.pulseValue.textContent = els.pulse.value + '%';

    const params = buildParams();
    const base = window.location.href.replace(/[^/]*$/, '') + 'beat.html';
    els.outputUrl.value = base + '?' + params.toString();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      els.previewFrame.src = 'beat.html?' + params.toString();
    }, 400);
  }

  function bindEvents() {
    [
      els.calmColor, els.energeticColor, els.sensitivity, els.ambient,
      els.pulse, els.widgetId,
    ].forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    $$('input[name="style"]').forEach((el) => el.addEventListener('change', update));

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

  // seed pickers with the first preset's colors
  const firstPreset = window.BEAT_PRESETS['1'];
  els.calmColor.value = firstPreset.calm;
  els.energeticColor.value = firstPreset.energetic;

  buildPresetSwatches();
  bindEvents();
  update();
})();
