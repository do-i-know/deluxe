'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Edit2,
  Star,
  Search,
  ExternalLink,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Song } from '@/lib/db/types';
import { deleteSong, updateSong } from '@/lib/db/songs';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useAuth } from '@/context/AuthContext';

export const SongManageTable: React.FC<{
  songs: Song[];
  onRefresh: () => void;
}> = ({ songs, onRefresh }) => {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();

  const filtered = songs.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (song: Song) => {
    if (!confirm(`Are you sure you want to delete "${song.title}" from Database & Storage?`)) {
      return;
    }

    try {
      setDeletingId(song.id);
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const query = song.storage_path ? `?storage_path=${encodeURIComponent(song.storage_path)}` : '';
      const res = await fetch(`/api/songs/${song.id}${query}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        console.warn('API delete fallback to local:', data.error);
        await deleteSong(song.id, song.storage_path);
      }
      onRefresh();
    } catch (err) {
      console.error('Delete song error:', err);
      await deleteSong(song.id, song.storage_path);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;

    try {
      setLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/songs/${editingSong.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: editingSong.title,
          artist: editingSong.artist,
          album: editingSong.album,
          genre: editingSong.genre,
          is_featured: editingSong.is_featured,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        console.warn('API update fallback to local:', data.error);
        await updateSong(editingSong.id, {
          title: editingSong.title,
          artist: editingSong.artist,
          album: editingSong.album,
          genre: editingSong.genre,
          is_featured: editingSong.is_featured,
        });
      }

      setEditingSong(null);
      onRefresh();
    } catch (err) {
      console.error('Update song error:', err);
      await updateSong(editingSong.id, {
        title: editingSong.title,
        artist: editingSong.artist,
        album: editingSong.album,
        genre: editingSong.genre,
        is_featured: editingSong.is_featured,
      });
      setEditingSong(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-3xl border border-amber-500/25 bg-[#170a06]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Audio Tracks Management</h3>
          <p className="text-xs text-amber-200/60">
            Preview, modify metadata, or delete audio files from Supabase Storage & Database
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-white/40 uppercase font-mono tracking-wider">
              <th className="py-3 px-3">Track & Artwork</th>
              <th className="py-3 px-3">Genre</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Plays</th>
              <th className="py-3 px-3 text-center">Featured</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((song) => {
              const isCurrent = currentTrack?.id === song.id;

              return (
                <tr key={song.id} className="hover:bg-white/5 transition-colors">
                  {/* Track Title, Artist, & Play button */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (isCurrent) {
                            togglePlayPause();
                          } else {
                            playTrack(song, songs);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
                        title={isCurrent && isPlaying ? 'Pause track' : 'Preview track'}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <img
                        src={song.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop&q=80'}
                        alt={song.title}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />

                      <div className="min-w-0 max-w-xs">
                        <span className="font-bold text-white block truncate">{song.title}</span>
                        <span className="text-[11px] text-white/50 block truncate">
                          {song.artist} • {song.album}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Genre */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-amber-300 border border-white/10 text-[10px]">
                      {song.genre}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-3 font-mono text-white/60">
                    {formatDuration(song.duration)}
                  </td>

                  {/* Plays */}
                  <td className="py-3 px-3 font-mono text-white/60">
                    {song.plays_count ? song.plays_count.toLocaleString() : 0}
                  </td>

                  {/* Featured */}
                  <td className="py-3 px-3 text-center">
                    {song.is_featured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-white/30 text-[11px]">No</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingSong(song)}
                        className="p-1.5 rounded-lg text-white/60 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Edit metadata"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(song)}
                        disabled={deletingId === song.id}
                        className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete track"
                      >
                        {deletingId === song.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Song Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl p-6 bg-[#1e0a06] border border-amber-500/40 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="font-bold text-white text-base">Edit Track Details</h4>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingSong.title}
                  onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={editingSong.artist}
                  onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Album</label>
                <input
                  type="text"
                  value={editingSong.album}
                  onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Genre</label>
                <input
                  type="text"
                  value={editingSong.genre}
                  onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="modal-featured"
                  type="checkbox"
                  checked={Boolean(editingSong.is_featured)}
                  onChange={(e) =>
                    setEditingSong({ ...editingSong, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="modal-featured" className="text-xs text-white/80 select-none">
                  Featured on Heavy Rotation Carousel
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2 rounded-full bg-white/5 text-white text-xs font-semibold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
