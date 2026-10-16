import { NextResponse } from 'next/server';
import { updateSong, deleteSong } from '@/lib/db/songs';
import { verifyAdminRequest } from '@/lib/auth/serverAuth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid song ID required.' }, { status: 400 });
    }

    const rawUpdates = await req.json().catch(() => ({}));
    const allowedUpdates: Record<string, unknown> = {};

    if (typeof rawUpdates.title === 'string' && rawUpdates.title.trim()) {
      allowedUpdates.title = rawUpdates.title.trim().slice(0, 250);
    }
    if (typeof rawUpdates.artist === 'string' && rawUpdates.artist.trim()) {
      allowedUpdates.artist = rawUpdates.artist.trim().slice(0, 250);
    }
    if (typeof rawUpdates.album === 'string') {
      allowedUpdates.album = rawUpdates.album.trim().slice(0, 200);
    }
    if (typeof rawUpdates.genre === 'string') {
      allowedUpdates.genre = rawUpdates.genre.trim().slice(0, 100);
    }
    if (typeof rawUpdates.is_featured === 'boolean') {
      allowedUpdates.is_featured = rawUpdates.is_featured;
    }
    if (typeof rawUpdates.plays_count === 'number' && !isNaN(rawUpdates.plays_count)) {
      allowedUpdates.plays_count = Math.max(0, Math.floor(rawUpdates.plays_count));
    }

    const success = await updateSong(id, allowedUpdates);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update song';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid song ID required.' }, { status: 400 });
    }

    const url = new URL(req.url);
    let storagePath = url.searchParams.get('storage_path') || undefined;

    // Prevent path traversal
    if (storagePath && storagePath.includes('..')) {
      storagePath = undefined;
    }

    const success = await deleteSong(id, storagePath);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete song';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
