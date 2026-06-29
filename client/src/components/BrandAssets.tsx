import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { extractPaletteFromImage } from "@/lib/colorExtractor";

interface BrandAssetsProps {
  onBrandUpdate: (brandData: {
    logo: string | null;
    colors: { primary: string; secondary: string };
  }) => void;
  currentBrandLogo?: string | null;
  currentBrandColors?: { primary: string; secondary: string };
}



/**
 * Canvas-based background remover.
 * Samples background color from the 4 corners of the image, then
 * flood-fills from every edge pixel, setting near-background pixels
 * to fully transparent. Works best for logos on white/solid backgrounds.
 */
function removeBackground(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(base64); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;
      const TOLERANCE = 40;

      // Sample background color from 4 corners (average)
      const sampleCorners = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
      };
      const corners = [
        sampleCorners(0, 0), sampleCorners(w - 1, 0),
        sampleCorners(0, h - 1), sampleCorners(w - 1, h - 1),
      ];
      const bgR = Math.round(corners.reduce((s, c) => s + c.r, 0) / 4);
      const bgG = Math.round(corners.reduce((s, c) => s + c.g, 0) / 4);
      const bgB = Math.round(corners.reduce((s, c) => s + c.b, 0) / 4);

      const isBackground = (idx: number) => {
        const dr = data[idx] - bgR;
        const dg = data[idx + 1] - bgG;
        const db = data[idx + 2] - bgB;
        return Math.sqrt(dr * dr + dg * dg + db * db) <= TOLERANCE;
      };

      // BFS flood-fill from all edge pixels
      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      const enqueue = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const pos = y * w + x;
        if (visited[pos]) return;
        const idx = pos * 4;
        if (data[idx + 3] === 0) { visited[pos] = 1; return; } // already transparent
        if (isBackground(idx)) {
          visited[pos] = 1;
          queue.push(x, y);
        }
      };

      // Seed from all 4 edges
      for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
      for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }

      while (queue.length > 0) {
        const y = queue.pop()!;
        const x = queue.pop()!;
        const idx = (y * w + x) * 4;
        data[idx + 3] = 0; // make transparent
        enqueue(x + 1, y); enqueue(x - 1, y);
        enqueue(x, y + 1); enqueue(x, y - 1);
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export default function BrandAssets({
  onBrandUpdate,
  currentBrandLogo,
  currentBrandColors,
}: BrandAssetsProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(currentBrandLogo || null);
  const [primaryColor, setPrimaryColor] = useState(currentBrandColors?.primary || "#047857");
  const [secondaryColor, setSecondaryColor] = useState(currentBrandColors?.secondary || "#0d9488");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo file must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const raw = event.target?.result as string;
      toast.loading("Removing background…", { id: "logo-bg" });
      let finalLogo = raw;
      try {
        // Always run background removal — works on white, light grey, any solid bg
        finalLogo = await removeBackground(raw);
        setLogoPreview(finalLogo);
        toast.success("Logo uploaded with background removed!", { id: "logo-bg" });
      } catch {
        setLogoPreview(raw);
        toast.success("Logo uploaded!", { id: "logo-bg" });
      }

      // Automatically run Color Extraction right after upload completes
      try {
        const palette = await extractPaletteFromImage(finalLogo);
        setPrimaryColor(palette.primary);
        setSecondaryColor(palette.secondary);
        onBrandUpdate({ logo: finalLogo, colors: { primary: palette.primary, secondary: palette.secondary } });
        toast.success(`Auto-extracted brand colors! Primary: ${palette.primary}`);
      } catch (err) {
        console.warn("Failed to extract brand colors from logo automatically", err);
        onBrandUpdate({ logo: finalLogo, colors: { primary: primaryColor, secondary: secondaryColor } });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (color: string, type: "primary" | "secondary") => {
    if (type === "primary") setPrimaryColor(color);
    else setSecondaryColor(color);
    onBrandUpdate({
      logo: logoPreview,
      colors: { primary: type === "primary" ? color : primaryColor, secondary: type === "secondary" ? color : secondaryColor },
    });
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    onBrandUpdate({ logo: null, colors: { primary: primaryColor, secondary: secondaryColor } });
    toast.success("Logo removed");
  };

  const handleAnalyzeBrand = async () => {
    if (!logoPreview) { toast.error("Please upload a logo first"); return; }
    setIsAnalyzing(true);
    try {
      const palette = await extractPaletteFromImage(logoPreview);
      setPrimaryColor(palette.primary);
      setSecondaryColor(palette.secondary);
      onBrandUpdate({ logo: logoPreview, colors: { primary: palette.primary, secondary: palette.secondary } });
      toast.success(`Brand colors extracted! Primary: ${palette.primary}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not extract colors. Please set them manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Logo Upload */}
      <Card className="p-4 space-y-3 border border-gray-200 bg-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Brand Logo</h3>
          <p className="text-xs text-gray-500">Upload your company logo (PNG, JPG, SVG – max 5MB)</p>
        </div>

        {logoPreview ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-teal-200 gap-3">
              {/* Resizable logo preview with drag-to-resize via CSS resize */}
              <div
                style={{
                  resize: "both",
                  overflow: "hidden",
                  minWidth: 60,
                  maxWidth: 300,
                  minHeight: 40,
                  maxHeight: 160,
                  width: 120,
                  height: 60,
                  border: "1.5px dashed #14b8a6",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f9fafb",
                }}
                title="Drag the corner to resize the logo preview"
              >
                <img
                  src={logoPreview}
                  alt="Brand Logo"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-[10px] text-gray-400">↘ Drag bottom-right corner to resize logo</p>
                <Button
                  onClick={handleRemoveLogo}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 gap-1 text-xs w-full justify-start h-7"
                >
                  <X size={12} /> Remove Logo
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAnalyzeBrand}
              disabled={isAnalyzing}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs h-9 font-semibold"
            >
              <Sparkles size={14} />
              {isAnalyzing ? "Extracting Colors…" : "Extract Brand Colors from Logo"}
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
            <Upload size={28} className="text-teal-500 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Click to upload logo</span>
            <span className="text-xs text-gray-500 mt-0.5">or drag and drop</span>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        )}
      </Card>

      {/* Brand Colors */}
      <Card className="p-4 space-y-3 border border-gray-200 bg-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-0.5">Brand Colors</h3>
          <p className="text-xs text-gray-500">Customize your card's color scheme</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Primary Color */}
          <div className="space-y-1.5">
            <Label htmlFor="primary-color" className="text-xs font-semibold text-gray-700">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input id="primary-color" type="color" value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value, "primary")}
                className="w-12 h-8 rounded cursor-pointer border border-gray-200" />
              <input type="text" value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value, "primary")}
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono" placeholder="#047857" />
            </div>
            <div className="h-8 rounded-lg border border-gray-100" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Secondary Color */}
          <div className="space-y-1.5">
            <Label htmlFor="secondary-color" className="text-xs font-semibold text-gray-700">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <input id="secondary-color" type="color" value={secondaryColor}
                onChange={(e) => handleColorChange(e.target.value, "secondary")}
                className="w-12 h-8 rounded cursor-pointer border border-gray-200" />
              <input type="text" value={secondaryColor}
                onChange={(e) => handleColorChange(e.target.value, "secondary")}
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono" placeholder="#0d9488" />
            </div>
            <div className="h-8 rounded-lg border border-gray-100" style={{ backgroundColor: secondaryColor }} />
          </div>
        </div>
      </Card>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Upload your logo, then click <strong>"Extract Brand Colors"</strong> for automatic color detection — no API key needed. Colors are applied instantly to your visiting card.
        </p>
      </div>
    </div>
  );
}
