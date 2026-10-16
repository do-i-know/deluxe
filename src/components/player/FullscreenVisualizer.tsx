'use client';

import React, { useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { VinylDisc } from './VinylDisc';

export const FullscreenVisualizer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    favorites,
    isFullscreenOpen,
    setIsFullscreenOpen,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    toggleFavorite,
  } = useAudioPlayer();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenOpen) {
        setIsFullscreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, setIsFullscreenOpen]);

  if (!isFullscreenOpen || !currentTrack) return null;

  const isLiked = favorites.includes(currentTrack.id);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 overflow-hidden animate-in fade-in duration-300"
      style={{
        background: 'radial-gradient(circle at center, #2e1008 0%, #150604 60%, #070202 100%)',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-300/80">
            Deluxe Music Live Studio • High-Fidelity Audio
          </span>
        </div>

        <button
          onClick={() => setIsFullscreenOpen(false)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          title="Exit Fullscreen (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center: Massive Spinning Vinyl Disc & Equalizer */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 z-10">
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow behind disc */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/20 blur-[90px] pointer-events-none" />

          {/* Vinyl Disc XL */}
          <VinylDisc size="xl" coverUrl={currentTrack.cover_url} />
        </div>

        {/* Track Title and Artist */}
        <div className="text-center mt-8 max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {currentTrack.title}
          </h2>
          <p className="text-base sm:text-lg text-amber-300/80 font-medium mt-1">
            {currentTrack.artist} • <span className="text-white/40">{currentTrack.album}</span>
          </p>
        </div>

        {/* Dynamic Simulated Audio Equalizer Bars */}
        <div className="flex items-end justify-center gap-1.5 h-12 mt-6">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-amber-600 to-amber-300 transition-all duration-150 ${
                isPlaying ? 'opacity-85' : 'opacity-20'
              }`}
              style={{
                height: isPlaying
                  ? `${Math.max(12, Math.sin(i * 0.4 + (currentTime % 10)) * 36 + 20)}px`
                  : '6px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom: Timeline and Playback Controls */}
      <div className="max-w-2xl mx-auto w-full z-10 flex flex-col items-center gap-4">
        {/* Timeline */}
        <div className="w-full flex items-center gap-3 text-xs sm:text-sm font-mono text-white/60">
          <span>{formatTime(currentTime)}</span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              seekTo(ratio * duration);
            }}
            className="flex-1 h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group"
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-100 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-white/60 hover:text-white'
              }`}
            />
          </button>

          <button
            onClick={playPrevious}
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
