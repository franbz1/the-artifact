"use client";

import { useEffect, useRef } from "react";
import { AudioProvider, useAudio } from "@/components/audio/AudioProvider";
import { AudioDropZone } from "@/components/audio/AudioDropZone";
import { Visualizer } from "@/components/visualizer/Visualizer";
import { DEFAULT_SONG_URL } from "@/components/visualizer/visualizer.constants";

function DefaultSongLoader() {
  const { loadUrl, isLoaded } = useAudio();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || isLoaded) return;
    attempted.current = true;
    loadUrl(DEFAULT_SONG_URL);
  }, [loadUrl, isLoaded]);

  return null;
}

export default function Home() {
  return (
    <AudioProvider>
      <DefaultSongLoader />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Visualizer />
      </main>
      <AudioDropZone />
    </AudioProvider>
  );
}
