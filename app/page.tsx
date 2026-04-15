"use client";

import { AudioProvider } from "@/components/audio/AudioProvider";
import { AudioChrome } from "@/components/audio/AudioChrome";
import { SecondaryPanel } from "@/components/player/SecondaryPanel";
import { Visualizer } from "@/components/visualizer/Visualizer";

export default function Home() {
  return (
    <AudioProvider>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Visualizer />
      </main>
      <SecondaryPanel />
      <AudioChrome />
    </AudioProvider>
  );
}
