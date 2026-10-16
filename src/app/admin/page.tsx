'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  UploadCloud,
  ListMusic,
  Database,
  ArrowLeft,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { SongUploadForm } from '@/components/admin/SongUploadForm';
import { SongManageTable } from '@/components/admin/SongManageTable';
import { SupabaseConfigStatus } from '@/components/admin/SupabaseConfigStatus';
import { FloatingPlayer } from '@/components/player/FloatingPlayer';
import { AmbientBeams } from '@/components/ui/AceternityEffects';
import { Song } from '@/lib/db/types';
import { DEFAULT_TRACKS } from '@/lib/defaultTracks';

export default function AdminPage() {
  const { user, profile, session, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'supabase'>('upload');
  const [songs, setSongs] = useState<Song[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Check if user is already unlocked via admin role in Supabase
  useEffect(() => {
    if (isAdmin) {
      setIsUnlocked(true);
    }
  }, [isAdmin]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success && data.songs) {
        setSongs(data.songs);
      }
    } catch {
      setSongs(DEFAULT_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchSongs();
    }
  }, [isUnlocked]);

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasskey.trim()) return;

    try {
      setVerifying(true);
      setPasskeyError('');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          passkey: adminPasskey.trim(),
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        setPasskeyError('');
      } else {
        setPasskeyError(data.error || 'Invalid administrator passkey.');
      }
    } catch {
      setPasskeyError('Verification server unavailable.');
    } finally {
      setVerifying(false);
    }
  };

  const totalPlays = songs.reduce((sum, s) => sum + (s.plays_count || 0), 0);
  const featuredCount = songs.filter((s) => s.is_featured).length;

  return (
    <div className="relative min-h-screen bg-[#120806] text-white selection:bg-amber-500/30 pb-32">
      <AmbientBeams />

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-xl border-b border-amber-500/20 bg-[#120806]/85">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Music Player</span>
          </Link>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              Studio Admin Panel
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Admin Mode Active
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!isUnlocked ? (
          /* Production Secured Locked Gate Screen */
          <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#1c0a07] border border-amber-500/30 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Admin Studio Restricted</h2>
            <p className="text-xs text-amber-200/60 mt-1.5 leading-relaxed">
              This panel is restricted to authorized administrators. Access requires a Supabase profile with the <code className="text-amber-400 font-mono">admin</code> role.
            </p>

            {user && profile?.role !== 'admin' && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                Signed in as <strong>{user.email}</strong> (Role: <span className="font-mono text-white">{profile?.role || 'user'}</span>). Contact the project owner to grant admin role in Supabase.
              </div>
            )}

            <form onSubmit={handlePasskeySubmit} className="mt-6 space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  placeholder="Master Admin Passkey"
                  value={adminPasskey}
                  onChange={(e) => setAdminPasskey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {passkeyError && (
                <p className="text-xs text-rose-400 font-medium">{passkeyError}</p>
              )}

              <button
                type="submit"
                disabled={verifying || !adminPasskey.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-sm shadow-md hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Passkey...</span>
                  </>
                ) : (
                  <span>Verify & Unlock Studio</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Link
                href="/"
                className="text-xs text-amber-300/80 hover:text-amber-200 underline cursor-pointer"
              >
                ← Return to Music Player
              </Link>
            </div>
          </div>
        ) : (
          /* Unlocked Admin Portal */
          <div>
            {/* System Stats Overview */}
            <AdminStatsCards
              totalSongs={songs.length}
              totalPlays={totalPlays}
              featuredCount={featuredCount}
              isSupabaseConnected={true}
              onRefresh={fetchSongs}
            />

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Song to Supabase</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Manage Library ({songs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('supabase')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'supabase'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Supabase & Google Cloud Setup</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'upload' && <SongUploadForm onUploadSuccess={fetchSongs} />}
            {activeTab === 'manage' && <SongManageTable songs={songs} onRefresh={fetchSongs} />}
            {activeTab === 'supabase' && <SupabaseConfigStatus />}
          </div>
        )}
      </main>

      {/* Floating Audio Player */}
      <FloatingPlayer />
    </div>
  );
}
