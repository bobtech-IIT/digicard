import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BrandAssetsProps {
  onBrandUpdate: (brandData: {
    logo: string | null;
    colors: { primary: string; secondary: string };
  }) => void;
  currentBrandLogo?: string | null;
  currentBrandColors?: { primary: string; secondary: string };
}

/**
 * Client-side dominant color extraction from a base64 image.
 * Renders the image onto a hidden canvas, samples pixels, and returns
 * the most saturated dominant color.
 */
function extractDominantColor(base64: string): Promise<{ primary: string; secondary: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(img.naturalWidth || 64, img.naturalHeight || 64, 128);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ primary: "#047857", secondary: "#0d9488" });
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Accumulate color buckets (divide into 8 buckets per channel)
      const buckets: Map<string, { r: number; g: number; b: number; count: number }> = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue; // skip transparent
        if (r > 230 && g > 230 && b > 230) continue; // skip near-white
        if (r < 20 && g < 20 && b < 20) continue; // skip near-black
        const key = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`;
        const entry = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
        entry.r += r; entry.g += g; entry.b += b; entry.count++;
        buckets.set(key, entry);
      }

      if (buckets.size === 0) {
        resolve({ primary: "#047857", secondary: "#0d9488" });
        return;
      }

      // Find the most saturated dominant bucket
      let bestEntry = { r: 4, g: 120, b: 87, count: 1 };
      let bestSaturation = 0;
      for (const entry of buckets.values()) {
        const avg_r = entry.r / entry.count;
        const avg_g = entry.g / entry.count;
        const avg_b = entry.b / entry.count;
        const max = Math.max(avg_r, avg_g, avg_b);
        const min = Math.min(avg_r, avg_g, avg_b);
        const saturation = max > 0 ? (max - min) / max : 0;
        // Weight by saturation × count
        const score = saturation * entry.count;
        if (score > bestSaturation) { bestSaturation = score; bestEntry = entry; }
      }

      const r = Math.round(bestEntry.r / bestEntry.count);
      const g = Math.round(bestEntry.g / bestEntry.count);
      const b = Math.round(bestEntry.b / bestEntry.count);

      const primary = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      // Secondary: darker shade by mixing with black
      const rs = Math.round(r * 0.75);
      const gs = Math.round(g * 0.75);
      const bs = Math.round(b * 0.75);
      const secondary = `#${rs.toString(16).padStart(2, "0")}${gs.toString(16).padStart(2, "0")}${bs.toString(16).padStart(2, "0")}`;

      resolve({ primary, secondary });
    };
    img.onerror = () => resolve({ primary: "#047857", secondary: "#0d9488" });
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
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      onBrandUpdate({ logo: result, colors: { primary: primaryColor, secondary: secondaryColor } });
      toast.success("Logo uploaded! Click 'Extract Brand Colors' to auto-detect colors.");
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
      const colors = await extractDominantColor(logoPreview);
      setPrimaryColor(colors.primary);
      setSecondaryColor(colors.secondary);
      onBrandUpdate({ logo: logoPreview, colors });
      toast.success(`Brand colors extracted! Primary: ${colors.primary}`);
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
