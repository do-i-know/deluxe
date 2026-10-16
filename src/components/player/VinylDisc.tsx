'use client';

import React from 'react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface VinylDiscProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  coverUrl?: string;
  onClick?: () => void;
  className?: string;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  size = 'md',
  coverUrl,
  onClick,
  className = '',
}) => {
  const { isPlaying, currentTrack, togglePlayPause } = useAudioPlayer();

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-56 h-56 md:w-72 md:h-72',
  };

  const holeSizeClasses = {
    sm: 'w-2 h-2 -ml-1 -mt-1',
    md: 'w-2.5 h-2.5 -ml-1.25 -mt-1.25',
    lg: 'w-4 h-4 -ml-2 -mt-2',
    xl: 'w-8 h-8 -ml-4 -mt-4',
  };

  const activeCover = coverUrl || currentTrack?.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={onClick || togglePlayPause}
      title={isPlaying ? 'Pause Vinyl' : 'Spin Vinyl'}
      className={`relative rounded-full cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 flex-shrink-0 group ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: isPlaying
          ? '0 0 25px rgba(245, 158, 11, 0.45), inset 0 0 10px rgba(0,0,0,0.8)'
          : '0 4px 15px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Vinyl Outer Rim & Grooves */}
      <div
        className={`w-full h-full rounded-full overflow-hidden p-0.5 relative transition-all duration-700 ${
          isPlaying ? 'animate-[spin_3.5s_linear_infinite]' : ''
        }`}
        style={{
          background: 'radial-gradient(circle, #2a110a 0%, #150604 70%, #0d0302 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
        }}
      >
        {/* Subtle Vinyl Grooves */}
        <div className="absolute inset-1 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute inset-2.5 rounded-full border border-white/5 pointer-events-none" />
        {size === 'xl' && (
          <>
            <div className="absolute inset-5 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
          </>
        )}

        {/* Center Label / Cover Artwork */}
        <div
          className="w-full h-full rounded-full bg-cover bg-center overflow-hidden transition-all duration-300"
          style={{ backgroundImage: `url(${activeCover})` }}
        />

        {/* Shiny Glassy Reflection Overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Center Spindle Hole */}
      <div
        className={`absolute top-1/2 left-1/2 rounded-full bg-[#0a0504] border border-amber-400/80 pointer-events-none z-10 shadow-inner ${holeSizeClasses[size]}`}
      />
    </div>
  );
};
