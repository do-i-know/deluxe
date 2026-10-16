import { NextResponse } from 'next/server';
import { getSongs, createSong } from '@/lib/db/songs';
import { verifyAdminRequest } from '@/lib/auth/serverAuth';

export async function GET() {
  try {
    const songs = await getSongs();
    return NextResponse.json({ success: true, songs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch songs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Strict server-side Admin authorization check
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 250) : '';
    const artist = typeof body.artist === 'string' ? body.artist.trim().slice(0, 250) : '';
    const album = typeof body.album === 'string' ? body.album.trim().slice(0, 200) : 'Single Release';
    const genre = typeof body.genre === 'string' ? body.genre.trim().slice(0, 100) : 'Retro Ambient';
    const song_url = typeof body.song_url === 'string' ? body.song_url.trim() : '';
    const cover_url = typeof body.cover_url === 'string' ? body.cover_url.trim() : '';
    const storage_path = typeof body.storage_path === 'string' ? body.storage_path.trim() : '';

    if (!title || !artist || !song_url) {
      return NextResponse.json(
        { success: false, error: 'Title, artist, and song URL are required.' },
        { status: 400 }
      );
    }

    // URL protocol safety check (prevent javascript: or data: URIs)
    const isSafeUrl = (url: string) =>
      url.startsWith('https://') ||
      url.startsWith('http://') ||
      url.startsWith('/') ||
      url.startsWith('./');

    if (!isSafeUrl(song_url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid song URL protocol.' },
        { status: 400 }
      );
    }

    if (cover_url && !isSafeUrl(cover_url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cover artwork URL protocol.' },
        { status: 400 }
      );
    }

    // Prevent directory traversal in storage_path
    if (storage_path && storage_path.includes('..')) {
      return NextResponse.json(
        { success: false, error: 'Invalid storage path.' },
        { status: 400 }
      );
    }

    const durationNum = Number(body.duration);
    const duration = !isNaN(durationNum) && durationNum >= 0 && durationNum <= 86400
      ? Math.round(durationNum)
      : 180;

    const song = await createSong({
      title,
      artist,
      album,
      genre,
      duration,
      song_url,
      cover_url,
      storage_path,
      is_featured: Boolean(body.is_featured),
    });

    return NextResponse.json({ success: true, song }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create song';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
