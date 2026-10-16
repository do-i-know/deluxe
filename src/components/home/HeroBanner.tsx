'use client';

import React from 'react';
import { Play, Pause, Radio, MessageSquare, Music } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Spotlight } from '../ui/AceternityEffects';
import { HairlineWaveform } from './HairlineWaveform';
import { useSongTheme } from '@/hooks/useSongTheme';

export const HeroBanner: React.FC<{
  onOpenChat?: () => void;
}> = ({ onOpenChat }) => {
  const { currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const theme = useSongTheme(currentTrack);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border p-6 sm:p-10 md:p-12 mb-8 shadow-2xl transition-all duration-1000 select-none"
      style={{
        background: `radial-gradient(ellipse 90% 70% at 50% 25%, ${theme.primary} 0%, ${theme.secondary} 45%, ${theme.darkBg} 85%, #050505 100%)`,
        borderColor: `${theme.accentHex}35`,
        boxShadow: `0 20px 60px -15px ${theme.primary}`,
      }}
    >
      {/* Dynamic Aceternity Spotlight Effect */}
      <Spotlight className="-top-36 left-0 md:left-60 md:-top-20" fill={theme.accentHex} />

      {/* Dynamic Spotify-Style Soft Ambient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

      {/* Dynamic Ambient Glowing Orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none opacity-50 transition-all duration-1000"
        style={{ background: theme.primary }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Top Badges Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>1,420 listening</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md transition-colors duration-700"
            style={{
              backgroundColor: `${theme.primary}30`,
              borderColor: `${theme.accentHex}50`,
              color: theme.accentHex,
            }}
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px]">
              {currentTrack?.genre || 'High Fidelity Audio'}
            </span>
          </div>
        </div>

        {/* Centerpiece: Clean, International "NOW PLAYING" Display Header */}
        <div className="w-full max-w-3xl my-2 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span
              className="w-2 h-2 rounded-full animate-pulse transition-colors duration-700"
              style={{ backgroundColor: theme.accentHex }}
            />
            <span className="text-[11px] sm:text-xs font-mono tracking-widest uppercase font-semibold text-white/80">
              NOW PLAYING • LIVE STREAM
            </span>
          </div>

          {/* Running Music Title (Monumental Display Typography) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] px-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-white">
              {currentTrack?.title || 'No Track Selected'}
            </span>
          </h1>

          {/* Artist & Album */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-sm sm:text-lg text-white/90 font-medium drop-shadow-md">
            <span className="font-semibold">{currentTrack?.artist || 'Unknown Artist'}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/60 text-xs sm:text-base font-normal">
              {currentTrack?.album || 'Single Release'}
            </span>
          </div>
        </div>

        {/* Song Thumbnail & Spinning Vinyl Record Display */}
        <div className="my-5 flex items-center justify-center gap-4">
          <div className="relative group">
            {/* Spinning Vinyl Record (Slides out smoothly when playing) */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full transition-all duration-700 pointer-events-none opacity-90 ${
                isPlaying ? 'translate-x-10 animate-[spin_3.5s_linear_infinite]' : 'translate-x-0 group-hover:translate-x-8'
              }`}
              style={{
                background: 'radial-gradient(circle, #1e1e24 0%, #0d0d11 70%, #050508 100%)',
                border: `2px solid ${theme.accentHex}80`,
                boxShadow: `0 0 25px ${theme.accentHex}40`,
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-black border"
                style={{ borderColor: theme.accentHex }}
              />
            </div>

            {/* Main Thumbnail Artwork */}
            <div
              className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl border-2 transition-colors duration-700"
              style={{ borderColor: `${theme.accentHex}60` }}
            >
              <img
                src={currentTrack?.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'}
                alt={currentTrack?.title || 'Running song artwork'}
                className="w-full h-full object-cover"
              />
              {/* Play Overlay Button */}
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 z-20 bg-black/40 hover:bg-black/60 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-current drop-shadow-lg" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current ml-1 drop-shadow-lg" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* High-Performance Hairline Waveform Canvas */}
        <div className="w-full max-w-lg my-2 px-2">
          <HairlineWaveform accentColor={theme.accentHex} />
        </div>

        {/* Signature Action Pill Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {/* Main Big Play/Pause Toggle */}
          <button
            onClick={togglePlayPause}
            className="px-6 py-2.5 rounded-full text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.accentHex}, #ffffff)`,
              boxShadow: `0 0 25px ${theme.accentHex}70`,
            }}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Live Stream</span>
              </>
            )}
          </button>

          {/* Live Lounge Chat Button */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-4 py-2.5 rounded-full bg-black/40 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white text-xs font-semibold backdrop-blur-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" style={{ color: theme.accentHex }} />
              <span>Live Lounge Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
