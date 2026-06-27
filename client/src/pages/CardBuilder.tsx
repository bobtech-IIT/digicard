import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CardPreview from "@/components/CardPreview";
import AISettings from "@/components/AISettings";
import BrandAssets from "@/components/BrandAssets";
import { useLocation } from "wouter";
import { Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CardData {
  headshot: string | null;
  name: string;
  designation: string;
  phone: string;
  email: string;
  address: string;
  officeName: string;
  officeDetails: string;
  social: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
    github: string;
    tiktok: string;
    whatsapp: string;
  };
  brandLogo?: string | null;
  brandColors?: {
    primary: string;
    secondary: string;
  };
}

export default function CardBuilder() {
  const [, navigate] = useLocation();
  const [layoutType, setLayoutType] = useState<"horizontal-no-photo" | "horizontal-with-photo" | "vertical">("horizontal-no-photo");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const bioMutation = trpc.aiGeneration.generateBios.useMutation();
  const taglineMutation = trpc.aiGeneration.generateTaglines.useMutation();

  const [cardData, setCardData] = useState<CardData>({
    headshot: null,
    name: "",
    designation: "",
    phone: "",
    email: "",
    address: "",
    officeName: "",
    officeDetails: "",
    social: {
      linkedin: "",
      twitter: "",
      instagram: "",
      facebook: "",
      youtube: "",
      github: "",
      tiktok: "",
      whatsapp: "",
    },
    brandLogo: null,
    brandColors: {
      primary: "#14b8a6",
      secondary: "#0d9488",
    },
  });

  const handleHeadshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData((prev) => ({
          ...prev,
          headshot: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setCardData((prev) => {
        const parentData = prev[parent as keyof CardData];
        if (typeof parentData === "object" && parentData !== null) {
          return {
            ...prev,
            [parent]: {
              ...(parentData as Record<string, string>),
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setCardData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBrandUpdate = (brandData: {
    logo: string | null;
    colors: { primary: string; secondary: string };
  }) => {
    setCardData((prev) => ({
      ...prev,
      brandLogo: brandData.logo,
      brandColors: brandData.colors,
    }));
  };

  const handleGenerateSuggestions = async () => {
    if (!cardData.name || !cardData.designation) {
      toast.error("Please enter name and designation first");
      return;
    }
    try {
      const [bios, taglines] = await Promise.all([
        bioMutation.mutateAsync({
          name: cardData.name,
          designation: cardData.designation,
        }),
        taglineMutation.mutateAsync({
          designation: cardData.designation,
        }),
      ]);
      setBioSuggestions(bios.bios);
      setTaglineSuggestions(taglines.taglines);
      setShowSuggestions(true);
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GlassCard AI</h1>
            <p className="text-gray-600">Create stunning digital visiting cards</p>
          </div>
          <Button
            onClick={() => setAiSettingsOpen(true)}
            variant="outline"
            className="gap-2 bg-white hover:bg-gray-50"
          >
            <Settings size={18} />
            AI Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Left Column */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-8 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="brand">Brand</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Headshot Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Headshot Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeadshotUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {cardData.headshot && (
                      <img
                        src={cardData.headshot}
                        alt="Headshot preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={cardData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Designation</label>
                    <Input
                      placeholder="Product Designer"
                      value={cardData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Phone</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={cardData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Email</label>
                    <Input
                      placeholder="john@example.com"
                      type="email"
                      value={cardData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Address</label>
                    <Textarea
                      placeholder="123 Main St, City, State"
                      value={cardData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="border-gray-300 resize-none h-20"
                    />
                  </div>

                  {/* Office Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Office Name</label>
                    <Input
                      placeholder="Company Name"
                      value={cardData.officeName}
                      onChange={(e) => handleInputChange("officeName", e.target.value)}
                      className="border-gray-300"
                    />
                  </div>

                  {/* Office Details */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Office Details</label>
                    <Textarea
                      placeholder="Office address and details"
                      value={cardData.officeDetails}
                      onChange={(e) => handleInputChange("officeDetails", e.target.value)}
                      className="border-gray-300 resize-none h-20"
                    />
                  </div>

                  {/* AI Suggestions Button */}
                  <Button
                    onClick={handleGenerateSuggestions}
                    disabled={bioMutation.isPending || taglineMutation.isPending}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
                  >
                    <Sparkles size={18} />
                    {bioMutation.isPending ? "Generating..." : "Generate Suggestions"}
                  </Button>
                </TabsContent>

                {/* Social Links Tab */}
                <TabsContent value="social" className="space-y-4 mt-4">
                  {Object.entries(cardData.social).map(([platform, value]) => (
                    <div key={platform} className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 capitalize">{platform}</label>
                      <Input
                        placeholder={`Your ${platform} profile URL or handle`}
                        value={value}
                        onChange={(e) => handleInputChange(`social.${platform}`, e.target.value)}
                        className="border-gray-300"
                      />
                    </div>
                  ))}
                </TabsContent>

                {/* Brand Assets Tab */}
                <TabsContent value="brand" className="mt-4">
                  <BrandAssets
                    onBrandUpdate={handleBrandUpdate}
                    currentBrandLogo={cardData.brandLogo}
                    currentBrandColors={cardData.brandColors}
                  />
                </TabsContent>
              </Tabs>

              {/* Card Layout Selector */}
              <div className="pt-4 border-t border-white/20 space-y-2">
                <label className="text-sm font-medium text-gray-900">Card Layout</label>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setLayoutType("horizontal-no-photo")}
                    variant={layoutType === "horizontal-no-photo" ? "default" : "outline"}
                    className={layoutType === "horizontal-no-photo" ? "bg-teal-600" : ""}
                  >
                    Horizontal (No Photo)
                  </Button>
                  <Button
                    onClick={() => setLayoutType("horizontal-with-photo")}
                    variant={layoutType === "horizontal-with-photo" ? "default" : "outline"}
                    className={layoutType === "horizontal-with-photo" ? "bg-teal-600" : ""}
                  >
                    Horizontal (With Photo)
                  </Button>
                  <Button
                    onClick={() => setLayoutType("vertical")}
                    variant={layoutType === "vertical" ? "default" : "outline"}
                    className={layoutType === "vertical" ? "bg-teal-600" : ""}
                  >
                    Vertical
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview Section - Right Column */}
          <div className="lg:col-span-2">
            <CardPreview cardData={cardData} layoutType={layoutType} />
          </div>
        </div>
      </div>

      {/* AI Settings Dialog */}
      {aiSettingsOpen && <AISettings open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />}
    </div>
  );
}
