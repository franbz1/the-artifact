"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/components/audio/AudioProvider";
import { DUST_LIGHT_CONFIG } from "./visualizer.constants";

interface DustMote {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  opacityPhase: number;
  opacitySpeed: number;
  bright: boolean;
}

function createMote(width: number, height: number): DustMote {
  const cfg = DUST_LIGHT_CONFIG;
  const originX = width + 40;
  const originY = -40;

  const angle = cfg.beamAngle + (Math.random() - 0.5) * cfg.beamSpread;
  const dist = Math.random() * Math.max(width, height) * 1.2;

  return {
    x: originX + Math.cos(angle) * dist,
    y: originY + Math.sin(angle) * dist,
    radius: cfg.particleMinRadius + Math.random() * (cfg.particleMaxRadius - cfg.particleMinRadius),
    speed: cfg.particleMinSpeed + Math.random() * (cfg.particleMaxSpeed - cfg.particleMinSpeed),
    angle,
    opacityPhase: Math.random() * Math.PI * 2,
    opacitySpeed: cfg.opacityCycleSpeed * (0.6 + Math.random() * 0.8),
    bright: Math.random() < 0.38,
  };
}

function respawnMote(mote: DustMote, width: number, height: number) {
  const cfg = DUST_LIGHT_CONFIG;
  const originX = width + 40;
  const originY = -40;

  mote.angle = cfg.beamAngle + (Math.random() - 0.5) * cfg.beamSpread;
  mote.x = originX + (Math.random() - 0.5) * 100;
  mote.y = originY + (Math.random() - 0.5) * 100;
  mote.speed = cfg.particleMinSpeed + Math.random() * (cfg.particleMaxSpeed - cfg.particleMinSpeed);
  mote.radius = cfg.particleMinRadius + Math.random() * (cfg.particleMaxRadius - cfg.particleMinRadius);
  mote.bright = Math.random() < 0.38;
}

interface DustLightProps {
  className?: string;
}

export function DustLight({ className }: DustLightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motesRef = useRef<DustMote[]>([]);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(0);
  const { amplitude } = useAudio();
  const amplitudeRef = useRef(0);

  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let currentDpr = 1;

    const resize = () => {
      currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * currentDpr;
      canvas.height = window.innerHeight * currentDpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      if (motesRef.current.length === 0) {
        motesRef.current = Array.from(
          { length: DUST_LIGHT_CONFIG.particleCount },
          () => createMote(window.innerWidth, window.innerHeight),
        );
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      clockRef.current += 1;
      const t = clockRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const raw = amplitudeRef.current;
      const cfg = DUST_LIGHT_CONFIG;
      /** Soft-knee amplitude: sqrt dulls peaks so loud music stays a whisper. */
      const amp =
        Math.sqrt(Math.min(1, Math.max(0, raw))) * cfg.audioAmplitudeScale;

      ctx.clearRect(0, 0, w, h);

      const maxR = Math.max(w, h);
      const falloffR = maxR * 0.9 * cfg.gradientFalloffRadiusFactor;
      const audioGradBoost = amp * cfg.audioGradientAmp;
      const baseGlowOpacity = cfg.gradientOpacity + audioGradBoost;

      // Wide ambient wash — visible across the full viewport
      const wash = ctx.createRadialGradient(
        w * 0.52,
        h * 0.38,
        0,
        w * 0.5,
        h * 0.55,
        maxR * 1.12,
      );
      const washOp = cfg.ambientWashOpacity + amp * cfg.audioWashAmp;
      wash.addColorStop(0, `rgba(${cfg.gradientColor}, ${Math.min(washOp * 1.35, 0.14)})`);
      wash.addColorStop(0.45, `rgba(${cfg.gradientColor}, ${washOp * 0.52})`);
      wash.addColorStop(1, "transparent");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);

      // Volumetric light cone from upper-right
      const grad = ctx.createRadialGradient(
        w + 60,
        -60,
        0,
        w * 0.4,
        h * 0.5,
        falloffR,
      );
      const hotspotCap = cfg.gradientHotspotMax;
      grad.addColorStop(
        0,
        `rgba(${cfg.gradientColor}, ${Math.min(baseGlowOpacity * 3, hotspotCap)})`,
      );
      grad.addColorStop(0.28, `rgba(${cfg.gradientColor}, ${baseGlowOpacity})`);
      grad.addColorStop(0.65, `rgba(${cfg.gradientColor}, ${baseGlowOpacity * 0.42})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dust motes floating through the light
      for (const mote of motesRef.current) {
        mote.x += Math.cos(mote.angle) * mote.speed;
        mote.y += Math.sin(mote.angle) * mote.speed;

        // Gentle drift perpendicular to travel direction
        const perpAngle = mote.angle + Math.PI * 0.5;
        const drift = Math.sin(t * 0.003 + mote.opacityPhase) * cfg.driftStrength;
        mote.x += Math.cos(perpAngle) * drift;
        mote.y += Math.sin(perpAngle) * drift;

        // Audio-reactive speed boost
        mote.x += Math.cos(mote.angle) * amp * cfg.audioBoost;
        mote.y += Math.sin(mote.angle) * amp * cfg.audioBoost;

        // Distance from light source for falloff
        const dx = mote.x - (w + 40);
        const dy = mote.y - (-40);
        const distFromSource = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(w, h) * 1.3;
        const falloff = Math.max(0, 1 - distFromSource / maxDist);

        // Organic opacity cycle
        const cycleOpacity =
          cfg.particleMinOpacity +
          (cfg.particleMaxOpacity - cfg.particleMinOpacity) *
            (0.5 + 0.5 * Math.sin(t * mote.opacitySpeed + mote.opacityPhase));

        const finalOpacity = Math.min(
          1,
          cycleOpacity *
            falloff *
            (0.72 + amp * cfg.audioParticleOpacityAmp),
        );

        if (finalOpacity > 0.005) {
          const color = mote.bright ? cfg.color : cfg.colorDim;
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${finalOpacity})`;
          ctx.fill();
        }

        // Respawn when out of bounds
        if (mote.x < -50 || mote.x > w + 100 || mote.y < -100 || mote.y > h + 50) {
          respawnMote(mote, w, h);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 z-10 pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}
