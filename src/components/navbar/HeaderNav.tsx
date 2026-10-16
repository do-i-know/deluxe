'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Disc,
  Shield,
  User,
  LogOut,
  Radio,
  MessageSquare,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AtmosphereToggle } from '../player/AtmosphereToggle';
import { AuthModal } from '../auth/AuthModal';

export const HeaderNav: React.FC<{
  onOpenChat?: () => void;
}> = ({ onOpenChat }) => {
  const { user, profile, isAdmin, isConfigured, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-3 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-xl border-b border-amber-500/20 bg-[#120806]/80 transition-all">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:rotate-45 transition-transform duration-300">
            <Disc className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight group-hover:text-amber-300 transition-colors">
                DELUXE MUSIC
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold hidden sm:inline-block">
                High-Fidelity
              </span>
            </div>
            <p className="text-[10px] text-white/40 tracking-wider -mt-1 hidden md:block">
              Web Audio & Music Streaming Studio
            </p>
          </div>
        </Link>

        {/* Center / Action Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ambient Rain Atmosphere Toggle */}
          <AtmosphereToggle />

          {/* Lounge Chat / Community Button */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold bg-[#180a07]/80 hover:bg-amber-500/20 border border-white/15 hover:border-amber-400/50 text-white/80 hover:text-white backdrop-blur-xl transition-all cursor-pointer"
              title="Open Live Listener Lounge"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Lounge</span>
            </button>
          )}

          {/* Supabase Status Indicator Pill */}
          <div className="relative">
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold border backdrop-blur-xl transition-all cursor-pointer ${
                isConfigured
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}
              title="Supabase Database & Storage status"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="hidden md:inline">
                {isConfigured ? 'Supabase Live' : 'Demo Storage'}
              </span>
            </button>

            {/* Supabase Status Popover */}
            {showStatusPopover && (
              <div className="absolute right-0 top-11 z-50 w-72 p-4 rounded-2xl bg-[#1c0805]/95 border border-amber-500/30 shadow-2xl backdrop-blur-2xl text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-400" />
                    Supabase Infrastructure
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isConfigured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isConfigured ? 'CONNECTED' : 'LOCAL / DEMO'}
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  {isConfigured
                    ? 'Connected to your Supabase PostgreSQL Database, Auth & Storage Bucket (songs).'
                    : 'Running in zero-friction demo mode with preloaded tracks & local uploads. To connect your Supabase project, add your URL and Key to .env.local.'}
                </p>
                <div className="pt-1 flex justify-between items-center text-[10px] text-amber-400/80">
                  <Link href="/admin" className="underline hover:text-amber-200">
                    Open Admin Settings →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Admin Studio Button - Hidden for regular users in production, only rendered if profile role is admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 border border-amber-500/50 text-amber-200 backdrop-blur-xl shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
              title="Open Admin Panel to upload and manage songs"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin Studio</span>
            </Link>
          )}

          {/* User Profile / Sign In Pill */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full py-1 pl-1 pr-2.5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/90 font-medium max-w-[80px] sm:max-w-[120px] truncate">
                {profile?.full_name || user.email?.split('@')[0]}
              </span>
              <button
                onClick={signOut}
                className="ml-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
