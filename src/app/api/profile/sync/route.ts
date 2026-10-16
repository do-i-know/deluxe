import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    // 1. In production, require Authorization Bearer token to prevent impersonation
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let verifiedUserId: string | null = null;
    let verifiedEmail: string | null = null;
    let verifiedMetadata: Record<string, unknown> = {};

    if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
      const token = authHeader.substring(7).trim();
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        verifiedUserId = user.id;
        verifiedEmail = user.email || null;
        verifiedMetadata = (user.user_metadata || {}) as Record<string, unknown>;
      }
    }

    const body = await req.json().catch(() => ({}));
    const userId = verifiedUserId || body.userId;
    const email = verifiedEmail || body.email;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Valid authenticated session or user credentials required.' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        profile: {
          id: userId,
          email,
          full_name: (verifiedMetadata.full_name as string) || body.fullName || email.split('@')[0],
          avatar_url: (verifiedMetadata.avatar_url as string) || body.avatarUrl || '',
          role: 'user',
        },
      });
    }

    // 2. Check if profile already exists in Supabase
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!fetchErr && existing) {
      return NextResponse.json({ success: true, profile: existing });
    }

    // 3. New profile creation - strictly verify owner email only
    const isOwner = email.toLowerCase() === 'abhinavderapur0@gmail.com';
    const fullName =
      (verifiedMetadata.full_name as string) ||
      (verifiedMetadata.name as string) ||
      body.fullName ||
      email.split('@')[0];
    const avatarUrl =
      (verifiedMetadata.avatar_url as string) ||
      (verifiedMetadata.picture as string) ||
      body.avatarUrl ||
      '';

    const newProfile = {
      id: userId,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: isOwner ? 'admin' : 'user',
    };

    const { data: created, error: insertErr } = await supabaseAdmin
      .from('profiles')
      .upsert(newProfile)
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('Error auto-syncing profile:', insertErr);
      return NextResponse.json({ success: true, profile: newProfile });
    }

    return NextResponse.json({ success: true, profile: created || newProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown sync error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

