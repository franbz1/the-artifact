## Cola de reproducción (Playback Queue)

Este proyecto separa **biblioteca** y **cola**:

- **Biblioteca** (`library` en `usePlaybackQueue`): pistas del catálogo interno (`GET /api/music`) más archivos subidos en la sesión (drag-and-drop / file picker). Los subidos **no persisten** al recargar.
- **Cola** (`DoublyLinkedPlaylist`): única fuente conectada al reproductor (`loadFile` / `loadUrl`). Tras un reload, la cola vuelve a reflejar solo el orden del API; la biblioteca vuelve a los mismos ítems de API más vacío de subidos.

La cola vive en contexto (`AudioProvider`) y se conecta con:

- **Carga inicial** desde archivos en `public/music` (vía API)
- **Navegación** anterior/siguiente en la UI

> Por ahora la cola **solo emite estado por consola** (logs), no hay UI de biblioteca/cola.

### Estructura de datos

- **Tipos**: `TrackEntry` / `TrackSource` (`file` o `url`) en `lib/playback-queue/types.ts`; helpers `createCatalogTrackEntry`, `cloneTrackEntryForQueue`.
- **Lista doblemente enlazada + cursor**: `DoublyLinkedPlaylist` en `lib/playback-queue/doubly-linked-playlist.ts`
  - Mantiene `head`, `tail` y un puntero `current` (la pista seleccionada para reproducción)
  - Operaciones soportadas: `appendEntry`, `removeById`, `advanceCurrent`, `retreatCurrent`, `moveBefore`, `moveAfter`

### Carga inicial (seed) desde `public/music`

1. Al montar la app, el hook `usePlaybackQueue` hace un `fetch('/api/music')`.
2. El endpoint `GET /api/music` lista los archivos en `public/music` (filtra extensiones de audio) y devuelve:

```json
{ "tracks": [ { "url": "/music/foo.mp3", "label": "foo.mp3" } ] }
```

3. Esas URLs rellenan la **biblioteca** y la **cola** en orden (por nombre), como `TrackSource.kind = 'url'` (ids de catálogo estables + clones en la cola).
4. Tras poblar la cola, si hay al menos una pista, se **carga** la primera en el engine (`loadUrl`), pero **queda pausada** (sin autoplay).

Ruta relevante:
- `app/api/music/route.ts`
- `public/music/` (incluye `.gitkeep` para versionar la carpeta vacía)

### Agregar canciones por drag-and-drop / file picker

- El drop y el input llaman `addLibraryFile(file)` desde `AudioChrome` (solo biblioteca).
- Para reproducir un ítem de biblioteca habría que usar `addLibraryEntryToQueue(id)` (API expuesta para una UI futura).

Archivo relevante:
- `components/audio/AudioChrome.tsx`

### Navegación (prev/next + hold seek)

Los botones de la barra de control (`ControlStrip`) ahora tienen dos comportamientos:

- **Click corto**:
  - Back: `skipToPrevious()` (cambia a la pista anterior en la cola)
  - Forward: `skipToNext()` (cambia a la siguiente pista en la cola)
- **Mantener presionado**:
  - Repite un `seek(±CONTROL_STRIP_SKIP_SECONDS)` cada cierto intervalo mientras se mantiene presionado
  - Esto NO cambia la pista, solo avanza/retrocede dentro de la misma

Archivos relevantes:
- `components/player/ControlStrip.tsx`
- `components/player/control-strip.constants.ts`

### Auto-advance al terminar una pista

- Cuando el `HTMLAudioElement` emite `ended`, el engine invoca `onMediaEnded`.
- La cola intenta mover `current` a `next` y, si existe, **carga** la siguiente pista y **reproduce** (auto-advance).
- Si no hay siguiente, se mantiene el comportamiento de “terminó y se detiene”.

Archivos relevantes:
- `hooks/useAudioEngine.ts`
- `hooks/usePlaybackQueue.ts`
- `components/audio/AudioProvider.tsx`

### Logs por consola

Cada mutación importante imprime un snapshot:

- Orden de la cola (labels)
- `currentId` y `currentLabel`

El prefijo es `"[playback-queue]"`.

---

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
