'use client';

import React from 'react';
import { Play, Pause, Heart, Disc, Music } from 'lucide-react';
import { Song } from '@/lib/db/types';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export const SongCard: React.FC<{
  song: Song;
  songList: Song[];
}> = ({ song, songList }) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, favorites, toggleFavorite } =
    useAudioPlayer();

  const isCurrent = currentTrack?.id === song.id;
  const isLiked = favorites.includes(song.id);

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(song, songList);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isCurrent
          ? 'bg-[#240e08] border-amber-500/60 shadow-[0_10px_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
          : 'bg-[#180a06]/70 hover:bg-[#200d08] border-white/10 hover:border-amber-500/30 hover:shadow-xl'
      }`}
    >
      {/* Vinyl Disc Slide-Out effect on hover */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3.5 bg-neutral-900 shadow-md">
        {/* Sliding Vinyl Record behind sleeve */}
        <div
          className={`absolute top-2 right-0 w-full h-full rounded-full transition-transform duration-500 pointer-events-none opacity-80 ${
            isCurrent && isPlaying
              ? 'translate-x-6 animate-[spin_4s_linear_infinite]'
              : 'translate-x-0 group-hover:translate-x-5'
          }`}
          style={{
            background: 'radial-gradient(circle, #2d0f07 0%, #150604 70%, #0a0302 100%)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-black border border-amber-400" />
        </div>

        {/* Cover Art Image */}
        <img
          src={song.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'}
          alt={song.title}
          className="relative z-10 w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover / Active Play Button Overlay */}
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Genre Badge */}
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-amber-500/30">
          {song.genre || 'Retro'}
        </span>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song.id);
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 transition-colors cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isLiked ? 'fill-rose-500 text-rose-500' : 'text-white/60 hover:text-white'
            }`}
          />
        </button>
      </div>

      {/* Song Details */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-bold truncate transition-colors ${
              isCurrent ? 'text-amber-300' : 'text-white group-hover:text-amber-200'
            }`}
          >
            {song.title}
          </h3>
          <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
        </div>

        <span className="text-[11px] font-mono text-white/40 flex-shrink-0 mt-0.5">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
};
