'use client';

import React, { useState } from 'react';
import { X, Send, Pin, Sparkles, Shield, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ListenerChatMessage } from '@/lib/db/types';

const INITIAL_MESSAGES: ListenerChatMessage[] = [
  {
    id: 'msg-1',
    user_name: 'Resident Audio Host',
    message: 'Welcome everyone! Deluxe high-fidelity music streamer is active today with lossless sound 📻✨',
    is_admin: true,
    created_at: '10 mins ago',
  },
  {
    id: 'msg-2',
    user_name: 'RetroSurfer_99',
    message: 'That ambient track gives pure late-night rainy vibes. Hit the Baarish button guys!',
    is_admin: false,
    created_at: '6 mins ago',
  },
  {
    id: 'msg-3',
    user_name: 'Aman Sharma',
    message: 'The vinyl disc animation looks crazy realistic with shadcn and aceternity ui 🙌',
    is_admin: false,
    created_at: '2 mins ago',
  },
];

export const LoungeChatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { user, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ListenerChatMessage[]>(INITIAL_MESSAGES);
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMsg: ListenerChatMessage = {
      id: `chat-${Date.now()}`,
      user_name: profile?.full_name || user?.email?.split('@')[0] || 'Anonymous Listener',
      message: text.trim(),
      is_admin: isAdmin,
      created_at: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg h-[540px] rounded-3xl border border-amber-500/30 flex flex-col overflow-hidden shadow-2xl"
        style={{
          background: 'radial-gradient(circle at top, #2b0f08 0%, #150604 70%, #0c0302 100%)',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Deluxe Live Lounge Chat
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Live
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pinned Broadcast Banner (Deluxe Music signature) */}
        <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
          <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-tight">
            <strong className="text-amber-300">Station Notice:</strong> High quality lossless audio stream active. Toggle "Baarish" for ambient monsoon rainfall and thunder.
          </p>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
          {messages.map((m) => {
            const isOwn = m.user_name === (profile?.full_name || user?.email?.split('@')[0]);

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                    isOwn
                      ? 'bg-amber-500/25 border border-amber-400/40 text-amber-100 rounded-br-none'
                      : m.is_admin
                      ? 'bg-amber-950/60 border border-amber-500/50 text-amber-200 rounded-bl-none'
                      : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {m.is_admin ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <Shield className="w-3 h-3 fill-current" />
                        {m.user_name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-200/80">
                        {m.user_name}
                      </span>
                    )}
                    <span className="text-[9px] text-white/40 font-mono ml-auto">
                      {m.created_at}
                    </span>
                  </div>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
          <input
            type="text"
            placeholder={
              user ? 'Drop a reaction or request a track...' : 'Type as guest listener...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
