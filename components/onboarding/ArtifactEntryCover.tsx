"use client";

import { cn } from "@/lib/utils";

const GITHUB_HREF = "https://github.com/franbz1";

export interface ArtifactEntryCoverProps {
  /** When true, user cannot enter the player (desktop-only lock). */
  isMobileViewport: boolean;
  /** Called when the user chooses to continue (desktop only). */
  onContinue: () => void;
  className?: string;
}

export function ArtifactEntryCover({
  isMobileViewport,
  onContinue,
  className,
}: ArtifactEntryCoverProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-entry-title"
      className={cn(
        "fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto",
        "bg-scrim/95 px-breath py-altar backdrop-blur-[2px]",
        className,
      )}
    >
      <div
        className={cn(
          "glass-obsidian w-full max-w-md border border-border-faint/80 px-breath py-breath shadow-depth",
          "[animation:var(--animate-dissolve-in)] motion-reduce:[animation:none]",
        )}
      >
        <h1
          id="artifact-entry-title"
          className="font-serif text-2xl font-semibold tracking-tight text-membrane"
        >
          The Artifact
        </h1>
        <p className="mt-grain font-sans text-sm leading-relaxed text-membrane-dim">
          This player is by{" "}
          <span className="text-membrane">Francisco Ruales</span> (
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lunar underline decoration-lunar/40 underline-offset-2 transition-colors duration-[var(--duration-aware)] ease-[var(--ease-awareness)] hover:text-lunar-bright hover:decoration-lunar-bright/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lunar/50"
          >
            GitHub
          </a>
          ). The look and feel borrow from the visual world of{" "}
          <span className="text-membrane/90">Dune and Destiny</span> — a buried relic in warm
          darkness.
        </p>
        <p className="mt-breath font-sans text-sm leading-relaxed text-membrane-dim">
          Drop audio files on the page to add them to your library and hear them in
          this space. The{" "}
          <span className="text-membrane/90">Library</span> and{" "}
          <span className="text-membrane/90">Playback queue</span> are fully
          drag-and-drop: delete, add, and reorder tracks; drag between lists to build your
          session.
        </p>

        {isMobileViewport ? (
          <div
            className="mt-breath border border-lunar/25 bg-void-deep/80 px-grain py-grain font-sans text-sm leading-relaxed text-membrane"
            role="status"
          >
            <strong className="font-medium text-lunar-bright">Desktop only.</strong>{" "}
            This installation is built for pointer and keyboard control on a PC or
            laptop. It does not support phones or small touch devices.
          </div>
        ) : (
          <div className="mt-breath flex flex-col items-stretch gap-grain">
            <button
              type="button"
              onClick={onContinue}
              className={cn(
                "font-sans text-sm font-medium tracking-wide text-membrane cursor-pointer",
                "rounded-worn border border-lunar/40 bg-lunar/10 px-breath py-grain",
                "shadow-glow-lunar/20 transition-[background-color,box-shadow,border-color] duration-[var(--duration-aware)] ease-[var(--ease-awareness)]",
                "hover:border-lunar/60 hover:bg-lunar/15 hover:shadow-glow-lunar/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lunar/45 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
              )}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
