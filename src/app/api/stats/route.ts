import { NextResponse } from 'next/server';
import { getSongs } from '@/lib/db/songs';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const songs = await getSongs();
    const totalSongs = songs.length;
    const totalPlays = songs.reduce((sum, s) => sum + (s.plays_count || 0), 0);
    const featuredSongs = songs.filter((s) => s.is_featured).length;

    const genresCount: Record<string, number> = {};
    songs.forEach((s) => {
      const g = s.genre || 'Unknown';
      genresCount[g] = (genresCount[g] || 0) + 1;
    });

    let supabaseConnected = false;
    let profilesCount = 0;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { count, error } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        if (!error) {
          supabaseConnected = true;
        }
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (userCount !== null) {
          profilesCount = userCount;
        }
      } catch {
        supabaseConnected = false;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSongs,
        totalPlays,
        featuredSongs,
        genresCount,
        supabaseConnected,
        isSupabaseConfigured: isSupabaseConfigured(),
        profilesCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
