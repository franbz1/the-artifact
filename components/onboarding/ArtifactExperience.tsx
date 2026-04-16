"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useState } from "react";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { ArtifactEntryCover } from "@/components/onboarding/ArtifactEntryCover";
import {
  readArtifactOnboardCookie,
  writeArtifactOnboardCookie,
} from "@/components/onboarding/onboarding.constants";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const [secondaryPanelOpen, setSecondaryPanelOpen] = useState(false);
  const [mobileSideTab, setMobileSideTab] = useState<"library" | "queue">(
    "library",
  );
  const isMobile = useIsMobile();

  const openSecondaryMobile = useCallback((tab: "library" | "queue") => {
    setMobileSideTab(tab);
    setSecondaryPanelOpen(true);
  }, []);

  useEffect(() => {
    const onboarded = readArtifactOnboardCookie();
    startTransition(() => {
      setGate(onboarded ? "player" : "splash");
    });
  }, []);

  const handleContinue = useCallback(() => {
    writeArtifactOnboardCookie();
    setGate("player");
  }, []);

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
                isMobile={isMobile}
              />
            </main>
            <SecondaryPanel
              open={secondaryPanelOpen}
              onOpenChange={setSecondaryPanelOpen}
              isMobile={isMobile}
              mobileActiveTab={mobileSideTab}
              onMobileTabChange={setMobileSideTab}
            />
            <AudioChrome
              isMobile={isMobile}
              onOpenLibrary={() => {
                openSecondaryMobile("library");
              }}
              onOpenQueue={() => {
                openSecondaryMobile("queue");
              }}
            />
          </>
        ) : null}

        {showCover ? (
          <ArtifactEntryCover onContinue={handleContinue} />
        ) : null}
      </div>
    </AudioProvider>
  );
}
