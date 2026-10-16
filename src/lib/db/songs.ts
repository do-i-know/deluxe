import { Song } from './types';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { supabaseAdmin } from '../supabase/admin';
import { DEFAULT_TRACKS } from '../defaultTracks';
import { SONGS_BUCKET, deleteStorageFile } from '../supabase/storage';

const LOCAL_STORAGE_KEY = 'deluxe_music_custom_songs';

const getClient = () => {
  if (typeof window === 'undefined' && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
};

/**
 * Retrieve all songs:
 * - If Supabase DB is active: queries `public.songs` ordered by created_at DESC
 * - Otherwise: loads DEFAULT_TRACKS merged with any locally uploaded songs
 */
export async function getSongs(): Promise<Song[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getSongs returned error, falling back to local songs:', error);
      } else if (data && data.length > 0) {
        return data as Song[];
      }
    } catch (err) {
      console.warn('Supabase DB connection failed, falling back:', err);
    }
  }

  // Fallback to local storage + default songs
  if (typeof window !== 'undefined') {
    try {
      const localCustom = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localCustom) {
        const parsed: Song[] = JSON.parse(localCustom);
        // Deduplicate against DEFAULT_TRACKS
        const existingIds = new Set(parsed.map((s) => s.id));
        const merged = [...parsed, ...DEFAULT_TRACKS.filter((s) => !existingIds.has(s.id))];
        return merged;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return DEFAULT_TRACKS;
}

/**
 * Add a new song:
 * - Inserts into Supabase `songs` table
 * - Also caches in local storage for instantaneous responsiveness
 */
export async function createSong(songData: Omit<Song, 'id' | 'plays_count' | 'created_at'>): Promise<Song> {
  const newSong: Song = {
    ...songData,
    id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    plays_count: 0,
    created_at: new Date().toISOString(),
  };

  const client = getClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { data, error } = await client
        .from('songs')
        .insert({
          title: newSong.title,
          artist: newSong.artist,
          album: newSong.album || 'Single',
          genre: newSong.genre || 'Retro',
          duration: newSong.duration || 0,
          song_url: newSong.song_url,
          cover_url: newSong.cover_url,
          storage_path: newSong.storage_path || '',
          is_featured: Boolean(newSong.is_featured),
        })
        .select()
        .single();

      if (!error && data) {
        return data as Song;
      } else if (error) {
        console.error('Supabase DB insert error:', error);
      }
    } catch (err) {
      console.error('Failed to insert into Supabase DB:', err);
    }
  }

  // Save to local storage for instant access
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      const list: Song[] = existing ? JSON.parse(existing) : [];
      list.unshift(newSong);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  return newSong;
}

/**
 * Update an existing song
 */
export async function updateSong(id: string, updates: Partial<Song>): Promise<boolean> {
  const client = getClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('songs').update(updates).eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.error('Supabase updateSong error:', err);
    }
  }

  // Update in local storage
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) {
        const list: Song[] = JSON.parse(existing);
        const updated = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }

  return true;
}

/**
 * Delete a song from Supabase Database and Storage bucket
 */
export async function deleteSong(id: string, storagePath?: string): Promise<boolean> {
  // Delete from Storage bucket if path exists
  if (storagePath) {
    if (typeof window === 'undefined' && supabaseAdmin) {
      try {
        await supabaseAdmin.storage.from(SONGS_BUCKET).remove([storagePath]);
      } catch (err) {
        console.warn('Server storage delete error:', err);
      }
    } else {
      await deleteStorageFile(SONGS_BUCKET, storagePath);
    }
  }

  const client = getClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('songs').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteSong error:', error);
      }
    } catch (err) {
      console.error('Supabase DB delete error:', err);
    }
  }

  // Delete from local storage
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (existing) {
        const list: Song[] = JSON.parse(existing);
        const filtered = list.filter((s) => s.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  }

  return true;
}

/**
 * Seed initial 5 default tracks into Supabase DB
 */
export async function seedDefaultSongs(): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getClient();
  if (!isSupabaseConfigured() || !client) {
    // Reset local storage to defaults
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_TRACKS));
    }
    return { success: true, count: DEFAULT_TRACKS.length };
  }

  try {
    const payload = DEFAULT_TRACKS.map((t) => ({
      title: t.title,
      artist: t.artist,
      album: t.album,
      genre: t.genre,
      duration: t.duration,
      song_url: t.song_url,
      cover_url: t.cover_url,
      is_featured: t.is_featured,
      plays_count: t.plays_count,
    }));

    const { data, error } = await client.from('songs').upsert(payload, { onConflict: 'title' }).select();

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data ? data.length : payload.length };
  } catch (err: unknown) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Unknown seed error',
    };
  }
}

/**
 * Increment plays count for a track
 */
export async function incrementPlays(songId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.rpc('increment_song_plays', { song_id: songId });
    } catch {
      // Fallback
      try {
        const { data } = await supabase.from('songs').select('plays_count').eq('id', songId).single();
        if (data) {
          await supabase.from('songs').update({ plays_count: (data.plays_count || 0) + 1 }).eq('id', songId);
        }
      } catch {
        // ignore
      }
    }
  }
}
