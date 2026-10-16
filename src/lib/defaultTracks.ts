import { Song, SongColorTheme } from './db/types';

export const DEFAULT_TRACKS: Song[] = [
  {
    id: 'track-1-eona',
    title: 'EONA - Emotional Ambient Pop',
    artist: 'Rockot',
    album: 'Sunset Horizons Vol. 1',
    genre: 'Retro Ambient',
    duration: 210,
    song_url: '/songs/eona.mp3',
    cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    plays_count: 1420,
    is_featured: true,
    color_theme: {
      primary: 'rgba(217, 119, 6, 0.45)', // warm sunset amber
      secondary: 'rgba(180, 83, 9, 0.3)',
      darkBg: '#210a05',
      accentHex: '#f59e0b',
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'track-2-brain-implant',
    title: 'Brain Implant (Cyberpunk Sci-Fi Intro)',
    artist: 'soundbay',
    album: 'Neo Matrix 2000',
    genre: 'Cyber Sci-Fi',
    duration: 124,
    song_url: '/songs/brain-implant.mp3',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    plays_count: 2890,
    is_featured: true,
    color_theme: {
      primary: 'rgba(99, 102, 241, 0.4)', // cyber indigo
      secondary: 'rgba(168, 85, 247, 0.25)',
      darkBg: '#0f0e26',
      accentHex: '#818cf8',
    },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'track-3-gorila',
    title: 'Gorila - Retro Street Grooves',
    artist: 'Alex_MakeMusic',
    album: 'Bazaar Nights',
    genre: 'Vintage Grooves',
    duration: 182,
    song_url: '/songs/gorila.mp3',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    plays_count: 950,
    is_featured: false,
    color_theme: {
      primary: 'rgba(234, 88, 12, 0.4)', // street orange
      secondary: 'rgba(202, 138, 4, 0.25)',
      darkBg: '#230b05',
      accentHex: '#fb923c',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'track-4-jungle-waves',
    title: 'Jungle Waves (Drum&Bass Inspiring)',
    artist: 'DIMMYSAD',
    album: 'Monsoon Odyssey',
    genre: 'Drum & Bass',
    duration: 205,
    song_url: '/songs/jungle-waves.mp3',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    plays_count: 3240,
    is_featured: true,
    color_theme: {
      primary: 'rgba(16, 185, 129, 0.35)', // jungle emerald
      secondary: 'rgba(20, 184, 166, 0.25)',
      darkBg: '#041d15',
      accentHex: '#34d399',
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'track-5-showreel',
    title: 'Showreel Music - Golden Promo',
    artist: 'MFCC',
    album: 'Classic Golden Radio',
    genre: 'Retro Lounge',
    duration: 195,
    song_url: '/songs/showreel.mp3',
    cover_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    plays_count: 1780,
    is_featured: false,
    color_theme: {
      primary: 'rgba(225, 29, 72, 0.35)', // vintage rose velvet
      secondary: 'rgba(217, 119, 6, 0.25)',
      darkBg: '#210710',
      accentHex: '#fb7185',
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Helper to compute or retrieve the ambient Spotify-style color theme for any song
 */
/**
 * Helper to compute or retrieve the ambient Spotify-style color theme for any song
 */
export function getSongTheme(song: Song | null): SongColorTheme {
  if (!song) {
    return {
      primary: 'rgba(217, 119, 6, 0.45)',
      secondary: 'rgba(180, 83, 9, 0.25)',
      darkBg: '#090708',
      accentHex: '#f59e0b',
    };
  }

  if (song.color_theme) {
    return song.color_theme;
  }

  const g = (song.genre + ' ' + song.title + ' ' + song.artist).toLowerCase();

  if (g.includes('r&b') || g.includes('dark') || g.includes('sob') || g.includes('limi')) {
    return {
      primary: 'rgba(79, 70, 229, 0.5)',
      secondary: 'rgba(59, 130, 246, 0.3)',
      darkBg: '#070914',
      accentHex: '#6366f1',
    };
  }

  if (g.includes('cyber') || g.includes('sci-fi') || g.includes('synth')) {
    return {
      primary: 'rgba(6, 182, 212, 0.45)',
      secondary: 'rgba(14, 165, 233, 0.3)',
      darkBg: '#021017',
      accentHex: '#22d3ee',
    };
  }

  if (g.includes('electronic') || g.includes('drum') || g.includes('bass') || g.includes('jungle')) {
    return {
      primary: 'rgba(16, 185, 129, 0.45)',
      secondary: 'rgba(5, 150, 105, 0.3)',
      darkBg: '#02160d',
      accentHex: '#34d399',
    };
  }

  if (g.includes('vintage') || g.includes('beats') || g.includes('groove') || g.includes('gorila')) {
    return {
      primary: 'rgba(234, 88, 12, 0.45)',
      secondary: 'rgba(217, 119, 6, 0.3)',
      darkBg: '#150903',
      accentHex: '#fb923c',
    };
  }

  if (g.includes('pop') || g.includes('ambient') || g.includes('eona')) {
    return {
      primary: 'rgba(244, 63, 94, 0.45)',
      secondary: 'rgba(225, 29, 72, 0.3)',
      darkBg: '#15050a',
      accentHex: '#fb7185',
    };
  }

  // Generate deterministic color theme from song title and artist
  let hash = 0;
  const str = song.title + song.artist;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);

  return {
    primary: `hsla(${hue}, 80%, 45%, 0.45)`,
    secondary: `hsla(${(hue + 35) % 360}, 75%, 35%, 0.25)`,
    darkBg: `hsl(${hue}, 45%, 6%)`,
    accentHex: `hsl(${hue}, 85%, 60%)`,
  };
}
