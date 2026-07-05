# Easy Overlay — Widgets for Streaming

A dashboard of browser-source overlay widgets for OBS Studio, vMix, and
anything else that accepts a URL as a source. It's built to grow — more
widgets get added as new pages, all listed from one dashboard.

Right now there's one widget, **Timer & Clock**: a customizable countdown /
count-up / clock overlay. No build step, no server — it's static HTML/CSS/JS,
so it deploys to Vercel as-is.

Pages:

- **`index.html`** — the dashboard. Lists every available widget; click one
  to open its builder. This is your site's home page.
- **`timerstream.html`** — the Timer & Clock builder. Pick a mode, pick what
  fields to show, pick a template (or write your own CSS), then copy the
  generated link.
- **`widget.html`** — the actual Timer & Clock overlay. This is the URL you
  paste into OBS or vMix. Everything is driven by URL query parameters, so
  the same file serves every possible timer — nothing to configure on the
  widget side.

## Deploying to Vercel

1. Push this folder to a GitHub repo (or drag-and-drop deploy on vercel.com).
2. Import it in Vercel — no framework preset needed, it's picked up as a
   static site automatically.
3. Deploy. You'll get a URL like `https://your-project.vercel.app`.
4. Open it — you'll land on the dashboard. Click **Timer & Clock**, build
   your timer, and copy the link it generates (something like
   `https://your-project.vercel.app/widget.html?mode=countdown&target=...`).

## Using the link in OBS

1. Sources → **+** → **Browser**.
2. Paste the widget URL.
3. Set Width/Height to match your canvas (e.g. 1920×1080).
4. Leave "Shutdown source when not visible" **unchecked** so the timer keeps
   running correctly in the background.
5. Background is transparent by default, so it composites straight over your
   scene — no chroma key needed.

## Using the link in vMix

1. Add Input → **Web Browser**.
2. Paste the widget URL.
3. Match the resolution to your output.
4. Layer it over your program feed like any other overlay input.

## Play / Pause / Reset from vMix or OBS

For a duration countdown (e.g. "10:00") or a count-up/stopwatch, the widget
can show its own control buttons — no need to reopen the builder mid-show:

1. In the builder, leave **"Show Play / Pause / Reset buttons"** checked.
2. In vMix: right-click the Web Browser input → **enable mouse/keyboard
   input** (or the equivalent "Interactive" option). In OBS: right-click the
   Browser source → **Interact**, or enable interaction in its properties.
3. Click the buttons directly on the preview/program feed to control the
   timer live.

The state is remembered by the browser the widget runs in (it survives a
reload of that browser source), so you don't need to keep the builder page
open — set it up once, then just click Play/Pause/Reset from vMix/OBS.
If you don't want the buttons visible on the actual output, crop them out of
frame (vMix's crop/zoom, or OBS's crop transform) — they sit in a small strip
right under the numbers.

A fixed "countdown to a date" or a plain clock can't be paused (there's
nothing to pause — it's just reading the real clock), so no buttons appear
for those modes.

If you're running more than one timer at once, give each a different
**Widget ID** in the Playback Controls section so their play/pause states
don't collide.

## Recoloring a template

Every template exposes two accent colors. Pick a template, then use the
**Primary color** / **Secondary color** pickers under the gallery — no CSS
needed. "Reset to template colors" puts it back to the template's original
palette. These map to the `c1` / `c2` URL parameters if you're hand-editing
a link.



12 built-in looks are available from the Style panel in the builder:
Minimal Flat, Neon Glow, LCD Digital, Broadcast Tally, Glassmorphism, Retro
Flip Clock, Elegant Serif, Gradient Bold, Outline Terminal, Sports
Scoreboard, Soft Pastel, and Cyberpunk. Pick one and you're done — no CSS
required.

## Writing your own CSS

If a template almost fits but not quite, use the Custom CSS box in the
builder. It's applied on top of the chosen template, targeting this DOM:

```html
<div class="timer-wrap">
  <div class="segment"><span class="value">05</span><span class="label">Hours</span></div>
  <span class="sep">:</span>
  <div class="segment"><span class="value">30</span><span class="label">Minutes</span></div>
  <!-- .date-line instead of .segment when the Date field is enabled -->
</div>
<!-- .ended-text replaces .timer-wrap's contents when a countdown hits zero -->
```

Example — plain white numbers, no card, bigger:

```css
.timer-wrap { gap: 20px; }
.value { color: #ffffff; font-size: 140px; font-weight: 800; }
.label { display: none; }
.sep { color: #ffffff; font-size: 140px; }
```

## Resizing without it turning blurry/pixelated

All text is sized in `vmin` (relative to the browser source's own
resolution) instead of fixed pixels, and there are on-widget **−/⟲/+**
buttons to fine-tune it live. What actually causes the "pecah" (pixelated)
look in vMix/OBS is stretching the *layer* bigger than the browser source's
own declared resolution — that upscales an already-rendered image. Instead:

1. Set the Browser Source/Web Browser input's **Width/Height** to the size
   you actually need (e.g. your full canvas, 1920×1080 or larger) — don't
   add it small and then drag it bigger on the canvas.
