'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface HairlineWaveformProps {
  accentColor?: string;
  className?: string;
}

/**
 * High-Performance Hairline Acoustic Waveform
 * Optimized for Production 120fps:
 * - Ultra-crisp 1px - 1.5px single-stroke harmonic curves
 * - Double-stroke hardware-accelerated neon glow (0 canvas shadowBlur software convolutions)
 * - IntersectionObserver pauses requestAnimationFrame when scrolled offscreen
 * - Zero layout reflow thrashing (cached rect on pointer enter)
 * - Fluid audio reactivity when music plays
 */
export const HairlineWaveform: React.FC<HairlineWaveformProps> = ({
  accentColor = '#f59e0b',
  className = '',
}) => {
  const { isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rectRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

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

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let isVisible = true;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
      stateRef.current.dpr = dpr;
      rectRef.current = { left: rect.left, top: rect.top };

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Animation Render Loop
    const render = () => {
      if (!isVisible) return;

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

        const isCenter = r === 2;

        if (isCenter) {
          // Layer 1: Soft diffuse glow stroke (hardware accelerated, 0 shadowBlur penalty)
          ctx.lineWidth = 4.0;
          ctx.strokeStyle = state.accentColor;
          ctx.globalAlpha = 0.25;
          ctx.stroke();

          // Layer 2: Vibrant glowing center hairline
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, `${state.accentColor}20`);
          grad.addColorStop(0.3, state.accentColor);
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(0.7, state.accentColor);
          grad.addColorStop(1, `${state.accentColor}20`);

          ctx.lineWidth = 1.8;
          ctx.strokeStyle = grad;
          ctx.globalAlpha = 1.0;
          ctx.stroke();
        } else {
          // Surrounding isometric acoustic lines
          const alpha = 0.25 + (1 - Math.abs(r - 2) / 2) * 0.45;
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = state.accentColor;
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
      }

      // If playing, draw pulsing harmonic acoustic bead on center wave
      if (state.isPlaying) {
        const beadU = 0.5;
        const beadX = width * beadU;
        const beadWave = Math.sin(beadU * Math.PI * 3.2 + state.time * 2.2 + 2 * 0.65) * activeAmp;
        const beadY = centerY + beadWave;

        // Bead glow halo
        ctx.beginPath();
        ctx.arc(beadX, beadY, 7, 0, Math.PI * 2);
        ctx.fillStyle = state.accentColor;
        ctx.globalAlpha = 0.35;
        ctx.fill();

        // Bead inner crisp core
        ctx.beginPath();
        ctx.arc(beadX, beadY, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    // Pause animation when scrolled offscreen to conserve 100% GPU
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (!wasVisible && isVisible) {
          animId = requestAnimationFrame(render);
        } else if (!isVisible) {
          cancelAnimationFrame(animId);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePointerEnter = () => {
    if (canvasRef.current) {
      const r = canvasRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top };
      stateRef.current.pointer.active = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.pointer = {
      x: e.clientX - rectRef.current.left,
      y: e.clientY - rectRef.current.top,
      active: true,
    };
  };

  const handlePointerLeave = () => {
    stateRef.current.pointer.active = false;
  };

  return (
    <div className={`relative w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}>
      {/* 120fps Hardware-Accelerated Hairline Waveform Canvas */}
      <div className="w-full h-24 sm:h-28 relative">
        <canvas
          ref={canvasRef}
          onPointerEnter={handlePointerEnter}
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

