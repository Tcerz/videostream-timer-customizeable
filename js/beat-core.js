/**
 * beat-core.js
 * Audio-reactive engine for the Beat Pulse widget.
 *
 * How it works, in plain terms:
 *  - It listens to an audio input (mic, or a virtual audio cable fed by
 *    your DJ software / system audio).
 *  - It watches the bass frequencies for sudden spikes above their recent
 *    average — that's the "beat" — and triggers a punchy pulse animation.
 *  - It also tracks overall loudness over a few seconds — that's the
 *    "energy" — and uses it to fade the color between your two configured
 *    colors (calm → energetic).
 *
 * URL parameters (all optional):
 *   style        glow | orb | bars          default: glow
 *   calm         hex color for low-energy moments,   default #3A6FF7
 *   energetic    hex color for high-energy moments,   default #FF2E63
 *   sensitivity  1-10, how easily a beat triggers,     default 5
 *   ambient      0-100, baseline brightness with no beat, default 35
 *   pulse        0-100, how strong each beat's bump is, default 70
 *   id           storage key for remembering the chosen input device,
 *                default "beat"
 *
 * Browser/OBS/vMix note: microphone access needs an explicit click the
 * first time (browser security), and OBS/vMix browser sources need
 * "Interact" mode enabled for that one click to register. After it's
 * granted once for that source's URL, it should keep working on reload.
 */

