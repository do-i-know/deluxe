'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface HairlineWaveformProps {
  accentColor?: string;
  className?: string;
}

/**
 * High-Performance Hairline Acoustic Waveform
 * Inspired by @lucasmarkes/hairline:
 * - Ultra-crisp 1px - 1.5px single-stroke harmonic curves
 * - Interactive pointer physics: cursor movement gently deflects physical string harmonics
 * - Direct Canvas 2D hardware-accelerated render loop (0 React state re-renders)
 * - Retina High-DPI crisp rendering
 * - Fluid audio reactivity when music plays
 */
export const HairlineWaveform: React.FC<HairlineWaveformProps> = ({
  accentColor = '#f59e0b',
  className = '',
}) => {
  const { isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable interactive physics state (no React re-renders)
  const stateRef = useRef({
    isPlaying,
    accentColor,
    pointer: { x: -1000, y: -1000, active: false },
    smoothPointer: { x: -1000, y: -1000 },
    time: 0,
    width: 600,
    height: 140,
    dpr: 1,
  });

  // Keep stateRef up to date with props without re-binding loops
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.accentColor = accentColor;
  }, [isPlaying, accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
      stateRef.current.dpr = dpr;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation Render Loop
    const render = () => {
      const state = stateRef.current;
      const dpr = state.dpr;
      const width = state.width;
      const height = state.height;

      // Advance physics time
      state.time += state.isPlaying ? 0.038 : 0.012;

      // Smooth pointer easing
      if (state.pointer.active) {
        state.smoothPointer.x += (state.pointer.x - state.smoothPointer.x) * 0.12;
        state.smoothPointer.y += (state.pointer.y - state.smoothPointer.y) * 0.12;
      } else {
        // Return to center neutral when pointer leaves
        state.smoothPointer.x += (width / 2 - state.smoothPointer.x) * 0.05;
        state.smoothPointer.y += (height / 2 - state.smoothPointer.y) * 0.05;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const ribbonCount = 5;
      const pointCount = 36;
      const centerY = height * 0.52;
      const activeAmp = state.isPlaying ? 24 : 7;

      for (let r = 0; r < ribbonCount; r++) {
        const rNorm = r / (ribbonCount - 1); // 0 to 1
        const depthOffset = (r - 2) * 12; // isometric layer depth
        const phaseShift = r * 0.65;

        ctx.beginPath();

        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < pointCount; i++) {
          const u = i / (pointCount - 1); // 0 to 1
          const x = 30 + u * (width - 60);

          // Bell envelope to taper edges smoothly
          const envelope = Math.sin(u * Math.PI);

          // Harmonic wave frequencies
          const wave1 = Math.sin(u * Math.PI * 3.2 + state.time * 2.2 + phaseShift);
          const wave2 = Math.cos(u * Math.PI * 5.4 - state.time * 1.6 + phaseShift * 0.8);
          const wave3 = Math.sin(u * Math.PI * 8.0 + state.time * 3.0) * 0.35;
          const naturalWave = (wave1 * 0.65 + wave2 * 0.35 + wave3) * envelope * activeAmp;

          // Interactive pointer pluck & deflection
          let pointerDeflection = 0;
          if (state.pointer.active) {
            const distToCursor = Math.abs(x - state.smoothPointer.x);
            const influenceRadius = width * 0.28;
            if (distToCursor < influenceRadius) {
              const falloff = Math.cos((distToCursor / influenceRadius) * (Math.PI / 2));
              const pointerYDelta = (state.smoothPointer.y - centerY) * 0.45;
              pointerDeflection = pointerYDelta * falloff * envelope;
            }
          }

          const y = centerY + depthOffset + naturalWave + pointerDeflection;
          points.push({ x, y });
        }

        // Draw smooth Catmull-Rom / Bezier curve across points
        if (points.length > 1) {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
          }
          const last = points[points.length - 1];
          ctx.lineTo(last.x, last.y);
        }

        // Color and stroke style
        const isCenter = r === 2;
        ctx.lineWidth = isCenter ? 2.0 : 1.2;

        if (isCenter) {
          // Vibrant glowing center ribbon
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, `${state.accentColor}20`);
          grad.addColorStop(0.3, state.accentColor);
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(0.7, state.accentColor);
          grad.addColorStop(1, `${state.accentColor}20`);

          ctx.strokeStyle = grad;
          ctx.shadowColor = state.accentColor;
          ctx.shadowBlur = 10;
        } else {
          // Surrounding isometric acoustic lines
          const alpha = 0.25 + (1 - Math.abs(r - 2) / 2) * 0.45;
          ctx.strokeStyle = state.accentColor;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // If playing, draw pulsing harmonic acoustic bead on center wave
      if (state.isPlaying) {
        const beadU = 0.5;
        const beadX = width * beadU;
        const beadWave = Math.sin(beadU * Math.PI * 3.2 + state.time * 2.2 + 2 * 0.65) * activeAmp;
        const beadY = centerY + beadWave;

        ctx.beginPath();
        ctx.arc(beadX, beadY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = state.accentColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.pointer = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handlePointerLeave = () => {
    stateRef.current.pointer.active = false;
  };

  return (
    <div className={`relative w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}>
      {/* 60fps Hardware-Accelerated Hairline Waveform Canvas */}
      <div className="w-full h-24 sm:h-28 relative">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full cursor-pointer touch-none block"
        />
      </div>

      {/* Elegant Hairline Frequency Spectrum Caption */}
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex items-center gap-0.5">
          <span className="w-0.5 h-2.5 rounded-full bg-amber-400 animate-[pulse_1s_ease-in-out_infinite]" />
          <span className="w-0.5 h-4 rounded-full bg-amber-400 animate-[pulse_1.4s_ease-in-out_infinite]" />
          <span className="w-0.5 h-1.5 rounded-full bg-amber-400 animate-[pulse_0.8s_ease-in-out_infinite]" />
        </div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">
          Acoustic Frequency Spectrum • Reactive Audio
        </span>
      </div>
    </div>
  );
};
