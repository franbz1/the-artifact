<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# THE ARTIFACT — Agent Codex

> You are building a relic, not an app.
> Every decision must serve the atmosphere of an alien temple carved into a dead moon.

---

## Project Identity

**The Artifact** is a music player interface that feels like a discovered object — ancient, vast, and faintly alive. It exists at the intersection of brutalist architecture and living organism. The reference worlds are the subterranean Hive of *Destiny* and the desert monumentalism of *Dune*.

This is not a sci-fi music player. It is a relic that plays music.

---

## Critical Documents

| Document              | Purpose                                              |
|-----------------------|------------------------------------------------------|
| `STYLE_MANIFESTO.md`  | Single source of truth for ALL visual decisions      |
| `app/globals.css`     | Design tokens, theme config, base styles, utilities  |
| `lib/utils.ts`        | `cn()` utility — always use this for conditional classes |

**Before writing any component, read `STYLE_MANIFESTO.md`.** Every visual choice must be justifiable against that document.

---

## Tech Stack

| Layer        | Technology                    | Version  |
|--------------|-------------------------------|----------|
| Framework    | Next.js (App Router)          | 16.x     |
| Language     | TypeScript (strict)           | 5.x      |
| Styling      | Tailwind CSS v4 (CSS-first)   | 4.x      |
| Animation    | Framer Motion                 | Latest   |
| Utilities    | clsx, tailwind-merge, cva     | Latest   |

### Tailwind v4 Notes

- **No `tailwind.config.js`** — all theme configuration lives in `app/globals.css` inside `@theme {}` blocks
- PostCSS is configured via `postcss.config.mjs` using `@tailwindcss/postcss`
- Custom colors are accessed as `bg-void`, `text-membrane`, `border-border`, etc.
- Custom animations are accessed as `animate-breathe`, `animate-drift`, etc.
- Custom spacing: `p-altar`, `m-chamber`, `gap-passage`, `p-breath`, `gap-grain`

---

## Code Conventions

### Language

- All code, comments, variable names, and commit messages MUST be in **English**

### File Organization

```
app/                    — Pages and layouts (Next.js App Router)
  globals.css           — ALL design tokens and global styles
  layout.tsx            — Root layout with font configuration
  page.tsx              — Home / player page

lib/                    — Shared utilities
  utils.ts              — cn() class merging utility

components/             — Reusable UI components (create when needed)
  ui/                   — Atomic design elements
  player/               — Music player components
  atmosphere/           — Background, grain, ambient effects
```

### Component Rules

1. **Use `cn()` from `@/lib/utils`** for all conditional class composition
2. **Prefer Tailwind utility classes** over inline styles
3. **Use custom CSS classes** from `globals.css` for complex reusable patterns (`.glass-obsidian`, `.text-carved`, etc.)
4. **Use Framer Motion** for all component animations — do not use CSS transitions for complex orchestration
5. **Server Components by default** — only add `"use client"` when state, effects, or browser APIs are needed
6. **No default exports for components** — use named exports. Exception: page/layout files which Next.js requires as default exports

### Naming

- Components: `PascalCase` — `TrackTitle.tsx`, `ProgressCrawl.tsx`
- Utilities: `camelCase` — `useBreathingCycle.ts`, `getTrackMood.ts`
- CSS classes: `kebab-case` — `.glass-obsidian`, `.text-carved`
- Design tokens: `kebab-case` with semantic prefixes — `--color-void`, `--ease-geological`

---

## Visual Constraints (Non-Negotiable)

These rules override any general UI instinct. Violating them breaks the artifact's identity.

### DO

- Use the color palette from `STYLE_MANIFESTO.md` — no other colors
- Apply the grain overlay (it is already in `globals.css` on `body::before`)
- Use obsidian glassmorphism (`.glass-obsidian`, `.glass-deep`, `.glass-membrane`)
- Make hover states arrive slowly (200–400ms with `ease-awareness`)
- Use massive spacing — content should feel discovered in a vast space
- Use dissolve transitions between states (opacity + blur, never slide/flip)
- Use serif (`font-serif`) for titles, sans (`font-sans`) for UI, mono (`font-mono`) for data
- Keep text near-invisible for metadata — use `text-ghost` or `text-inscription` colors

### DO NOT

- Use neon glow, cyberpunk aesthetics, hologram effects, or glitch animations
- Use pure black (`#000`) or pure white (`#fff`) — use `void` / `membrane` tones
- Use bright glassmorphism with white borders
- Use springy or bouncy animations — all motion is geological
- Use standard waveform visualizations — design sculptural alternatives
- Use rounded pill buttons — UI controls should feel carved, glyph-like
- Use busy layouts — silence and space are features, not waste
- Use instant hover transitions — the surface must slowly become aware
- Add playfulness or warmth — the UI is serene and remote

---

## Animation Guidelines

### Easing Functions (defined in globals.css)

| Token              | Use For                                    |
|--------------------|--------------------------------------------|
| `ease-geological`  | Heavy elements arriving into position      |
| `ease-breathing`   | Cyclical, organic pulsing                  |
| `ease-awareness`   | Hover states, interactive feedback         |
| `ease-dissolve`    | Transitions between views/tracks           |

### Framer Motion Conventions

```tsx
// Geological entrance
const enterVariants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.4, 0, 0.1, 1] }
  }
};

// Breathing cycle (for the central artifact)
const breatheVariants = {
  animate: {
    scale: [1, 1.015, 1],
    opacity: [1, 0.92, 1],
    transition: { duration: 5, ease: [0.37, 0, 0.63, 1], repeat: Infinity }
  }
};

// Awareness (hover response)
const awareHover = {
  whileHover: {
    borderColor: "rgba(235, 230, 220, 0.12)",
    transition: { duration: 0.3, ease: [0.16, 0, 0.12, 1] }
  }
};
```

### Rules

- Never use spring physics — `type: "spring"` is forbidden
- Never use `bounce` or `elastic` easing
- Stagger children entrances at 80–150ms intervals
- Exit animations should dissolve to void (opacity 0, blur 8px)

---

## Accessibility

Even a relic must be usable:

- All interactive elements must have visible focus states (use `lunar` glow, not browser default)
- Maintain WCAG AA contrast for primary text (`membrane` on `void` = ~8.5:1 ratio)
- Secondary text (`membrane-dim`) on `void` meets AA for large text
- Ghost text (`text-ghost`) is decorative only — never use for essential information
- Respect `prefers-reduced-motion` — disable grain animation, breathing, and drift
- All controls must be keyboard-navigable
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)

---

## Performance

- Grain overlay uses a small tiled SVG (256×256) — do not replace with a full-screen canvas
- Atmospheric gradients use CSS only — no JS-driven background effects
- Blur effects (`backdrop-filter`) are GPU-accelerated but expensive — limit to 3–4 simultaneous blurred layers
- Use `will-change` sparingly and only on actively animating elements
- Prefer CSS animations for infinite loops (breathing, drift) — use Framer Motion for orchestrated sequences
- Images and album art: use Next.js `<Image>` with proper sizing and `priority` for above-fold

---

## Git Conventions

- Commit messages in English, imperative mood
- Prefix: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`
- Example: `feat: add progress crawl component with dissolve transition`

---

*This codex governs all agent behavior in The Artifact. When in doubt, read `STYLE_MANIFESTO.md` and choose the option that feels more ancient, more silent, more vast.*
