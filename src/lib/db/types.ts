export type UserRole = 'admin' | 'user';

export interface SongColorTheme {
  primary: string; // dominant vibrant color (e.g. rgb(234, 88, 12))
  secondary: string; // supporting glow (e.g. rgb(245, 158, 11))
  darkBg: string; // deep ambient backdrop (e.g. #1c0804)
  accentHex: string; // hex for borders and highlights
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  song_url: string; // audio source URL (Supabase bucket or local)
  cover_url: string; // image source URL
  storage_path?: string; // supabase storage bucket path if stored in bucket
  plays_count: number;
  is_featured?: boolean;
  color_theme?: SongColorTheme;
  created_at?: string;
  created_by?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  user_id: string;
  is_public: boolean;
  songs?: Song[];
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
}

export interface ListenerChatMessage {
  id: string;
  user_name: string;
  avatar_url?: string;
  message: string;
  is_admin?: boolean;
  created_at: string;
}

export type PlaybackRepeatMode = 'off' | 'all' | 'one';

export interface AudioPlayerState {
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
}
