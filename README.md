# Timecode — Timer Widget for OBS & vMix

A customizable countdown / count-up / clock overlay you drop into OBS Studio or
vMix as a Browser Source. No build step, no server — it's static HTML/CSS/JS,
so it deploys to Vercel as-is.

Two pages:

- **`index.html`** — the builder. Pick a mode, pick what fields to show, pick
  a template (or write your own CSS), then copy the generated link.
- **`widget.html`** — the actual overlay. This is the URL you paste into OBS
  or vMix. Everything is driven by URL query parameters, so the same file
  serves every possible timer — nothing to configure on the widget side.

## Deploying to Vercel

1. Push this folder to a GitHub repo (or drag-and-drop deploy on vercel.com).
2. Import it in Vercel — no framework preset needed, it's picked up as a
   static site automatically.
3. Deploy. You'll get a URL like `https://your-project.vercel.app`.
4. Open `https://your-project.vercel.app/index.html`, build your timer, and
   copy the link it generates (something like
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

## Templates

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
| `css` | base64 text | custom CSS, applied after the template |

The builder generates all of this for you — you only need this table if
you're hand-editing a link.

## Project structure

```
index.html          the builder UI
widget.html          the overlay you paste into OBS/vMix
css/console.css       styles for the builder page only
js/templates.js        the 12 built-in templates
js/timer-core.js       shared timer engine (param parsing, time math, render)
js/app.js               builder page logic (live preview + link generation)
```
