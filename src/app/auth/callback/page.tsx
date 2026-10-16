'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Disc, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        if (!supabase) {
          // In demo mode or if supabase is not initialized
          setTimeout(() => {
            if (isMounted) router.replace('/');
          }, 800);
          return;
        }

        // 1. Check for errors in the URL hash or query params
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1));
          const desc = params.get('error_description') || params.get('error') || 'Authentication failed';
          if (isMounted) {
            setStatus('error');
            setErrorMessage(desc);
          }
          return;
        }

        if (searchParams.get('error')) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(searchParams.get('error_description') || 'Authentication failed');
          }
          return;
        }

        // 2. Handle PKCE code flow (?code=...)
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            if (isMounted) {
              setStatus('error');
              setErrorMessage(error.message);
            }
            return;
          }
        }

        // 3. Handle Implicit Hash flow (#access_token=...)
        // Supabase client automatically extracts tokens from hash on init
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) {
            setStatus('error');
            setErrorMessage(sessionError.message);
          }
          return;
        }

        // If session is already available or wait for auth state change
        if (session) {
          if (isMounted) {
            setStatus('success');
            setTimeout(() => {
              router.replace('/');
            }, 600);
          }
          return;
        }

        // Listen for sign in event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === 'SIGNED_IN' || newSession) {
            if (isMounted) {
              setStatus('success');
              setTimeout(() => {
                router.replace('/');
              }, 600);
            }
          }
        });

        // Fallback timeout in case onAuthStateChange is delayed
        const timer = setTimeout(() => {
          if (isMounted) {
            subscription.unsubscribe();
            router.replace('/');
          }
        }, 2000);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      } catch (err: unknown) {
        console.error('Auth callback handling exception:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Unknown authentication error');
        }
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at center, #2e0f08 0%, #150604 60%, #0a0302 100%)',
      }}
    >
      <div className="relative w-full max-w-sm rounded-3xl p-8 border border-amber-500/30 bg-[#1a0a07]/90 text-center shadow-2xl backdrop-blur-2xl">
        {/* Glow Light */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            {/* Spinning Vinyl Disc */}
            <div className="relative w-20 h-20 rounded-full bg-neutral-900 border-2 border-amber-400/50 flex items-center justify-center mb-5 animate-spin shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              <div className="w-6 h-6 rounded-full bg-[#120806] border border-amber-400" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Connecting Google Session...
            </h3>
            <p className="text-xs text-amber-200/70 mt-2">
              Finalizing authentication with Supabase & Google Cloud. Redirecting you to Deluxe Music...
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-amber-400/80 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying token handshake...</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Signed In Successfully!
            </h3>
            <p className="text-xs text-emerald-300/80 mt-1.5">
              Taking you to the player lounge now...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/40">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Sign-In Encountered an Issue
            </h3>
            <p className="text-xs text-rose-300/80 mt-2 break-words max-w-xs">
              {errorMessage || 'Could not complete the OAuth handshake with Google.'}
            </p>

            <button
              onClick={() => router.replace('/')}
              className="mt-6 px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Return to Music Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
