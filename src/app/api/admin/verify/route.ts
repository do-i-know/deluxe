import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const serverKey = process.env.ADMIN_ACCESS_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { success: false, error: 'Server admin passkey not configured' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { passkey, userId } = body;

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Passkey is required' },
        { status: 400 }
      );
    }

    // Constant-time comparison to completely prevent timing attacks
    if (!safeCompare(passkey, serverKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid master admin passkey.' },
        { status: 401 }
      );
    }

    // If promoting a user to admin, verify their Supabase Auth Bearer token
    if (userId && supabaseAdmin) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (!userError && user && user.id === userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin access verified successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server verification error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

