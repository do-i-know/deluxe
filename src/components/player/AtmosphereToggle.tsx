'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CloudRain, Volume2, Sparkles } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export const AtmosphereToggle: React.FC = () => {
  const {
    isRainAmbientActive,
    toggleRainAmbient,
    rainVolume,
    setRainVolumeLevel,
  } = useAudioPlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightningOverlayRef = useRef<HTMLDivElement | null>(null);

  // Rain Drops Animation Canvas
  useEffect(() => {
    if (!isRainAmbientActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Rain drop particles
    interface Drop {
      x: number;
      y: number;
      l: number; // length
      xs: number; // speed x
      ys: number; // speed y
      alpha: number;
    }

    const dropCount = Math.min(180, Math.floor(width / 7));
    const drops: Drop[] = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        l: Math.random() * 18 + 10,
        xs: -1.5 + Math.random() * 0.5,
        ys: Math.random() * 12 + 10,
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    // Lightning Flash Timer
    let lightningTimer: NodeJS.Timeout;
    const scheduleLightning = () => {
      const delay = Math.random() * 12000 + 7000;
      lightningTimer = setTimeout(() => {
        if (lightningOverlayRef.current && isRainAmbientActive) {
          lightningOverlayRef.current.style.opacity = '0.35';
          setTimeout(() => {
            if (lightningOverlayRef.current) lightningOverlayRef.current.style.opacity = '0';
          }, 60);
          setTimeout(() => {
            if (lightningOverlayRef.current) lightningOverlayRef.current.style.opacity = '0.55';
          }, 110);
          setTimeout(() => {
            if (lightningOverlayRef.current) lightningOverlayRef.current.style.opacity = '0';
          }, 180);
        }
        scheduleLightning();
      }, delay);
    };
    scheduleLightning();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.xs * 1.5, d.y + d.ys * 1.5);
        ctx.strokeStyle = `rgba(186, 230, 253, ${d.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        d.x += d.xs;
        d.y += d.ys;

        if (d.x < 0 || d.y > height) {
          d.x = Math.random() * width + 50;
          d.y = -20;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(lightningTimer);
    };
  }, [isRainAmbientActive]);

  return (
    <>
      {/* Full-screen Rain Canvas & Lightning Flash */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none z-20 transition-opacity duration-1000 ${
          isRainAmbientActive ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={lightningOverlayRef}
        className="fixed inset-0 pointer-events-none z-25 bg-[#e0f2fe] opacity-0 transition-opacity duration-75 mix-blend-screen"
      />

      {/* Pill Toggle Button */}
      <div className="relative inline-flex items-center">
        <button
          onClick={toggleRainAmbient}
          className={`h-9 px-3.5 rounded-full flex items-center gap-2 text-xs font-semibold backdrop-blur-xl transition-all duration-300 border cursor-pointer ${
            isRainAmbientActive
              ? 'bg-blue-950/70 border-sky-400/80 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
              : 'bg-[#180a07]/80 border-white/15 text-white/80 hover:border-amber-400/50 hover:text-white'
          }`}
          title="Toggle Monsoon Rain & Thunder Ambience (Baarish)"
        >
          <CloudRain
            className={`w-4 h-4 transition-transform duration-300 ${
              isRainAmbientActive ? 'text-sky-300 animate-bounce' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Baarish</span>
          {isRainAmbientActive && (
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block" />
          )}
        </button>

        {isRainAmbientActive && (
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="ml-1.5 p-1.5 rounded-full text-sky-300/80 hover:text-sky-100 hover:bg-sky-950/50 transition-colors"
            title="Adjust Rain Volume"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Rain Volume Popover */}
        {showVolumeSlider && isRainAmbientActive && (
          <div className="absolute top-11 left-0 z-30 p-2.5 bg-[#160805]/95 border border-sky-500/30 rounded-xl shadow-2xl backdrop-blur-2xl flex items-center gap-2 w-36">
            <CloudRain className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rainVolume}
              onChange={(e) => setRainVolumeLevel(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-1 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>
    </>
  );
};
