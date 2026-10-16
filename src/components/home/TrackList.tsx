'use client';

import React from 'react';
import { Play, Pause, Heart, Clock, Music, Plus } from 'lucide-react';
import { Song } from '@/lib/db/types';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export const TrackList: React.FC<{
  tracks: Song[];
}> = ({ tracks }) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    favorites,
    toggleFavorite,
    addToQueue,
  } = useAudioPlayer();

  const formatDuration = (secs: number) => {
    if (!secs) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#160805]/50 backdrop-blur-md">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/40">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-6 sm:col-span-5">Title & Artist</div>
        <div className="hidden sm:block sm:col-span-3">Album</div>
        <div className="hidden md:block md:col-span-2 text-right">Plays</div>
        <div className="col-span-5 sm:col-span-3 md:col-span-1 flex justify-end items-center pr-2">
          <Clock className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isLiked = favorites.includes(track.id);

          return (
            <div
              key={track.id}
              onClick={() => {
                if (isCurrent) {
                  togglePlayPause();
                } else {
                  playTrack(track, tracks);
                }
              }}
              className={`grid grid-cols-12 gap-3 px-4 py-3 items-center group cursor-pointer transition-colors ${
                isCurrent
                  ? 'bg-amber-500/15 text-amber-200'
                  : 'hover:bg-white/5 text-white/80'
              }`}
            >
              {/* Index or Play icon */}
              <div className="col-span-1 flex items-center justify-center">
                <span
                  className={`text-xs font-mono text-white/40 group-hover:hidden ${
                    isCurrent ? 'hidden' : 'block'
                  }`}
                >
                  {idx + 1}
                </span>
                <button
                  type="button"
                  className={`p-1 rounded-full text-amber-400 group-hover:flex items-center justify-center ${
                    isCurrent ? 'flex' : 'hidden'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
              </div>

              {/* Title & Artist */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                <img
                  src={track.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80'}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-amber-300 font-bold' : 'text-white group-hover:text-amber-200'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-white/50 truncate">{track.artist}</p>
                </div>
              </div>

              {/* Album */}
              <div className="hidden sm:block sm:col-span-3 text-xs text-white/50 truncate">
                {track.album || 'Single'}
              </div>

              {/* Plays */}
              <div className="hidden md:block md:col-span-2 text-right text-xs font-mono text-white/40">
                {track.plays_count ? track.plays_count.toLocaleString() : '0'}
              </div>

              {/* Duration & Actions */}
              <div className="col-span-5 sm:col-span-3 md:col-span-1 flex items-center justify-end gap-2 pr-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="p-1 rounded-full text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isLiked ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(track);
                  }}
                  className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Add to queue"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono text-white/40 w-10 text-right">
                  {formatDuration(track.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
