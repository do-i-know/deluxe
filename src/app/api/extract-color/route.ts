import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { SongColorTheme } from '@/lib/db/types';

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coverUrl = searchParams.get('url');

    if (!coverUrl) {
      return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
    }

    // Fetch image server-side (bypasses browser CORS restrictions completely)
    const res = await fetch(coverUrl, {
      next: { revalidate: 86400 }, // Cache color extraction for 24h
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch image' }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Downscale and decode image pixels using sharp
    const { data, info } = await sharp(buffer)
      .resize(48, 48, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bestH = 0;
    let bestS = 0;
    let bestL = 0;
    let maxScore = -1;

    const hueCounts = new Array(36).fill(0);
    const hueSats = new Array(36).fill(0);
    const hueLights = new Array(36).fill(0);

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const [h, s, l] = rgbToHsl(r, g, b);

      // Filter out pure neutral grays, pure blacks, and harsh blown whites
      if (s > 15 && l > 12 && l < 88) {
        const bucket = Math.floor(h / 10) % 36;
        hueCounts[bucket]++;
        hueSats[bucket] += s;
        hueLights[bucket] += l;

        // Score high-vibrancy pixels (Spotify accent logic)
        const vibrancyScore = s * 1.5 + (50 - Math.abs(50 - l));
        if (vibrancyScore > maxScore) {
          maxScore = vibrancyScore;
          bestH = h;
          bestS = s;
          bestL = l;
        }
      }
    }

    // Fallback to dominant hue bucket if no single vibrant pixel scored
    if (maxScore < 0) {
      let maxBucket = 0;
      let maxBucketCount = 0;
      for (let b = 0; b < 36; b++) {
        if (hueCounts[b] > maxBucketCount) {
          maxBucketCount = hueCounts[b];
          maxBucket = b;
        }
      }
      if (maxBucketCount > 0) {
        bestH = maxBucket * 10 + 5;
        bestS = Math.round(hueSats[maxBucket] / maxBucketCount);
        bestL = Math.round(hueLights[maxBucket] / maxBucketCount);
      }
    }

    const finalS = Math.max(50, Math.min(95, bestS));
    const finalH = bestH;

    const theme: SongColorTheme = {
      primary: `hsla(${finalH}, ${finalS}%, 50%, 0.5)`,
      secondary: `hsla(${(finalH + 30) % 360}, ${Math.max(40, finalS - 15)}%, 35%, 0.3)`,
      darkBg: `hsl(${finalH}, ${Math.min(50, Math.max(25, finalS))}%, 6%)`,
      accentHex: `hsl(${finalH}, ${finalS}%, 60%)`,
    };

    return NextResponse.json({
      success: true,
      theme,
      meta: { h: finalH, s: finalS, l: bestL },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Server-side color extraction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
