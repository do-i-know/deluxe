'use client';

import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const SupabaseConfigStatus: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const handleCopySchema = () => {
    navigator.clipboard.writeText(
      `-- Run supabase_schema.sql located in your project root inside Supabase Dashboard -> SQL Editor`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-amber-500/25 bg-[#170a06]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Supabase & Google Cloud Setup</h3>
          <p className="text-xs text-amber-200/60">
            PostgreSQL Database, Storage Buckets ('songs', 'covers'), and Google OAuth
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 ${
          isConfigured
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}
      >
        {isConfigured ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm">
            {isConfigured
              ? 'Supabase Connection Active'
              : 'Running in Local / Zero-Configuration Demo Mode'}
          </p>
          <p className="text-white/70 leading-relaxed">
            {isConfigured
              ? 'Your application is actively querying Supabase PostgreSQL and uploading audio directly to the Supabase Storage bucket.'
              : 'Songs and metadata are currently handled seamlessly via local storage and seed assets. Add your Supabase project credentials in .env.local to activate the live cloud backend.'}
          </p>
        </div>
      </div>

      {/* Step by Step Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
            Database Schema
          </div>
          <p className="text-white/60 text-[11px] leading-relaxed">
            Execute the provided <code className="text-amber-300">supabase_schema.sql</code> file inside your Supabase Project SQL Editor. It sets up tables, RLS policies, and creates buckets.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
            Storage Buckets
          </div>
          <p className="text-white/60 text-[11px] leading-relaxed">
            Ensure public buckets named <code className="text-amber-300">songs</code> (for MP3/audio) and <code className="text-amber-300">covers</code> (for artwork) exist in Supabase Storage.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
            Google Cloud Auth
          </div>
          <p className="text-white/60 text-[11px] leading-relaxed">
            In Supabase Dashboard → Authentication → Providers → Google: Enter your Google Cloud Client ID & Secret to enable 1-click Google Sign In.
          </p>
        </div>
      </div>

      {/* SQL Script Quick Access */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-white block">SQL Schema Migration Script</span>
          <span className="text-[11px] text-white/50 block">
            File: <code className="text-amber-300">deluxe-music/supabase_schema.sql</code> (Tables, RLS & Buckets)
          </span>
        </div>

        <button
          onClick={handleCopySchema}
          className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied Reference!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy SQL Script Path</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
