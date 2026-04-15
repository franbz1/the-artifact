# The Artifact

A **music player built as an experience**, not a utility screen. The interface is imagined as a buried relic—warm void, carved stone, faint motion—visually inspired by the world of *Dune*. It was created by [Francisco Ruales](https://github.com/franbz1).

<img width="1919" height="877" alt="image" src="https://github.com/user-attachments/assets/4547a05a-2379-4cca-9d0c-056841d58060" />

---

## The idea

Most players optimize for density: lists, chrome, and speed. **The Artifact** optimizes for **atmosphere**. You still get a real queue, a library, and file playback, but the center of the app is a **3D sculptural object** that reacts to the music, plus a minimal, ritual-like control strip. The goal is to feel like you discovered an object in a chamber, not like you opened another tab.

---

## What you need

- **Desktop or laptop** (pointer + keyboard). The experience is gated: small viewports and touch-first devices are blocked with a short notice—layout and interaction are designed for larger screens.
- **Node.js** for local development.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first visit you’ll see a **short entry screen** (authorship, *Dune* inspiration, how drag-and-drop works). After you continue, a cookie remembers onboarding; the 3D scene and catalog load **after** that step so the first paint stays light.

**Production build:**

```bash
npm run build
npm start
```

---

## How to use it

### Seed tracks from the project

Drop audio files into `public/music/`. On startup (after you enter the experience), the app calls `GET /api/music`, which lists those files and **seeds both the library and the queue** in filename order. Playback loads the first track but stays **paused** until you press play.

### Add your own files in the session

**Drag and drop** audio files onto the page (or use the file picker in the control area). They appear in the **library**. Uploaded files **do not persist** after a full reload—only the `public/music` catalog is re-listed from disk.

### Library and queue (drag and drop)

- **Library** — catalog + session uploads; drag tracks toward the **queue** to add or insert them.
- **Playback queue** — the only structure wired to the audio engine (`loadFile` / `loadUrl`). Reorder entries by dragging; drag out to the library zone or outside to remove (with confirmation where needed).

Transport controls support **short click** (previous / next track) and **hold** (seek inside the current track without changing tracks). When a track ends, the queue **auto-advances** if there is a next node.

---

## Technical overview

### Stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js** (App Router), TypeScript |
| Styling | **Tailwind CSS v4** — tokens live in `app/globals.css` |
| 3D | **Three.js** + **React Three Fiber** + **drei** + **postprocessing** |
| Audio | Web Audio API + `HTMLAudioElement` (see `useAudioEngine`) |
| Drag and drop | **@dnd-kit** for library ↔ queue interactions |

### Why a doubly linked list for the queue?

The playback order is modeled as a **`DoublyLinkedPlaylist`** (`lib/playback-queue/doubly-linked-playlist.ts`): nodes carry `TrackEntry` values, and the structure keeps **`head`**, **`tail`**, and a **`current`** cursor for the active track.

Doubly linking makes **O(1) insertion and removal** at known nodes practical—important when the user reorders the queue or drags items from the library. Moving “before” or “after” another track maps to **splicing nodes** without shifting whole arrays. `advanceCurrent` / `retreatCurrent` walk the list for next/previous; when the audio element fires `ended`, the hook advances the cursor and loads the next source.

The **library** is a separate list in React state (catalog URLs + ephemeral `File` sources). Queue entries are **clones** of library entries so the same source can appear more than once in the queue if needed.

Types and helpers (`TrackEntry`, `TrackSource`, catalog vs file ids) live in `lib/playback-queue/types.ts`.

### Three.js / R3F role

The central **artifact mesh** is rendered in a R3F `<Canvas>` (`components/artifact/`). The Web Audio **analyser node** is passed in via refs so the render loop can read levels **without React re-renders every frame**. Materials stay dark and metallic; emissive and motion tie into amplitude where designed—performance rules favor **mutating geometry or uniforms in `useFrame`**, not storing audio data in React state.

Supporting 2D layers (waveform strip, dust/light overlays, progress) sit in `components/visualizer/` and stay DOM/canvas-2D where that is cheaper than 3D text or full-screen post work.

### API route

`app/api/music/route.ts` reads `public/music/`, filters by audio extensions, and returns JSON `{ tracks: [{ url, label }] }` used to build catalog `TrackEntry` rows.

---

## Project layout (short)

```
app/                 App Router, global CSS, page shell
components/artifact/  R3F canvas + scene + mesh
components/audio/     Provider, chrome, drop targets
components/player/    Controls, secondary panels, DnD wiring
components/visualizer/ Waveform, overlays, atmosphere
components/onboarding/ Entry gate + cookie
hooks/                Audio engine, queue, waveform, amplitude
lib/playback-queue/   Types + doubly linked playlist
public/music/         Optional seeded audio files
```

---

## Credits

- **Author:** Francisco Ruales — [github.com/franbz1](https://github.com/franbz1)  
- **Visual inspiration:** the aesthetic world of *Dune* and *Destiny*

---
