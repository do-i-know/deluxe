'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    loginAsDemoAdmin,
    loginAsDemoUser,
    isConfigured,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          onClose();
        }
      } else {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) {
          setErrorMsg(error.message);
        } else {
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{
          background: 'radial-gradient(circle at top, #2d0f08 0%, #160604 60%, #0d0302 100%)',
        }}
      >
        {/* Glow ambient light */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'signin' ? 'Welcome to Deluxe Studio' : 'Create an Account'}
          </h3>
          <p className="text-xs text-amber-200/60 mt-1">
            Supabase Auth & Google Cloud Integration
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="mb-4">
          <GoogleSignInButton onSuccess={onClose} />
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/15"></div>
          <span className="flex-shrink mx-4 text-[11px] font-mono uppercase tracking-wider text-white/40">
            or with email
          </span>
          <div className="flex-grow border-t border-white/15"></div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Listener"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 text-center font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-amber-300 hover:text-amber-200 underline cursor-pointer"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Demo Mode Quick Access Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
          <span className="text-[10px] text-white/40 uppercase tracking-wider text-center font-mono">
            ⚡ Quick Test Logins
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                loginAsDemoAdmin();
                onClose();
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Studio Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loginAsDemoUser();
                onClose();
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Listener Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
