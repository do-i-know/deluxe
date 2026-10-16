import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuthVerificationResult {
  authorized: boolean;
  error?: string;
  userId?: string;
  email?: string;
  role?: 'admin' | 'user';
}

/**
 * Server-side verification for API routes to strictly enforce admin privileges.
 * Verifies either:
 * 1. A cryptographically signed Supabase JWT Bearer token belonging to an 'admin' role user
 * 2. A secure x-admin-key header matching the server's ADMIN_ACCESS_KEY environment variable
 */
export async function verifyAdminRequest(req: Request): Promise<AuthVerificationResult> {
  // Check admin passkey header (Server-side secret only)
  const serverAdminKey = process.env.ADMIN_ACCESS_KEY;
  const clientKey = req.headers.get('x-admin-key');
  if (serverAdminKey && clientKey && clientKey === serverAdminKey) {
    return { authorized: true, role: 'admin' };
  }

  // Extract Bearer token from Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: 'Missing or malformed Authorization header. Bearer token required.',
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { authorized: false, error: 'Empty token provided.' };
  }

  if (!supabaseAdmin) {
    return { authorized: false, error: 'Supabase server admin client is not configured.' };
  }

  try {
    // 1. Verify JWT with Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return { authorized: false, error: 'Invalid or expired authentication session.' };
    }

    // 2. Verify admin role from public.profiles in database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { authorized: false, error: 'User profile not found.' };
    }

    if (profile.role !== 'admin') {
      return {
        authorized: false,
        error: 'Forbidden: Administrator privileges required for this action.',
        userId: user.id,
        email: user.email,
        role: 'user',
      };
    }

    return {
      authorized: true,
      userId: user.id,
      email: user.email,
      role: 'admin',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Authentication verification exception';
    return { authorized: false, error: msg };
  }
}