window.BeatCore = (function () {
  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return { r: 255, g: 255, b: 255 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `${r},${g},${bl}`;
  }

  function loadConfigFromParams(params) {
    return {
      style: params.get('style') || 'glow',
      calm: params.get('calm') || '#3A6FF7',
      energetic: params.get('energetic') || '#FF2E63',
      sensitivity: clamp(parseFloat(params.get('sensitivity')) || 5, 1, 10),
      ambient: clamp(params.has('ambient') ? parseFloat(params.get('ambient')) : 35, 0, 100) / 100,
      pulse: clamp(params.has('pulse') ? parseFloat(params.get('pulse')) : 70, 0, 100) / 100,
      widgetId: params.get('id') || 'beat',
    };
  }

  function deviceStorageKey(config) {
    return 'beatpulse:' + config.widgetId + ':device';
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return ctx;
  }

  function draw(ctx, config, w, h, rgbCsv, pulseEnvelope, freqData) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const rgb = rgbCsv.split(',');

    if (config.style === 'bars') {
      const barCount = 40;
      const step = Math.max(1, Math.floor(freqData.length / barCount));
      const barWidth = w / barCount;
      for (let i = 0; i < barCount; i++) {
        const amp = freqData[i * step] / 255;
        const barHeight = amp * h * 0.7 * (0.4 + config.pulse * 0.6 + pulseEnvelope * 0.5);
        ctx.globalAlpha = clamp(config.ambient + amp, 0.15, 1);
        ctx.fillStyle = `rgb(${rgbCsv})`;
        ctx.fillRect(i * barWidth + barWidth * 0.15, h - barHeight, barWidth * 0.7, barHeight);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (config.style === 'orb') {
      const baseR = Math.min(w, h) * 0.16;
      const r = baseR * (1 + pulseEnvelope * config.pulse * 1.2);
      ctx.save();
      ctx.shadowColor = `rgb(${rgbCsv})`;
      ctx.shadowBlur = 40 + pulseEnvelope * 80 * config.pulse;
      ctx.globalAlpha = clamp(config.ambient + pulseEnvelope * 0.6, 0.25, 1);
      ctx.fillStyle = `rgb(${rgbCsv})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // default: full-viewport ambient glow
    const maxDim = Math.max(w, h);
    const radius = maxDim * (0.55 + pulseEnvelope * config.pulse * 0.5);
    const alpha = clamp(config.ambient + pulseEnvelope * 0.65, 0.12, 1);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function start(canvasSelector, statusSelector) {
    const params = getParams();
    const config = loadConfigFromParams(params);
    const canvas = document.querySelector(canvasSelector);
    const statusEl = statusSelector ? document.querySelector(statusSelector) : null;
    const ctx = setupCanvas(canvas);

    const thresholdMultiplier = 1.65 - (config.sensitivity / 10) * 0.85;
    const minBeatIntervalMs = 200;

    let bassBaseline = 0.08;
    let smoothedIntensity = 0.15;
    let pulseEnvelope = 0;
    let lastBeatTime = 0;

    let currentStream = null;
    let currentAudioCtx = null;
    let generation = 0;

    function setStatus(text, showDeviceOptions) {
      if (!statusEl) return;
      if (text) {
        statusEl.style.display = 'flex';
        statusEl.querySelector('.beat-status-text').textContent = text;
      } else {
        statusEl.style.display = 'none';
      }
      statusEl.querySelector('.beat-device-row').style.display = showDeviceOptions ? 'flex' : 'none';
    }

    async function populateDevices(select) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        select.innerHTML = '';
        inputs.forEach((d, i) => {
          const opt = document.createElement('option');
          opt.value = d.deviceId;
          opt.textContent = d.label || `Input ${i + 1}`;
          select.appendChild(opt);
        });
        const saved = localStorage.getItem(deviceStorageKey(config));
        if (saved && inputs.some((d) => d.deviceId === saved)) select.value = saved;
      } catch (e) {
        /* ignore */
      }
    }

    function stopCurrent() {
      generation++;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
        currentStream = null;
      }
      if (currentAudioCtx) {
        currentAudioCtx.close().catch(() => {});
        currentAudioCtx = null;
      }
    }

    async function startAudio(deviceId) {
      stopCurrent();
      const myGeneration = generation;

      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (myGeneration !== generation) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      currentStream = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      currentAudioCtx = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      setStatus('', statusEl ? statusEl.querySelector('.beat-device-row').style.display === 'flex' : false);

      function frame() {
        if (myGeneration !== generation) return;
        analyser.getByteFrequencyData(freqData);

        let bassSum = 0;
        for (let i = 1; i <= 4; i++) bassSum += freqData[i];
        const bassEnergy = bassSum / 4 / 255;

        let allSum = 0;
        for (let i = 0; i < freqData.length; i++) allSum += freqData[i];
        const overallEnergy = allSum / freqData.length / 255;

        bassBaseline = bassBaseline * 0.95 + bassEnergy * 0.05;
        const now = performance.now();
        if (
          bassEnergy > bassBaseline * thresholdMultiplier &&
          bassEnergy > 0.12 &&
          now - lastBeatTime > minBeatIntervalMs
        ) {
          pulseEnvelope = 1;
          lastBeatTime = now;
        }
        pulseEnvelope *= 0.9;

        smoothedIntensity = smoothedIntensity * 0.985 + overallEnergy * 0.015;
        const normalizedIntensity = clamp(smoothedIntensity * 2.2, 0, 1);
        const rgbCsv = lerpColor(config.calm, config.energetic, normalizedIntensity);

        draw(ctx, config, window.innerWidth, window.innerHeight, rgbCsv, pulseEnvelope, freqData);
        requestAnimationFrame(frame);
      }
      frame();
    }

    async function tryAutoStart() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        if (statusEl) await populateDevices(statusEl.querySelector('.beat-device-select'));
        const saved = localStorage.getItem(deviceStorageKey(config));
        await startAudio(saved || undefined);
        return true;
      } catch (e) {
        return false;
      }
    }

    if (statusEl) {
      const enableBtn = statusEl.querySelector('.beat-enable-btn');
      const deviceSelect = statusEl.querySelector('.beat-device-select');

      setStatus('Click to enable audio', false);

      enableBtn.addEventListener('click', async () => {
        try {
          await populateDevices(deviceSelect);
          setStatus('Listening…', true);
          const saved = localStorage.getItem(deviceStorageKey(config));
          await startAudio(saved || undefined);
        } catch (e) {
          setStatus('Microphone access denied — check browser/OBS permissions', false);
        }
      });

      deviceSelect.addEventListener('change', () => {
        localStorage.setItem(deviceStorageKey(config), deviceSelect.value);
        setStatus('Listening…', true);
        startAudio(deviceSelect.value).catch(() => setStatus('Could not start that input', true));
      });
    }

    // If permission was already granted previously in this browser context,
    // it can usually start straight away without another click.
    tryAutoStart();
  }

  return { start, loadConfigFromParams, getParams };
})();
