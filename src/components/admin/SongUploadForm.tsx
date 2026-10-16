'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Music,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { uploadSongAudio, uploadCoverImage } from '@/lib/supabase/storage';
import { createSong } from '@/lib/db/songs';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';

const GENRE_PRESETS = [
  'Retro Ambient',
  'Cyber Sci-Fi',
  'Vintage Beats',
  'Drum & Bass',
  'Retro Lounge',
  'Bollywood 2000s',
  'Electronic',
];

export const SongUploadForm: React.FC<{
  onUploadSuccess: () => void;
}> = ({ onUploadSuccess }) => {
  const { session } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('Single Release');
  const [genre, setGenre] = useState('Retro Ambient');
  const [isFeatured, setIsFeatured] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Handle audio file selection and automatically extract duration
  const handleAudioChange = (file: File) => {
    setAudioFile(file);
    // Autofill title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    // Extract exact duration from file using browser Audio object
    try {
      const audioUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(audioUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        if (!isNaN(tempAudio.duration) && tempAudio.duration > 0) {
          setDuration(Math.round(tempAudio.duration));
        }
        URL.revokeObjectURL(audioUrl);
      });
    } catch {
      setDuration(180);
    }
  };

  // Handle cover image selection and preview
  const handleCoverChange = (file: File) => {
    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setStatusMsg({ type: 'error', text: 'Please select an audio file (.mp3, .wav, etc.)' });
      return;
    }
    if (!title || !artist) {
      setStatusMsg({ type: 'error', text: 'Title and Artist are required.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMsg(null);

      // Step 1: Upload audio file to Supabase Storage bucket 'songs'
      setUploadProgress('Uploading audio file to Supabase Storage bucket...');
      const audioResult = await uploadSongAudio(audioFile);
      if (audioResult.error) {
        throw new Error(audioResult.error);
      }

      // Step 2: Upload cover image (if provided) to Supabase Storage bucket 'covers'
      let coverUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
      if (coverFile) {
        setUploadProgress('Uploading cover artwork to Supabase Storage...');
        const coverResult = await uploadCoverImage(coverFile);
        if (coverResult.url) {
          coverUrl = coverResult.url;
        }
      }

      // Step 3: Insert song metadata record into Supabase PostgreSQL DB via secured API
      setUploadProgress('Saving track metadata to Supabase DB...');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const songPayload = {
        title,
        artist,
        album: album || 'Single Release',
        genre: genre || 'Retro Ambient',
        duration: duration || 180,
        song_url: audioResult.url,
        cover_url: coverUrl,
        storage_path: audioResult.path,
        is_featured: isFeatured,
      };

      try {
        const res = await fetch('/api/songs', {
          method: 'POST',
          headers,
          body: JSON.stringify(songPayload),
        });
        const resData = await res.json();
        if (!resData.success) {
          console.warn('API route failed, trying direct DB fallback:', resData.error);
          await createSong(songPayload);
        }
      } catch {
        await createSong(songPayload);
      }

      setStatusMsg({
        type: 'success',
        text: `Track "${title}" successfully uploaded to Supabase Storage & Database!`,
      });

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff'],
      });

      // Reset form
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview('');
      setTitle('');
      setArtist('');
      setAlbum('Single Release');
      setGenre('Retro Ambient');
      setIsFeatured(false);

      onUploadSuccess();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed. Check your Supabase configuration.',
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="rounded-3xl border border-amber-500/25 bg-[#170a06]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Upload New Audio Track</h3>
          <p className="text-xs text-amber-200/60">
            Audio file is stored directly in Supabase Storage bucket & registered in PostgreSQL DB
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Dropzones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audio Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              Song Audio File (.mp3, .wav, .m4a) *
            </label>
            <div
              onClick={() => audioInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                audioFile
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-white/20 hover:border-amber-400/50 bg-white/5 hover:bg-white/10'
              }`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleAudioChange(e.target.files[0]);
                }}
              />
              {audioFile ? (
                <>
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-sm font-bold text-emerald-300 truncate max-w-xs">
                    {audioFile.name}
                  </span>
                  <span className="text-xs text-white/50 font-mono mt-1">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB • {duration}s detected
                  </span>
                  <span className="text-[11px] text-amber-300 mt-2 underline">Click to change</span>
                </>
              ) : (
                <>
                  <Music className="w-8 h-8 text-amber-400/80 mb-2" />
                  <span className="text-sm font-semibold text-white">Choose Audio File</span>
                  <span className="text-xs text-white/40 mt-1">MP3, WAV or M4A (up to 50MB)</span>
                </>
              )}
            </div>
          </div>

          {/* Cover Art Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              Cover Artwork (.jpg, .png, .webp)
            </label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden ${
                coverPreview
                  ? 'border-amber-500/60'
                  : 'border-white/20 hover:border-amber-400/50 bg-white/5 hover:bg-white/10'
              }`}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCoverChange(e.target.files[0]);
                }}
              />
              {coverPreview ? (
                <div className="flex items-center gap-4 text-left">
                  <img
                    src={coverPreview}
                    alt="cover preview"
                    className="w-16 h-16 rounded-xl object-cover border border-amber-400/50 shadow-md"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Artwork Attached</span>
                    <span className="text-[11px] text-white/50 block mt-0.5">
                      {coverFile?.name}
                    </span>
                    <span className="text-[11px] text-amber-300 underline mt-1 block">
                      Click to replace
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-amber-400/80 mb-2" />
                  <span className="text-sm font-semibold text-white">Choose Cover Artwork</span>
                  <span className="text-xs text-white/40 mt-1">
                    Square 1:1 image recommended (optional)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Track Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Midnight Monsoon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Artist Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Deluxe Studio Orchestra"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Album Name</label>
            <input
              type="text"
              placeholder="e.g. 2000s Memories Vol. 1"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Genre Selection & Featured Checkbox */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-2">Select Genre</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {GENRE_PRESETS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  genre === g
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or enter custom genre..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30"
          />
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <input
            id="featured-checkbox"
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
          <label htmlFor="featured-checkbox" className="text-xs text-white/80 cursor-pointer select-none">
            <strong className="text-amber-300">Feature on Home Carousel:</strong> Pin this track to the top "Heavy Rotation" section.
          </label>
        </div>

        {/* Status & Progress Feedback */}
        {uploading && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>{uploadProgress || 'Uploading track to Supabase...'}</span>
          </div>
        )}

        {statusMsg && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !audioFile}
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving to Supabase Storage...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Publish Track to Deluxe Library</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
