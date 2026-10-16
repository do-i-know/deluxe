'use client';

import React from 'react';
import { Search, Heart, LayoutGrid, List } from 'lucide-react';

interface GenreFilterProps {
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  favoritesCount: number;
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  genres,
  selectedGenre,
  onSelectGenre,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  favoritesCount,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search track, artist, album..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full bg-[#180a06] border border-amber-500/20 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 text-xs text-white/40 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Genre Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
        <button
          onClick={() => onSelectGenre('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedGenre === 'all'
              ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
          }`}
        >
          All Tracks
        </button>

        <button
          onClick={() => onSelectGenre('favorites')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedGenre === 'favorites'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
          }`}
        >
          <Heart className="w-3 h-3 fill-current" />
          <span>Liked ({favoritesCount})</span>
        </button>

        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onSelectGenre(g)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedGenre === g
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* View Switcher (Grid vs List) */}
      <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#180a06] border border-white/10">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            viewMode === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-white/40 hover:text-white'
          }`}
          title="Grid view"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            viewMode === 'list' ? 'bg-amber-500/20 text-amber-300' : 'text-white/40 hover:text-white'
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
