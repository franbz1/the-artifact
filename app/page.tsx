"use client";

import { AudioProvider } from "@/components/audio/AudioProvider";
import { AudioDropZone } from "@/components/audio/AudioDropZone";
import { Artifact } from "@/components/artifact/Artifact";

export default function Home() {
  return (
    <AudioProvider>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <Artifact />
        <AudioDropZone />
      </main>
    </AudioProvider>
  );
}
