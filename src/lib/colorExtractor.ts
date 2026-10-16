import { SongColorTheme } from './db/types';

const colorCache = new Map<string, SongColorTheme>();

// Default luxury velvet theme
export const DEFAULT_THEME: SongColorTheme = {
  primary: 'rgba(217, 119, 6, 0.45)',
  secondary: 'rgba(180, 83, 9, 0.25)',
  darkBg: '#0d0705',
  accentHex: '#f59e0b',
};

/**
 * Converts RGB values to HSL
 */
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

/**
 * Intelligent genre / keyword fallback when canvas cannot extract pixels
 */
function getFallbackTheme(genre = '', text = ''): SongColorTheme {
  const g = (genre + ' ' + text).toLowerCase();

  if (g.includes('r&b') || g.includes('dark') || g.includes('sob') || g.includes('limi')) {
    // Deep midnight slate / indigo velvet (Matches moody R&B like 'sob')
    return {
      primary: 'rgba(79, 70, 229, 0.5)',
      secondary: 'rgba(59, 130, 246, 0.3)',
      darkBg: '#080a14',
      accentHex: '#6366f1',
    };
  }

  if (g.includes('cyber') || g.includes('sci-fi') || g.includes('synth')) {
    return {
      primary: 'rgba(6, 182, 212, 0.45)',
      secondary: 'rgba(14, 165, 233, 0.3)',
      darkBg: '#031118',
      accentHex: '#22d3ee',
    };
  }

  if (g.includes('electronic') || g.includes('drum') || g.includes('bass') || g.includes('jungle')) {
    return {
      primary: 'rgba(16, 185, 129, 0.45)',
      secondary: 'rgba(5, 150, 105, 0.3)',
      darkBg: '#02160e',
      accentHex: '#34d399',
    };
  }

  if (g.includes('vintage') || g.includes('beats') || g.includes('groove') || g.includes('gorila')) {
    return {
      primary: 'rgba(234, 88, 12, 0.45)',
      secondary: 'rgba(217, 119, 6, 0.3)',
      darkBg: '#160a04',
      accentHex: '#fb923c',
    };
  }

  if (g.includes('pop') || g.includes('ambient') || g.includes('eona')) {
    return {
      primary: 'rgba(244, 63, 94, 0.45)',
      secondary: 'rgba(225, 29, 72, 0.3)',
      darkBg: '#16050b',
      accentHex: '#fb7185',
    };
  }

  // Deterministic fallback based on hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    primary: `hsla(${hue}, 80%, 45%, 0.45)`,
    secondary: `hsla(${(hue + 35) % 360}, 75%, 35%, 0.25)`,
    darkBg: `hsl(${hue}, 45%, 6%)`,
    accentHex: `hsl(${hue}, 85%, 60%)`,
  };
}

/**
 * Extracts the real dominant and vibrant colors directly from any cover image in the browser!
 */
export async function extractThemeFromCover(
  coverUrl?: string,
  genre?: string,
  title?: string,
  artist?: string
): Promise<SongColorTheme> {
  const fallback = getFallbackTheme(genre, `${title || ''} ${artist || ''}`);
  if (!coverUrl) return fallback;

  if (colorCache.has(coverUrl)) {
    return colorCache.get(coverUrl)!;
  }

  if (typeof window === 'undefined') {
    return fallback;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timer = setTimeout(() => {
        colorCache.set(coverUrl, fallback);
        resolve(fallback);
      }, 1500);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            colorCache.set(coverUrl, fallback);
            return resolve(fallback);
          }

          const sampleSize = 48;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

          const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
          let bestH = 0;
          let bestS = 0;
          let bestL = 0;
          let maxScore = -1;

          // Histogram for dominant hues
          const hueCounts = new Array(36).fill(0);
          const hueSats = new Array(36).fill(0);
          const hueLights = new Array(36).fill(0);

          for (let i = 0; i < imgData.length; i += 16) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];

            if (a < 128) continue;

            const [h, s, l] = rgbToHsl(r, g, b);

            // Filter out pure grays, deep blacks, and harsh blown whites
            if (s > 15 && l > 12 && l < 88) {
              const bucket = Math.floor(h / 10) % 36;
              hueCounts[bucket]++;
              hueSats[bucket] += s;
              hueLights[bucket] += l;

              // Score vibrant colorful pixels (Spotify accent logic)
              const vibrancyScore = s * 1.5 + (50 - Math.abs(50 - l));
              if (vibrancyScore > maxScore) {
                maxScore = vibrancyScore;
                bestH = h;
                bestS = s;
                bestL = l;
              }
            }
          }

          // If no vibrant pixel, take dominant hue bucket
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
            } else {
              colorCache.set(coverUrl, fallback);
              return resolve(fallback);
            }
          }

          // Ensure rich saturation and contrast
          const finalS = Math.max(50, Math.min(95, bestS));
          const finalH = bestH;

          // Generate true Spotify-grade palette
          const extractedTheme: SongColorTheme = {
            primary: `hsla(${finalH}, ${finalS}%, 50%, 0.5)`,
            secondary: `hsla(${(finalH + 30) % 360}, ${Math.max(40, finalS - 15)}%, 35%, 0.3)`,
            darkBg: `hsl(${finalH}, ${Math.min(50, Math.max(25, finalS))}%, 6%)`,
            accentHex: `hsl(${finalH}, ${finalS}%, 60%)`,
          };

          colorCache.set(coverUrl, extractedTheme);
          resolve(extractedTheme);
        } catch (err) {
          console.warn('Canvas pixel extraction failed (CORS/taint), using fallback:', err);
          colorCache.set(coverUrl, fallback);
          resolve(fallback);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        colorCache.set(coverUrl, fallback);
        resolve(fallback);
      };
    } catch {
      colorCache.set(coverUrl, fallback);
      resolve(fallback);
    }
  });
}
