import { Vibrant } from 'node-vibrant/browser';

export interface VibrantColors {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
  darkMuted: string;
}

/**
 * Extract a usable palette from an image source (URL or element).
 * Returns `null` on failure so callers can fall back.
 */
export async function extractPalette(src: string | HTMLImageElement): Promise<VibrantColors | null> {
  try {
    const v = await Vibrant.from(src).getPalette();
    if (!v) return null;
    
    const toHex = (sw: any) => sw?.hex ?? null;
    
    const palette = {
      vibrant: toHex(v.Vibrant),
      muted: toHex(v.Muted),
      darkVibrant: toHex(v.DarkVibrant),
      lightVibrant: toHex(v.LightVibrant),
      darkMuted: toHex(v.DarkMuted),
    };

    // Filter out nulls and ensure we have at least one valid color
    if (!palette.vibrant && !palette.muted && !palette.darkVibrant) return null;

    return palette as VibrantColors;
  } catch (error) {
    console.error('Failed to extract palette:', error);
    return null;
  }
}
