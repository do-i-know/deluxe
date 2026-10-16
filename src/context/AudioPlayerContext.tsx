'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Song, PlaybackRepeatMode } from '@/lib/db/types';
import { DEFAULT_TRACKS } from '@/lib/defaultTracks';
import { incrementPlays } from '@/lib/db/songs';

interface AudioPlayerContextType {
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: PlaybackRepeatMode;
  isRainAmbientActive: boolean;
  rainVolume: number;
  favorites: string[];
  isQueueOpen: boolean;
  isFullscreenOpen: boolean;
  playTrack: (track: Song, newQueue?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolumeLevel: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleRainAmbient: () => void;
  setRainVolumeLevel: (volume: number) => void;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  setIsQueueOpen: (open: boolean) => void;
  setIsFullscreenOpen: (open: boolean) => void;
  addToQueue: (track: Song) => void;
  setTrackQueue: (tracks: Song[]) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'deluxe_user_favorites';

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Song[]>(DEFAULT_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(DEFAULT_TRACKS[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(210);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<PlaybackRepeatMode>('all');
  const [isRainAmbientActive, setIsRainAmbientActive] = useState<boolean>(false);
  const [rainVolume, setRainVolume] = useState<number>(0.4);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved favorites from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync favorites to local storage
  const toggleFavorite = (songId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isFavorite = (songId: string) => favorites.includes(songId);

  // Initialize and handle Audio elements
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      });

      audio.addEventListener('ended', () => {
        handleTrackEnded();
      });

      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
    }

    // Initialize Deluxe Monsoon Rain Ambience audio
    if (!rainAudioRef.current) {
      // High quality soothing monsoon rain loop
      const rainAudio = new Audio('https://cdn.pixabay.com/download/audio/2021/09/06/audio_247a32d16d.mp3?filename=rain-and-thunder-nature-sounds-7803.mp3');
      rainAudio.loop = true;
      rainAudio.preload = 'none';
      rainAudioRef.current = rainAudio;
    }
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;
    if (audio.src !== currentTrack.song_url && !audio.src.endsWith(currentTrack.song_url)) {
      audio.src = currentTrack.song_url;
      audio.load();
      if (isPlaying) {
        audio.play().catch((e) => console.warn('Audio play request interrupted:', e));
      }
    }
  }, [currentTrack]);

  // Handle play/pause toggle
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback error or blocked autoplay:', err);
        setIsPlaying(false);
      });
      // Increment plays count in DB
      incrementPlays(currentTrack.id);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle Rain ambient sound toggle
  useEffect(() => {
    if (!rainAudioRef.current) return;
    if (isRainAmbientActive) {
      rainAudioRef.current.volume = isMuted ? 0 : rainVolume;
      rainAudioRef.current.play().catch((err) => console.warn('Rain audio error:', err));
    } else {
      rainAudioRef.current.pause();
    }
  }, [isRainAmbientActive, rainVolume, isMuted]);

  // When a track finishes playing
  const handleTrackEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      setCurrentTrack(queue[randomIndex]);
      setIsPlaying(true);
      return;
    }

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      setCurrentTrack(queue[nextIdx]);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      setCurrentTrack(queue[0]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const playTrack = (track: Song, newQueue?: Song[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const foundIdx = newQueue.findIndex((s) => s.id === track.id);
      setQueueIndex(foundIdx !== -1 ? foundIdx : 0);
    } else {
      const foundIdx = queue.findIndex((s) => s.id === track.id);
      if (foundIdx === -1) {
        setQueue((prev) => [track, ...prev]);
        setQueueIndex(0);
      } else {
        setQueueIndex(foundIdx);
      }
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!currentTrack && queue.length > 0) {
      setCurrentTrack(queue[0]);
      setQueueIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      setCurrentTrack(queue[randomIndex]);
      setIsPlaying(true);
      return;
    }
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    // If we've played more than 3 seconds, replay current song first
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    setIsPlaying(true);
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolumeLevel = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    if (isMuted && clamped > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleRainAmbient = () => {
    setIsRainAmbientActive((prev) => !prev);
  };

  const setRainVolumeLevel = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setRainVolume(clamped);
  };

  const addToQueue = (track: Song) => {
    setQueue((prev) => [...prev, track]);
  };

  const setTrackQueue = (tracks: Song[]) => {
    setQueue(tracks);
  };

  // Keyboard controls listener (Space = play/pause, ArrowRight = skip, ArrowLeft = prev, M = mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        playNext();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        playPrevious();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, queue, queueIndex, isPlaying, isMuted]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        isRainAmbientActive,
        rainVolume,
        favorites,
        isQueueOpen,
        isFullscreenOpen,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
        setVolumeLevel,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        toggleRainAmbient,
        setRainVolumeLevel,
        toggleFavorite,
        isFavorite,
        setIsQueueOpen,
        setIsFullscreenOpen,
        addToQueue,
        setTrackQueue,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
