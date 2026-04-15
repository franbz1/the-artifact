"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  CONTROL_STRIP_VOLUME_THUMB_PROXIMITY,
  CONTROL_STRIP_VOLUME_TRACK_HEIGHT_PX,
} from "./control-strip.constants";

interface ArtifactVolumeControlProps {
  className?: string;
  /** Horizontal width of the range input (becomes vertical track length after -90° rotation). */
  trackLengthPx?: number;
}

export function ArtifactVolumeControl({
  className,
  trackLengthPx = CONTROL_STRIP_VOLUME_TRACK_HEIGHT_PX,
}: ArtifactVolumeControlProps) {
  const { volume, applyVolumeImmediate, commitVolumeFromElement } = useAudio();
  const [volumeTrackLit, setVolumeTrackLit] = useState(false);
  /** Local value while dragging so we do not re-render the app on every pointer event. */
  const [dragValue, setDragValue] = useState<number | null>(null);

  const displayVolume = dragValue !== null ? dragValue : volume;
  const volPercent = Math.round(displayVolume * 100);

  const endVolumeGesture = useCallback(() => {
    commitVolumeFromElement();
    setDragValue(null);
  }, [commitVolumeFromElement]);

  const syncVolumeTrackLit = useCallback(
    (el: HTMLInputElement, offsetX: number, buttons: number) => {
      if ((buttons & 1) !== 0) {
        setVolumeTrackLit(true);
        return;
      }
      const w = el.offsetWidth;
      if (w <= 0) return;
      const ratio = offsetX / w;
      const v = Number(el.value);
      const nearThumb = Math.abs(ratio - v) < CONTROL_STRIP_VOLUME_THUMB_PROXIMITY;
      setVolumeTrackLit(nearThumb);
    },
    [],
  );

  return (
    <div
      className={cn(
        "flex w-[2.5rem] flex-col items-center justify-center py-1",
        className,
      )}
    >
      <label className="sr-only" htmlFor="artifact-volume">
        Volume
      </label>
      <div
        className="flex items-center justify-center"
        style={{
          height: trackLengthPx,
          width: "1.75rem",
        }}
      >
        <div className="flex shrink-0 -rotate-90 items-center justify-center">
          <input
            id="artifact-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={displayVolume}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volPercent}
            aria-label="Volume"
            onChange={(e) => {
              const v = Number(e.currentTarget.value);
              applyVolumeImmediate(v);
              setDragValue(v);
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              syncVolumeTrackLit(
                e.currentTarget,
                e.nativeEvent.offsetX,
                e.buttons,
              );
            }}
            onPointerMove={(e) => {
              syncVolumeTrackLit(
                e.currentTarget,
                e.nativeEvent.offsetX,
                e.buttons,
              );
            }}
            onPointerUp={(e) => {
              syncVolumeTrackLit(
                e.currentTarget,
                e.nativeEvent.offsetX,
                0,
              );
              endVolumeGesture();
            }}
            onPointerCancel={endVolumeGesture}
            onBlur={endVolumeGesture}
            onPointerLeave={(e) => {
              if (e.buttons === 0) setVolumeTrackLit(false);
            }}
            className={cn(
              "control-strip-volume-range h-7 cursor-pointer",
              "rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-lunar/50",
              volumeTrackLit && "control-strip-volume-range--track-lit",
            )}
            style={{ width: trackLengthPx }}
          />
        </div>
      </div>
    </div>
  );
}
