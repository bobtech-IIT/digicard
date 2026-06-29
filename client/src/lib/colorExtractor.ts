/**
 * Utility to extract dominant color palette from an uploaded logo image using HTML5 Canvas.
 */

interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export function extractPaletteFromImage(imageUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context could not be created');
        }

        // Downscale logo for faster pixel sampling
        const maxDim = 100;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h).data;
        const colorCounts: { [hex: string]: number } = {};

        // Sample pixels (skipping alpha / white / black/ neutral background pixels to find actual logo accents)
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 150) continue; // Skip semi-transparent pixels

          // Skip absolute neutrals (white, black, grays) for primary selection
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;
          if (diff < 30 && (max > 220 || min < 40)) {
            continue; // Skip plain white backgrounds or dark gray lines
          }

          const hex = rgbToHex(r, g, b);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        // Sort color clusters
        const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);

        // Default colors if we couldn't find enough vibrant colors
        const primary = sortedColors[0] || '#4F46E5'; // Indigo
        const secondary = sortedColors[1] || '#06B6D4'; // Cyan
        const accent = sortedColors[2] || '#10B981'; // Green

        // Construct high-contrast brand styling tokens
        // Check if primary is dark or light to select best text and canvas colors
        const isDarkPrimary = getLuminance(primary) < 128;

        const palette: ExtractedPalette = {
          primary,
          secondary,
          accent,
          background: isDarkPrimary ? '#F9FAFB' : '#0B0F19',
          text: isDarkPrimary ? '#111827' : '#FFFFFF',
        };

        resolve(palette);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.min(255, Math.max(0, val));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

export function getLuminance(hex: string): number {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
