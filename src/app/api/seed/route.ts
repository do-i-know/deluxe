import { NextResponse } from 'next/server';
import { seedDefaultSongs } from '@/lib/db/songs';
import { verifyAdminRequest } from '@/lib/auth/serverAuth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const result = await seedDefaultSongs();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed default songs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

