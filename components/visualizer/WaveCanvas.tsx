"use client";

import { useRef, useEffect, type MutableRefObject, type RefObject } from "react";
import { cn } from "@/lib/utils";
import {
  WAVE_CONFIG,
  FREQUENCY_BANDS,
  PROGRESS_CONFIG,
  PROGRESS_DOT_TOP_VAR,
} from "./visualizer.constants";
import type { WaveformRefs } from "@/hooks/useWaveformData";

interface WaveCanvasProps {
  waveformRefs: WaveformRefs;
  /** 0–1 playback position; read each frame from the ref (stable object, no effect restart). */
  progressRef: MutableRefObject<number>;
  /** Strip element that hosts the seek handle — receives deepest fill-bottom Y each frame. */
  progressStripRef?: RefObject<HTMLElement | null>;
  className?: string;
}

type BandBuffers = Float32Array[];

function ensureBandBuffers(
  ref: React.MutableRefObject<BandBuffers | null>,
  points: number,
): BandBuffers {
  if (!ref.current || ref.current[0]?.length !== points) {
    ref.current = FREQUENCY_BANDS.map(() => new Float32Array(points).fill(0));
  }
  return ref.current;
}

function extractBandWave(
  freqData: Uint8Array,
  binStart: number,
  binEnd: number,
  outPoints: number,
  out: Float32Array,
  smoothing: number,
) {
  const totalBins = freqData.length;
  const startBin = Math.floor(binStart * totalBins);
  const endBin = Math.min(Math.floor(binEnd * totalBins), totalBins - 1);
  const bandSize = endBin - startBin + 1;

  for (let i = 0; i < outPoints; i++) {
    const frac = i / (outPoints - 1);
    const exactBin = startBin + frac * (bandSize - 1);
    const lo = Math.floor(exactBin);
    const hi = Math.min(lo + 1, endBin);
    const t = exactBin - lo;

    const valLo = freqData[lo] / 255;
    const valHi = freqData[hi] / 255;
    const target = valLo + (valHi - valLo) * t;

    out[i] += (target - out[i]) * smoothing;
  }
}

function shapeAmplitude(raw: number): number {
  return Math.sign(raw) * Math.pow(Math.abs(raw), 0.75);
}

function parseRgbTriplet(rgb: string): [number, number, number] {
  const parts = rgb.split(",").map((s) => Number(s.trim()));
  return [parts[0]!, parts[1]!, parts[2]!];
}

/** Blend band RGB string toward lunar for played overlay. */
function blendTowardLunar(bandRgb: string, lunarRgb: string, t: number): string {
  const [br, bg, bb] = parseRgbTriplet(bandRgb);
  const [lr, lg, lb] = parseRgbTriplet(lunarRgb);
  return `${Math.round(br + (lr - br) * t)}, ${Math.round(bg + (lg - bg) * t)}, ${Math.round(bb + (lb - bb) * t)}`;
}

function addWaveLinePath(
  ctx: CanvasRenderingContext2D,
  yValues: readonly number[],
  sliceWidth: number,
) {
  const pts = yValues.length;
  for (let i = 0; i < pts; i++) {
    const x = i * sliceWidth;
    if (i === 0) {
      ctx.moveTo(x, yValues[i]!);
    } else {
      const prevX = (i - 1) * sliceWidth;
      const cpX = (prevX + x) / 2;
      ctx.quadraticCurveTo(
        prevX,
        yValues[i - 1]!,
        cpX,
        (yValues[i - 1]! + yValues[i]!) / 2,
      );
    }
  }
}

function addWaveFillPath(
  ctx: CanvasRenderingContext2D,
  yValues: readonly number[],
  sliceWidth: number,
  width: number,
  fillBottom: number,
) {
  addWaveLinePath(ctx, yValues, sliceWidth);
  ctx.lineTo(width, fillBottom);
  ctx.lineTo(0, fillBottom);
  ctx.closePath();
}

