'use client';

import React from 'react';
import { X, Play, Trash2, Shuffle, Music } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export const TrackQueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    isQueueOpen,
    setIsQueueOpen,
    playTrack,
    toggleShuffle,
  } = useAudioPlayer();

  if (!isQueueOpen) return null;

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-[#180a06]/95 border-l border-amber-500/30 p-5 flex flex-col shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1c0805 0%, #0d0402 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Current Queue</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Shuffle queue"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsQueueOpen(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30 flex items-center gap-3">
            <img
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover shadow-md flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                Now Playing
                {isPlaying && (
                  <span className="flex gap-0.5 items-end h-2.5">
                    <span className="w-0.5 bg-amber-400 h-2 animate-[pulse_0.6s_ease-in-out_infinite]" />
                    <span className="w-0.5 bg-amber-400 h-3 animate-[pulse_0.8s_ease-in-out_infinite]" />
                    <span className="w-0.5 bg-amber-400 h-1.5 animate-[pulse_0.5s_ease-in-out_infinite]" />
                  </span>
                )}
              </span>
              <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-xs text-amber-200/60 truncate">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex items-center justify-between mt-2 mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          <span>Up Next</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {queue.map((track, idx) => {
            const isCurrent = track.id === currentTrack?.id;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track)}
                className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 group ${
                  isCurrent
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                    : 'hover:bg-white/5 text-white/80'
                }`}
              >
                <span className="text-xs font-mono text-white/40 w-4 text-center">
                  {idx + 1}
                </span>

                <img
                  src={track.cover_url}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold truncate group-hover:text-amber-300 transition-colors">
                    {track.title}
                  </h5>
                  <p className="text-[11px] text-white/40 truncate">{track.artist}</p>
                </div>

                <span className="text-xs font-mono text-white/40 flex-shrink-0">
                  {formatDuration(track.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
