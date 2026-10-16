'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const GoogleSignInButton: React.FC<{
  onSuccess?: () => void;
  className?: string;
}> = ({ onSuccess, className = '' }) => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-800 font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg active:scale-98 border border-neutral-200 cursor-pointer disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-700" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
        )}
        <span className="text-sm font-medium">Continue with Google Cloud</span>
      </button>

      {errorMsg && (
        <p className="text-xs text-rose-400 text-center mt-2 font-medium">{errorMsg}</p>
      )}
    </div>
  );
};
