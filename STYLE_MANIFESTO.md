# THE ARTIFACT — Style Manifesto

> A relic that plays music.  
> Not a sci-fi music player. Not a dashboard. Not an app.  
> An alien temple carved into a dead moon — ancient, vast, faintly breathing.

---

## I. Emotional Core

This interface exists at the intersection of **brutalist architecture** and **living organism**: stone that pulses, silence that has weight, geometry that grew rather than was built.

The reference world is the subterranean Hive architecture of *Destiny* and the desert monumentalism of *Dune* — not their action, but their **atmosphere**: the feeling of standing in a chamber that has been silent for ten thousand years and is now, very slightly, aware of you.

### The player should evoke:

- The silence before something enormous moves
- The scale of a cathedral seen from below, in near-darkness
- Organic matter fossilized into architecture — or architecture slowly becoming organic
- Cold luminescence, like bioluminescence deep underwater or lichen on stone
- Contemplative dread, not horror — the awe of the sublime

### The player must never evoke:

- Neon, glitch, cyberpunk, hologram tropes
- Busyness, noise, aggressive contrast
- Generic "futuristic" iconography (circuits, grids, scan lines)
- Playfulness or warmth — this UI is serene and remote

---

## II. Color System

The palette is derived from three tonal families. Every color has been chosen to feel **discovered, not designed** — as if extracted from mineral, membrane, or void.

### Foundations (backgrounds, voids)

| Token             | Hex       | Usage                              |
|-------------------|-----------|-------------------------------------|
| `void`            | `#090c12` | Primary background, deepest dark    |
| `void-deep`       | `#07080f` | Secondary void, gradient terminus   |
| `abyss`           | `#0f0d1a` | Surface-level background            |
| `abyss-warm`      | `#111320` | Warm void variant for depth layers  |

### Structure (panels, surfaces, stone)

| Token             | Hex       | Usage                              |
|-------------------|-----------|-------------------------------------|
| `stone`           | `#1c1f2e` | Primary panel/card background       |
| `stone-light`     | `#232840` | Elevated surfaces, hover states     |
| `slate`           | `#2a2d42` | Secondary structural elements       |
| `slate-violet`    | `#1e2035` | Violet-shifted structural variant   |

### Life (accent, glow, organism signals)

| Token             | Hex       | Usage                              |
|-------------------|-----------|-------------------------------------|
| `lunar`           | `#3d5c3a` | Primary accent — cold mossy green   |
| `lunar-bright`    | `#4a7a45` | Active states, progress indicators  |
| `lunar-deep`      | `#2e4a2b` | Muted accent for backgrounds        |
| `membrane`        | `#c8cce8` | Primary text — pale violet-white    |
| `membrane-dim`    | `#a0a8d0` | Secondary text                      |
| `teal-glow`       | `#1a3d3a` | Atmospheric teal for ambient light  |
| `teal-deep`       | `#0d2e2b` | Deep teal for gradient layers       |

### Rules

- **No pure black** (`#000000`) — always use `void` or `void-deep`
- **No pure white** (`#ffffff`) — the lightest tone is `membrane` (`#c8cce8`)
- Gradients are never clean — always slightly noisy, atmospheric
- All surfaces carry a soft film grain overlay at 3–6% opacity

---

## III. Typography

### Font Stack

| Role       | Family              | Weight     | Purpose                                    |
|------------|---------------------|------------|---------------------------------------------|
| Serif      | Cormorant Garamond  | 400–700    | Titles, track names — monumental, carved    |
| Sans       | Inter               | 200–500    | UI text, labels — sparse, architectural     |
| Mono       | JetBrains Mono      | 300–400    | Time, metadata — functional inscription     |

### Hierarchy

| Element        | Class             | Style                                               |
|----------------|-------------------|------------------------------------------------------|
| Track title    | `.text-carved`    | Serif, 600 weight, tight leading, membrane color     |
| Artist name    | `.text-inscription` | Sans, 300 weight, wide tracking, uppercase, ghost  |
| Metadata       | `.text-rune`      | Mono, 400 weight, tiny, near-invisible               |

### Rules

- Track titles feel **carved** — large, commanding, top-weighted
- Artist names feel **subordinate** — like a footnote on stone
- Metadata is **near-invisible** — functional inscription
- No decorative type, no rounded fonts, no display faces with personality
- Letter-spacing on body text: `0.01em` (barely perceptible openness)

---

## IV. Glassmorphism: Obsidian, Not Window

Standard glassmorphism (bright blur panels, white borders) is **rejected entirely**.

### Obsidian Glass System

| Class              | Opacity | Blur   | Border                    | Character              |
|--------------------|---------|--------|---------------------------|------------------------|
| `.glass-obsidian`  | 85%     | 28px   | 1px @ 6% membrane        | Primary panels         |
| `.glass-deep`      | 92%     | 40px   | 1px @ 4% membrane        | Deep overlay panels    |
| `.glass-membrane`  | 60%     | 20px   | 1px @ 8% membrane        | Lighter floating UI    |

