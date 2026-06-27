import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface BrandAssetsProps {
  onBrandUpdate: (brandData: {
    logo: string | null;
    colors: { primary: string; secondary: string };
  }) => void;
  currentBrandLogo?: string | null;
  currentBrandColors?: { primary: string; secondary: string };
}

export default function BrandAssets({
  onBrandUpdate,
  currentBrandLogo,
  currentBrandColors,
}: BrandAssetsProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(currentBrandLogo || null);
  const [primaryColor, setPrimaryColor] = useState(currentBrandColors?.primary || "#14b8a6");
  const [secondaryColor, setSecondaryColor] = useState(currentBrandColors?.secondary || "#0d9488");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeBrandMutation = trpc.aiGeneration.analyzeBrand.useMutation();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        onBrandUpdate({
          logo: result,
          colors: { primary: primaryColor, secondary: secondaryColor },
        });
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (color: string, type: "primary" | "secondary") => {
    if (type === "primary") {
      setPrimaryColor(color);
    } else {
      setSecondaryColor(color);
    }
    onBrandUpdate({
      logo: logoPreview,
      colors: {
        primary: type === "primary" ? color : primaryColor,
        secondary: type === "secondary" ? color : secondaryColor,
      },
    });
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    onBrandUpdate({
      logo: null,
      colors: { primary: primaryColor, secondary: secondaryColor },
    });
    toast.success("Logo removed");
  };

  const handleAnalyzeBrand = async () => {
    if (!logoPreview) {
      toast.error("Please upload a logo first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeBrandMutation.mutateAsync({
        logoBase64: logoPreview,
      });

      if (result.success) {
        setPrimaryColor(result.colors.primary);
        setSecondaryColor(result.colors.secondary);
        onBrandUpdate({
          logo: logoPreview,
          colors: {
            primary: result.colors.primary,
            secondary: result.colors.secondary,
          },
        });
        toast.success("Brand colors analyzed and applied!");
      } else {
        toast.error(result.message || "Failed to analyze brand");
      }
    } catch (error) {
      console.error("Brand analysis error:", error);
      toast.error("Failed to analyze brand colors");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card className="glass-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brand Logo</h3>
          <p className="text-sm text-gray-600">Upload your company logo (PNG, JPG, SVG - max 5MB)</p>
        </div>

        {logoPreview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-teal-200">
              <div className="h-16 w-auto max-w-xs">
                <img
                  src={logoPreview}
                  alt="Brand Logo Preview"
                  className="h-full w-auto object-contain"
                />
              </div>
              <Button
                onClick={handleRemoveLogo}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <X size={18} />
              </Button>
            </div>
            <Button
              onClick={handleAnalyzeBrand}
              disabled={isAnalyzing}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <Sparkles size={18} />
              {isAnalyzing ? "Analyzing..." : "Analyze Brand Colors"}
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-teal-300 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors">
            <Upload size={32} className="text-teal-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Click to upload logo</span>
            <span className="text-xs text-gray-600">or drag and drop</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        )}
      </Card>

      {/* Brand Colors */}
      <Card className="glass-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brand Colors</h3>
          <p className="text-sm text-gray-600">Customize your card's color scheme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primary-color" className="text-sm font-medium">
              Primary Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value, "primary")}
                className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value, "primary")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                placeholder="#14b8a6"
              />
            </div>
            <div
              className="h-12 rounded-lg border-2 border-gray-200 transition-all"
              style={{ backgroundColor: primaryColor }}
            />
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label htmlFor="secondary-color" className="text-sm font-medium">
              Secondary Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => handleColorChange(e.target.value, "secondary")}
                className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => handleColorChange(e.target.value, "secondary")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                placeholder="#0d9488"
              />
            </div>
            <div
              className="h-12 rounded-lg border-2 border-gray-200 transition-all"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Upload your logo and use AI to automatically extract brand colors.
          These colors will be applied to your visiting card for a cohesive branded look.
        </p>
      </div>
    </div>
  );
}