2. Use the **Size** section in the builder, or the −/⟲/+ buttons on the
   widget itself (enable mouse input the same way as the playback
   controls), to fine-tune how big the timer looks inside that resolution.

Because the text re-renders at whatever size you set rather than being
scaled up from a smaller image, it stays sharp. The chosen size is
remembered per widget `id`, the same way play/pause state is.

## URL parameters (widget.html)

All optional unless noted.

| Param | Values | Notes |
|---|---|---|
| `mode` | `countdown` \| `countup` \| `clock` | default `clock` |
| `target` | ISO datetime | countdown target, e.g. `2026-12-31T23:59:59` |
| `duration` | seconds | alternative to `target` — counts down from N seconds on load |
| `loop` | `1` | restart a `duration` countdown at zero |
| `endText` | text | shown when a countdown reaches zero |
| `startAt` | ISO datetime | countup start; omit to start on page load |
| `fields` | comma list | `d,h,m,s` (countdown/countup) or `date,h,m,s` (clock) |
| `showLabels` | `1` | show "Days / Hours / Minutes / Seconds" captions |
| `pad` | `0` | disable zero-padding (default padded) |
| `sep` | text | separator between segments, default `:` |
| `dateFormat` | token string | `DD MMM YYYY`, `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD` |
| `timezone` | IANA name | e.g. `Asia/Jakarta`; defaults to the machine's local time |
| `template` | `1`–`12` | built-in look, see list above |
| `c1`, `c2` | hex color | override the template's two accent colors |
| `css` | base64 text | custom CSS, applied after the template + colors |
| `controls` | `0` | hide the Play/Pause/Reset buttons (shown by default when applicable) |
| `autostart` | `0` | don't start running automatically on first load |
| `id` | text | widget instance name, keeps multiple timers' play/pause/size state separate (default `timer`) |
| `scale` | number | size multiplier, e.g. `0.5`–`3`, default `1` |
| `sizeControls` | `0` | hide the on-widget −/⟲/+ resize buttons |

The builder generates all of this for you — you only need this table if
you're hand-editing a link.

## Project structure

```
index.html               dashboard — pick a widget
timerstream.html          Timer & Clock builder UI
widget.html                Timer & Clock overlay you paste into OBS/vMix
beatstream.html            Beat Pulse builder UI
beat.html                    Beat Pulse overlay you paste into OBS/vMix
css/console.css               shared styles (dashboard + all builder pages)
js/templates.js                the 12 built-in Timer & Clock templates
js/timer-core.js                Timer & Clock engine (param parsing, time math, render)
js/app.js                        timerstream.html logic (live preview + link generation)
js/beat-presets.js                Beat Pulse color mood presets
js/beat-core.js                    Beat Pulse engine (audio analysis, beat detection, render)
js/beat-app.js                      beatstream.html logic (live preview + link generation)
```

Adding a new widget later means: a new `<widget>stream.html` builder page, a
new `<widget>.html` overlay page, and a new card on the dashboard pointing to
it — the dashboard and shared CSS don't need to change.

---

# Beat Pulse — audio-reactive overlay for VJs

`beatstream.html` (builder) and `beat.html` (overlay) — a lighting-style
visual that listens to audio and reacts live:

- **Beat detection**: watches the bass frequencies for spikes above their
  recent average, and triggers a punchy pulse each time it fires.
- **Energy-based color**: tracks overall loudness over a few seconds and
  fades the color between your two configured colors — calm color at low
  energy, energetic color at high energy.
- **3 visual styles**: Full Glow (ambient wash, good for projecting on a
  wall/screen to light up a room), Center Orb (a single pulsing orb, subtle
  enough as an overlay accent), EQ Bars (classic spectrum bars).

## Getting audio into it

The browser needs an explicit click to grant microphone access — this is a
security requirement, not a bug. Inside OBS/vMix:

1. Add the generated URL as a Browser Source (OBS) or Web Browser input (vMix).
2. Right-click it → **Interact**.
3. Click **"Enable Audio"** inside that interactive window, once.
4. A device dropdown appears — pick your input. It's remembered for next time.

**Room mic vs. actual music:** a physical microphone works and is the
simplest option, but it reacts to everything in the room, not just the
music. For a cleaner reaction, route your DJ software / system audio
through a virtual audio cable (VB-CABLE, VoiceMeeter, BlackHole on Mac,
etc.) and select that cable as the input device instead of the mic.

If the permission prompt never appears at all, your OBS/vMix build's
embedded browser may have media capture disabled — test the same URL in a
normal Chrome/Edge tab first to confirm the widget itself works, then
troubleshoot the OBS/vMix side (updating OBS usually resolves this, since
newer CEF versions support it better).

## URL parameters (beat.html)

| Param | Values | Notes |
|---|---|---|
| `style` | `glow` \| `orb` \| `bars` | default `glow` |
| `calm` | hex color | color at low musical energy, default `#3A6FF7` |
| `energetic` | hex color | color at high musical energy, default `#FF2E63` |
| `sensitivity` | `1`–`10` | how easily a beat triggers, default `5` |
| `ambient` | `0`–`100` | baseline brightness with no beat, default `35` |
| `pulse` | `0`–`100` | how strong each beat's bump is, default `70` |
| `id` | text | remembers the chosen input device separately per widget, default `beat` |