export function WaveCanvas({
  waveformRefs,
  progressRef,
  progressStripRef,
  className,
}: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(0);
  const bandBuffersRef = useRef<BandBuffers | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const applySize = () => {
      const w = window.innerWidth;
      const h = WAVE_CONFIG.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (sizeRef.current.w === w && sizeRef.current.h === h) return;
      sizeRef.current = { w, h };

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applySize();
    window.addEventListener("resize", applySize);

    const tick = () => {
      const { w: width, h: height } = sizeRef.current;
      if (width === 0) { rafRef.current = requestAnimationFrame(tick); return; }

      clockRef.current += 1;
      const t = clockRef.current;
      const pts = WAVE_CONFIG.drawPoints;

      ctx.clearRect(0, 0, width, height);

      const freqData = waveformRefs.frequency.current;
      const isActive = waveformRefs.isActive.current;
      const buffers = ensureBandBuffers(bandBuffersRef, pts);

      const padY = height * WAVE_CONFIG.verticalPaddingRatio;
      const innerH = height - padY * 2;
      const midY = padY + innerH * 0.5;
      const peakRange = innerH * WAVE_CONFIG.peakHeightRatio;
      const sliceWidth = width / (pts - 1);

      let deepestFillBottom = 0;

      for (let b = 0; b < FREQUENCY_BANDS.length; b++) {
        const band = FREQUENCY_BANDS[b];
        const buf = buffers[b];

        if (isActive && freqData) {
          extractBandWave(freqData, band.binStart, band.binEnd, pts, buf, WAVE_CONFIG.smoothing);
        } else {
          for (let i = 0; i < pts; i++) {
            const phase = i * band.idleFreq + t * WAVE_CONFIG.idleSineSpeed;
            const target = Math.sin(phase) * (band.idleAmp / innerH);
            buf[i] += (target - buf[i]) * WAVE_CONFIG.smoothing;
          }
        }

        // Build the wave path as an array of y-values so we can reuse it for stroke + fill
        const yValues: number[] = new Array(pts);
        for (let i = 0; i < pts; i++) {
          const shaped = shapeAmplitude(buf[i] * band.amplitudeScale);
          yValues[i] = midY - shaped * peakRange;
        }

        // -- Fill under the curve (short gradient below the wave, not full canvas height) --
        let waveMaxY = yValues[0]!;
        for (let i = 1; i < pts; i++) {
          if (yValues[i]! > waveMaxY) waveMaxY = yValues[i]!;
        }
        const fillBottom = Math.min(
          height,
          waveMaxY + height * WAVE_CONFIG.fillGradientExtendRatio,
        );
        deepestFillBottom = Math.max(deepestFillBottom, fillBottom);

        ctx.beginPath();
        for (let i = 0; i < pts; i++) {
          const x = i * sliceWidth;
          if (i === 0) {
            ctx.moveTo(x, yValues[i]);
          } else {
            const prevX = (i - 1) * sliceWidth;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, yValues[i - 1], cpX, (yValues[i - 1] + yValues[i]) / 2);
          }
        }
        ctx.lineTo(width, fillBottom);
        ctx.lineTo(0, fillBottom);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, waveMaxY, 0, fillBottom);
        grad.addColorStop(0, `rgba(${band.color}, ${band.fillOpacity})`);
        grad.addColorStop(0.65, `rgba(${band.color}, ${band.fillOpacity * 0.25})`);
        grad.addColorStop(1, `rgba(${band.color}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        // -- Stroke the wave line --
        ctx.beginPath();
        ctx.lineWidth = band.lineWidth;
        ctx.strokeStyle = `rgba(${band.color}, ${band.opacity})`;

        for (let i = 0; i < pts; i++) {
          const x = i * sliceWidth;
          if (i === 0) {
            ctx.moveTo(x, yValues[i]);
          } else {
            const prevX = (i - 1) * sliceWidth;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, yValues[i - 1], cpX, (yValues[i - 1] + yValues[i]) / 2);
          }
        }

        ctx.stroke();

        // -- Played tonal overlay (hard edge at progress — clip, no horizontal fade) --
        const progress = Math.min(1, Math.max(0, progressRef.current));
        const progressX = Math.min(width, Math.max(0, progress * width));
        if (progressX > 0) {
          const strokeRgb = blendTowardLunar(
            band.color,
            PROGRESS_CONFIG.lunarRgb,
            PROGRESS_CONFIG.lunarTintBlend,
          );
          const fillRgb = blendTowardLunar(
            band.color,
            PROGRESS_CONFIG.lunarRgb,
            PROGRESS_CONFIG.lunarTintBlend * 0.85,
          );
          const boostOpacity = Math.min(
            1,
            band.opacity * PROGRESS_CONFIG.playedOpacityMultiplier,
          );
          const boostFill = Math.min(
            1,
            band.fillOpacity * PROGRESS_CONFIG.playedFillMultiplier,
          );

          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, progressX, height);
          ctx.clip();

          ctx.beginPath();
          addWaveFillPath(ctx, yValues, sliceWidth, width, fillBottom);
          const fillGradPlayed = ctx.createLinearGradient(0, waveMaxY, 0, fillBottom);
          fillGradPlayed.addColorStop(0, `rgba(${fillRgb}, ${boostFill})`);
          fillGradPlayed.addColorStop(
            0.65,
            `rgba(${fillRgb}, ${boostFill * 0.25})`,
          );
          fillGradPlayed.addColorStop(1, `rgba(${fillRgb}, 0)`);
          ctx.fillStyle = fillGradPlayed;
          ctx.fill();

          ctx.beginPath();
          addWaveLinePath(ctx, yValues, sliceWidth);
          ctx.lineWidth = band.lineWidth;
          ctx.strokeStyle = `rgba(${strokeRgb}, ${boostOpacity})`;
          ctx.stroke();
          ctx.restore();
        }
      }

      const strip = progressStripRef?.current;
      if (strip) {
        strip.style.setProperty(PROGRESS_DOT_TOP_VAR, `${deepestFillBottom}px`);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", applySize);
    };
  }, [waveformRefs, progressRef, progressStripRef]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}
