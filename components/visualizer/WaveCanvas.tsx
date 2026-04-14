"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WAVE_CONFIG, FREQUENCY_BANDS } from "./visualizer.constants";
import type { WaveformRefs } from "@/hooks/useWaveformData";

interface WaveCanvasProps {
  waveformRefs: WaveformRefs;
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

export function WaveCanvas({ waveformRefs, className }: WaveCanvasProps) {
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
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", applySize);
    };
  }, [waveformRefs]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}