### Rules

- Panels are **darker than the background**, not lighter — they absorb light
- Blur is deep but the surface is near-opaque — you feel depth but don't see through
- No white or light borders — edges fade to nothing or carry 1px at ≤10% opacity
- The glass metaphor is **obsidian**: reflective, cold, ancient

---

## V. Motion

All motion is **geological and biological** — slow, heavy, inevitable.

### Motion Vocabulary

| Behavior    | Description                                          | Timing                    |
|-------------|------------------------------------------------------|---------------------------|
| Breathing   | Central artifact expands/contracts, amplitude-driven | 4–6s cycle, ease-breathing |
| Drift       | Background particles/layers move imperceptibly       | 0.02–0.05px/frame         |
| Awareness   | Hover states arrive slowly, surfaces become aware    | 200–400ms, ease-awareness |
| Dissolve    | Track/state transitions — slow dissolve from dark    | 1.2s, ease-dissolve       |
| Crawl       | Progress line — absolute continuity, no ticks        | Linear, uninterrupted     |

### Easing Functions

| Token              | Curve                               | Feel                        |
|--------------------|--------------------------------------|-----------------------------|
| `ease-geological`  | `cubic-bezier(0.22, 0.68, 0.35, 1)` | Heavy arrival               |
| `ease-breathing`   | `cubic-bezier(0.37, 0, 0.63, 1)`    | Organic inhale/exhale       |
| `ease-awareness`   | `cubic-bezier(0.16, 0, 0.12, 1)`    | Slow dawning recognition    |
| `ease-dissolve`    | `cubic-bezier(0.4, 0, 0.1, 1)`      | Fade from void              |

### Rules

- **Never bounce, never spring** — all deceleration is extremely slow
- **No slides or flips** for transitions — only dissolves from darkness
- The progress bar has **no ticks, no segments** — just an uninterrupted crawl
- Use `framer-motion` for component-level orchestration

---

## VI. Texture & Atmosphere

This layer is **non-negotiable**. It is what separates the artifact from any other dark UI.

### Grain

- Full-screen SVG noise overlay at **4% opacity**
- Animated via `grain-shift` keyframe (stepping, not smooth)
- Applied on `body::before` with `pointer-events: none`

### Atmospheric Lighting

- `body::after` contains layered radial gradients:
  - Cold teal glow from above (12% opacity)
  - Warm abyss from below (40% opacity)
  - Lateral ambient from the left (15% opacity)
- Background is **never flat** — it is a deep gradient that shifts subtly

### Mood Coloring

- The `.atmosphere-mood` utility accepts a `--mood-color` CSS variable
- When a track plays, its dominant color (very desaturated, very dark) tints the atmosphere
- Transition between moods uses `ease-dissolve` at 1.2s

---

## VII. Spacing & Layout

### Philosophy

Empty space is not emptiness — **it is atmosphere**. Layout uses asymmetric spatial composition with weighted silence.

### Spacing Scale

| Token       | Value   | Usage                                      |
|-------------|---------|---------------------------------------------|
| `altar`     | 12rem   | Maximum breathing room, page-level margins  |
| `chamber`   | 8rem    | Section separation                          |
| `passage`   | 4rem    | Component groups                            |
| `breath`    | 2rem    | Element spacing within groups               |
| `grain`     | 0.5rem  | Tight spacing, icon gaps                    |

### Rules

- Favor massive padding over compact layouts
- Content should feel **discovered in a vast space**, not packed into a container
- Asymmetry is preferred over centering when it serves the monumental feeling

---

## VIII. Constraint Table

| Avoid                    | Use Instead                        |
|--------------------------|------------------------------------|
| Neon glow                | Cold lunar luminescence            |
| Grid or circuit patterns | Organic, irregular geometry        |
| Bright glassmorphism     | Dark obsidian translucency         |
| Springy animations       | Geological, breathing motion       |
| Standard waveform        | Sculptural deforming surface       |
| Rounded pill buttons     | Glyph-like carved marks            |
| Stock sci-fi fonts       | Monumental serif + sparse mono     |
| Busy layouts             | Massive spatial silence            |
| Pure black / pure white  | Void tones / membrane tones        |
| Instant hover states     | Slow awareness transitions         |

---

## IX. File Organization

```
app/
  globals.css          — Theme tokens, keyframes, base styles, utility classes
  layout.tsx           — Root layout with font loading
  page.tsx             — Entry point

lib/
  utils.ts             — cn() helper (clsx + tailwind-merge)
```

All design tokens live in `globals.css` inside `@theme {}` blocks. There is no separate Tailwind config file — Tailwind CSS v4 uses CSS-first configuration.

---

*This document is the single source of truth for all visual decisions in The Artifact. Every component, animation, and layout choice must be justified against it.*
