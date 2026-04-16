"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useState } from "react";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { ArtifactEntryCover } from "@/components/onboarding/ArtifactEntryCover";
import {
  MOBILE_MAX_WIDTH_PX,
  readArtifactOnboardCookie,
  writeArtifactOnboardCookie,
} from "@/components/onboarding/onboarding.constants";

const Visualizer = dynamic(
  () =>
    import("@/components/visualizer/Visualizer").then((m) => ({
      default: m.Visualizer,
    })),
  { ssr: false },
);

const SecondaryPanel = dynamic(
  () =>
    import("@/components/player/SecondaryPanel").then((m) => ({
      default: m.SecondaryPanel,
    })),
  { ssr: false },
);

const AudioChrome = dynamic(
  () =>
    import("@/components/audio/AudioChrome").then((m) => ({
      default: m.AudioChrome,
    })),
  { ssr: false },
);

type Gate = "hydrating" | "splash" | "player";

export function ArtifactExperience() {
  const [gate, setGate] = useState<Gate>("hydrating");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [secondaryPanelOpen, setSecondaryPanelOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const sync = () => {
      const mobile = mq.matches;
      setIsMobileViewport(mobile);
      return mobile;
    };

    const mobile = sync();
    const onboarded = readArtifactOnboardCookie();
    startTransition(() => {
      if (onboarded && !mobile) {
        setGate("player");
      } else {
        setGate("splash");
      }
    });

    const onMq = () => {
      const next = sync();
      if (next) {
        startTransition(() => {
          setGate((g) => (g === "player" ? "splash" : g));
        });
      }
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const handleContinue = useCallback(() => {
    if (isMobileViewport) return;
    writeArtifactOnboardCookie();
    setGate("player");
  }, [isMobileViewport]);

  const showPlayer = gate === "player";
  const showCover = gate === "splash";

  return (
    <AudioProvider catalogBootstrapEnabled={showPlayer}>
      <div className="min-h-screen bg-void">
        {showPlayer ? (
          <>
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
              <Visualizer
                secondaryPanelOpen={secondaryPanelOpen}
              />
            </main>
            <SecondaryPanel
              open={secondaryPanelOpen}
              onOpenChange={setSecondaryPanelOpen}
            />
            <AudioChrome />
          </>
        ) : null}

        {showCover ? (
          <ArtifactEntryCover
            isMobileViewport={isMobileViewport}
            onContinue={handleContinue}
          />
        ) : null}
      </div>
    </AudioProvider>
  );
}
