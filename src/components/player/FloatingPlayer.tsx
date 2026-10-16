'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Maximize2,
} from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useSongTheme } from '@/hooks/useSongTheme';
import { VinylDisc } from './VinylDisc';

export const FloatingPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isQueueOpen,
    favorites,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    setIsQueueOpen,
    setIsFullscreenOpen,
  } = useAudioPlayer();
  const theme = useSongTheme(currentTrack);

  if (!currentTrack) return null;

  const isLiked = favorites.includes(currentTrack.id);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-3 inset-x-2 sm:inset-x-6 md:inset-x-12 z-50 flex justify-center pointer-events-none">
      <div
        className="w-full max-w-4xl pointer-events-auto rounded-3xl p-3 sm:px-6 sm:py-3.5 backdrop-blur-2xl border transition-all duration-700 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 15, 20, 0.92) 0%, rgba(8, 8, 12, 0.96) 100%)',
          borderColor: `${theme.accentHex}40`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 25px ${theme.primary}`,
        }}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Vinyl Disc + Track Details */}
          <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-[260px] md:max-w-xs">
            <VinylDisc size="md" coverUrl={currentTrack.cover_url} />

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate hover:text-amber-300 transition-colors cursor-pointer">
                  {currentTrack.title}
                </h4>
              </div>
              <p className="text-[11px] text-amber-200/70 truncate">{currentTrack.artist}</p>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
              title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-white/40 hover:text-white'
                }`}
              />
            </button>
          </div>

          {/* Center: Controls & Timeline */}
          <div className="flex-1 flex flex-col items-center max-w-lg min-w-0">
            {/* Playback Button Strip */}
            <div className="flex items-center gap-2 sm:gap-4 mb-1">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isShuffle ? 'text-amber-400 bg-amber-500/20' : 'text-white/40 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={playPrevious}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.accentHex}, #ffffff)`,
                  boxShadow: `0 0 20px ${theme.accentHex}60`,
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  repeatMode !== 'off'
                    ? 'text-white'
                    : 'text-white/40 hover:text-white'
                }`}
                style={repeatMode !== 'off' ? { color: theme.accentHex, backgroundColor: `${theme.accentHex}25` } : {}}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>

            {/* Live Progress Bar with Time Display */}
            <div className="w-full flex items-center gap-2 text-[10px] sm:text-xs font-mono text-white/50">
              <span className="w-8 text-right select-none">{formatTime(currentTime)}</span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  seekTo(ratio * duration);
                }}
                className="relative flex-1 h-1.5 sm:h-2 bg-white/15 rounded-full cursor-pointer group overflow-hidden"
              >
                <div
                  className="h-full rounded-full transition-all duration-100 shadow-md"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${theme.accentHex}, #ffffff)`,
                    boxShadow: `0 0 10px ${theme.accentHex}80`,
                  }}
                />
              </div>
              <span className="w-8 select-none">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Modals */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-16 md:w-20 accent-amber-400 h-1 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {/* Queue Toggle */}
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isQueueOpen
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Track Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Fullscreen Immersion Mode */}
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fullscreen Vinyl Immersion"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
