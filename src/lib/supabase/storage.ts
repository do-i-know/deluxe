import { supabase, isSupabaseConfigured } from './client';

export const SONGS_BUCKET = process.env.NEXT_PUBLIC_SONGS_BUCKET || 'songs';
export const COVERS_BUCKET = process.env.NEXT_PUBLIC_COVERS_BUCKET || 'covers';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an audio file (.mp3, .wav, .m4a) to Supabase Storage bucket
 */
export async function uploadSongAudio(file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode: Return a temporary Object URL or local simulated path
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      path: `local-demo/${Date.now()}_${file.name}`,
    };
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(SONGS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase song upload error:', error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SONGS_BUCKET).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload song to Supabase Storage';
    return {
      url: '',
      path: '',
      error: message,
    };
  }
}

/**
 * Upload an image file (.jpg, .png, .webp) to Supabase Storage covers bucket
 */
export async function uploadCoverImage(file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured() || !supabase) {
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      path: `local-demo-covers/${Date.now()}_${file.name}`,
    };
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase cover upload error:', error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload cover to Supabase Storage';
    return {
      url: '',
      path: '',
      error: message,
    };
  }
}

/**
 * Delete a file from a Supabase Storage bucket
 */
export async function deleteStorageFile(bucketName: string, path: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !path || path.startsWith('local-demo')) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    if (error) {
      console.warn(`Failed to delete storage file ${path} from bucket ${bucketName}:`, error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
