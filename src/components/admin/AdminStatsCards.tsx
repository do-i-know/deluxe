'use client';

import React, { useState } from 'react';
import { Music, PlayCircle, Star, Database, HardDrive, RefreshCw, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminStatsCardsProps {
  totalSongs: number;
  totalPlays: number;
  featuredCount: number;
  isSupabaseConnected: boolean;
  onRefresh: () => void;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({
  totalSongs,
  totalPlays,
  featuredCount,
  isSupabaseConnected,
  onRefresh,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706'],
        });
        onRefresh();
        setTimeout(() => setSeedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to seed:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Songs Card */}
      <div className="p-5 rounded-2xl bg-[#1a0a07] border border-amber-500/25 relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-white/50 tracking-wider">
            Total Library
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Music className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{totalSongs}</span>
          <span className="text-xs text-amber-300/70">Audio Tracks</span>
        </div>
        <p className="mt-2 text-[11px] text-white/40">Stored in Supabase DB & Buckets</p>
      </div>

      {/* Total Plays Card */}
      <div className="p-5 rounded-2xl bg-[#1a0a07] border border-amber-500/25 relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-white/50 tracking-wider">
            Total Streams
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <PlayCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {totalPlays.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-400">Plays</span>
        </div>
        <p className="mt-2 text-[11px] text-white/40">Across all listeners and radios</p>
      </div>

      {/* Featured Songs Card */}
      <div className="p-5 rounded-2xl bg-[#1a0a07] border border-amber-500/25 relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-white/50 tracking-wider">
            Heavy Rotation
          </span>
          <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Star className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{featuredCount}</span>
          <span className="text-xs text-yellow-300/80">Featured Tracks</span>
        </div>
        <p className="mt-2 text-[11px] text-white/40">Pinned to Hero Carousel</p>
      </div>

      {/* Supabase Status & Quick Seed Card */}
      <div className="p-5 rounded-2xl bg-[#1a0a07] border border-amber-500/25 relative overflow-hidden shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-mono text-white/50 tracking-wider">
            Supabase Status
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isSupabaseConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-sm font-bold text-white">
            {isSupabaseConnected ? 'Supabase Live' : 'Demo Local Mode'}
          </span>
        </div>

        <div className="mt-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {seedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Default Tracks Seeded!</span>
              </>
            ) : seeding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Seeding Library...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>Seed 5 Initial Tracks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
