'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { HeaderNav } from '@/components/navbar/HeaderNav';
import { HeroBanner } from '@/components/home/HeroBanner';
import { SongCard } from '@/components/home/SongCard';
import { TrackList } from '@/components/home/TrackList';
import { GenreFilter } from '@/components/home/GenreFilter';
import { LoungeChatModal } from '@/components/home/LoungeChatModal';
import { FloatingPlayer } from '@/components/player/FloatingPlayer';
import { TrackQueueDrawer } from '@/components/player/TrackQueueDrawer';
import { FullscreenVisualizer } from '@/components/player/FullscreenVisualizer';
import { AmbientBeams } from '@/components/ui/AceternityEffects';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useSongTheme } from '@/hooks/useSongTheme';
import { Song } from '@/lib/db/types';
import { DEFAULT_TRACKS } from '@/lib/defaultTracks';
import { Sparkles, Radio, Flame, Disc } from 'lucide-react';

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { favorites, setTrackQueue, currentTrack } = useAudioPlayer();
  const theme = useSongTheme(currentTrack);

  // Load songs from Next.js API / Supabase DB
  const loadSongs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success && data.songs && data.songs.length > 0) {
        setSongs(data.songs);
        setTrackQueue(data.songs);
      } else {
        setSongs(DEFAULT_TRACKS);
        setTrackQueue(DEFAULT_TRACKS);
      }
    } catch {
      setSongs(DEFAULT_TRACKS);
      setTrackQueue(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  // Distinct genres from songs
  const genres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      if (s.genre) set.add(s.genre);
    });
    return Array.from(set);
  }, [songs]);

  // Filtered tracks
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      // Genre filter
      if (selectedGenre === 'favorites') {
        if (!favorites.includes(s.id)) return false;
      } else if (selectedGenre !== 'all') {
        if (s.genre?.toLowerCase() !== selectedGenre.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesArtist = s.artist.toLowerCase().includes(q);
        const matchesAlbum = s.album?.toLowerCase().includes(q);
        const matchesGenre = s.genre?.toLowerCase().includes(q);
        return matchesTitle || matchesArtist || matchesAlbum || matchesGenre;
      }

      return true;
    });
  }, [songs, selectedGenre, searchQuery, favorites]);

  // Featured tracks for top carousel
  const featuredTracks = useMemo(() => {
    return songs.filter((s) => s.is_featured);
  }, [songs]);

  return (
    <div
      className="relative min-h-screen text-white selection:bg-amber-500/30 pb-32 overflow-x-hidden transition-colors duration-1000"
      style={{
        backgroundColor: theme.darkBg,
        backgroundImage: `radial-gradient(ellipse 90% 60% at 50% -10%, ${theme.primary} 0%, transparent 75%)`,
      }}
    >
      {/* Aceternity Ambient Glow Beams */}
      <AmbientBeams />

      {/* Navigation Header */}
      <HeaderNav onOpenChat={() => setIsChatOpen(true)} />

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Hero Banner with Running Song details, Spotify Dynamic Colors and Hairline Waveform */}
        <HeroBanner onOpenChat={() => setIsChatOpen(true)} />

        {/* Featured Section */}
        {featuredTracks.length > 0 && selectedGenre === 'all' && !searchQuery && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" style={{ color: theme.accentHex }} />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Heavy Rotation
                </h2>
              </div>
              <span className="text-xs font-mono" style={{ color: theme.accentHex }}>
                Staff Curated Tracks
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {featuredTracks.map((song) => (
                <SongCard key={song.id} song={song} songList={featuredTracks} />
              ))}
            </div>
          </section>
        )}

        {/* Library Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                All Tracks & Archives
              </h2>
            </div>
            <span className="text-xs text-white/40 font-mono">
              {filteredSongs.length} track{filteredSongs.length === 1 ? '' : 's'} found
            </span>
          </div>

          {/* Filter, Search & View Controls */}
          <GenreFilter
            genres={genres}
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            favoritesCount={favorites.length}
          />

          {/* Tracks Display */}
          {filteredSongs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#180a06]/60 backdrop-blur-sm">
              <Disc className="w-12 h-12 text-amber-400/50 mx-auto mb-3 animate-spin" />
              <h3 className="text-lg font-bold text-white">No tracks match your filter</h3>
              <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                Try searching for another keyword or switch genres. You can also upload new tracks in the Admin Studio!
              </p>
              <button
                onClick={() => {
                  setSelectedGenre('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} songList={filteredSongs} />
              ))}
            </div>
          ) : (
            <TrackList tracks={filteredSongs} />
          )}
        </section>
      </main>

      {/* Floating Spotify-Grade Player Bar */}
      <FloatingPlayer />

      {/* Slide-over Queue Drawer */}
      <TrackQueueDrawer />

      {/* Fullscreen Vinyl Immersion Visualizer */}
      <FullscreenVisualizer />

      {/* Deluxe Live Listener Lounge Modal */}
      <LoungeChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
