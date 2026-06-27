import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CardPreview from "@/components/CardPreview";
import AISettings from "@/components/AISettings";
import BrandAssets from "@/components/BrandAssets";
import { useLocation } from "wouter";
import { Sparkles, Settings, Upload, Save, Copy, MessageCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import * as XLSX from "xlsx";
import { resizeImageBase64 } from "@/lib/image-utils";

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
    website: string;
  };
  brandLogo?: string | null;
  brandColors?: {
    primary: string;
    secondary: string;
  };
}

const EXPECTED_HEADERS = {
  name: ["name", "fullname", "full name", "employee name", "candidate name"],
  designation: ["designation", "role", "title", "jobtitle", "job title"],
  phone: ["phone", "mobile", "contact", "phone number", "mobile number"],
  email: ["email", "emailaddress", "email address"],
  address: ["address", "office address", "location"],
  officeName: ["officename", "office name", "company", "company name"],
  officeDetails: ["officedetails", "office details", "tagline", "company details"],
  website: ["website", "site", "webpage", "weburl", "web url", "url"],
  linkedin: ["linkedin", "linkedin url", "linkedin handle"],
  twitter: ["twitter", "x", "twitter handle", "x handle"],
  instagram: ["instagram", "insta", "instagram handle"],
  facebook: ["facebook", "fb", "facebook handle"],
  youtube: ["youtube", "yt", "youtube handle"],
  github: ["github", "github handle"],
  tiktok: ["tiktok", "tiktok handle"],
  whatsapp: ["whatsapp", "whatsapp number"]
};

export default function CardBuilder() {
  const [, navigate] = useLocation();
  const [layoutType, setLayoutType] = useState<"horizontal-no-photo" | "horizontal-with-photo" | "vertical">("horizontal-no-photo");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Custom offsets from the drag editor
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  
  // State for the public share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [savedCardId, setSavedCardId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const bioMutation = trpc.aiGeneration.generateBios.useMutation();
  const taglineMutation = trpc.aiGeneration.generateTaglines.useMutation();
  const saveMutation = trpc.card.create.useMutation();

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
      website: "",
    },
    brandLogo: null,
    brandColors: {
      primary: "#047857",
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

  // Excel / CSV Autofill parser
  const handleAutofillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Check missing columns helper
    const parseRowData = (headers: string[], row: any) => {
      const parsedData: any = { social: {} };
      
      const getColumnValue = (fieldsList: string[]): string => {
        // Find matching header case-insensitively
        const matchedHeader = headers.find(h => fieldsList.includes(h.toLowerCase()));
        if (matchedHeader) {
          return String(row[matchedHeader] || "").trim();
        }
        return "Data Missing";
      };

      // Map basic info
      parsedData.name = getColumnValue(EXPECTED_HEADERS.name);
      parsedData.designation = getColumnValue(EXPECTED_HEADERS.designation);
      parsedData.phone = getColumnValue(EXPECTED_HEADERS.phone);
      parsedData.email = getColumnValue(EXPECTED_HEADERS.email);
      parsedData.address = getColumnValue(EXPECTED_HEADERS.address);
      parsedData.officeName = getColumnValue(EXPECTED_HEADERS.officeName);
      parsedData.officeDetails = getColumnValue(EXPECTED_HEADERS.officeDetails);

      // Map social links
      parsedData.social.linkedin = getColumnValue(EXPECTED_HEADERS.linkedin);
      parsedData.social.twitter = getColumnValue(EXPECTED_HEADERS.twitter);
      parsedData.social.instagram = getColumnValue(EXPECTED_HEADERS.instagram);
      parsedData.social.facebook = getColumnValue(EXPECTED_HEADERS.facebook);
      parsedData.social.youtube = getColumnValue(EXPECTED_HEADERS.youtube);
      parsedData.social.github = getColumnValue(EXPECTED_HEADERS.github);
      parsedData.social.tiktok = getColumnValue(EXPECTED_HEADERS.tiktok);
      parsedData.social.whatsapp = getColumnValue(EXPECTED_HEADERS.whatsapp);
      parsedData.social.website = getColumnValue(EXPECTED_HEADERS.website);

      return parsedData;
    };

    if (file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const lines = csvText.split("\n").map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            toast.error("CSV file is empty or missing headers");
            return;
          }
          const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
          const values = lines[1].split(",").map(v => v.replace(/^["']|["']$/g, "").trim());
          
          const rowObject: any = {};
          headers.forEach((h, idx) => {
            rowObject[h] = values[idx] || "";
          });

          const autofilled = parseRowData(headers, rowObject);
          setCardData((prev) => ({
            ...prev,
            ...autofilled,
            social: { ...prev.social, ...autofilled.social },
          }));
          toast.success("Form autofilled from CSV successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse CSV file");
        }
      };
      reader.readAsText(file);
    } else {
      // Excel sheets
      reader.onload = (event) => {
        try {
          const binary = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(binary, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json<any>(sheet);
          
          if (rows.length === 0) {
            toast.error("Excel sheet is empty");
            return;
          }

          // Extract headers
          const headers = Object.keys(rows[0]);
          const autofilled = parseRowData(headers, rows[0]);

          setCardData((prev) => ({
            ...prev,
            ...autofilled,
            social: { ...prev.social, ...autofilled.social },
          }));
          toast.success("Form autofilled from Excel successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Save Card to database & open sharing dialog
  const handleSaveCard = async () => {
    if (!cardData.name) {
      toast.error("Please enter a card name first");
      return;
    }
    setIsSaving(true);
    try {
      // Compress uploads to prevent row size limits
      const compressedHeadshot = cardData.headshot ? await resizeImageBase64(cardData.headshot, 200, 200) : "";
      const compressedLogo = cardData.brandLogo ? await resizeImageBase64(cardData.brandLogo, 150, 75) : "";

      const socialLinksData = JSON.stringify({
        social: cardData.social,
        brandColors: cardData.brandColors,
        brandLogo: compressedLogo,
        offsets: offsets
      });

      const result = await saveMutation.mutateAsync({
        name: cardData.name,
        designation: cardData.designation,
        phone: cardData.phone,
        email: cardData.email,
        address: cardData.address,
        officeName: cardData.officeName,
        officeDetails: cardData.officeDetails,
        headshotUrl: compressedHeadshot,
        socialLinks: socialLinksData,
        aspectRatio: layoutType === "vertical" ? "3:4" : "16:9"
      });

      if (result.success && result.id) {
        setSavedCardId(result.id);
        setShareModalOpen(true);
        toast.success("Card saved successfully!");
      } else {
        toast.error("Failed to save card");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save card metadata");
    } finally {
      setIsSaving(false);
    }
  };

  const getPublicShareURL = (): string => {
    return savedCardId ? `${window.location.origin}/card/${savedCardId}` : "";
  };

  const handleCopyLink = () => {
    const url = getPublicShareURL();
    navigator.clipboard.writeText(url);
    toast.success("Shareable URL copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    const message = `Check out my digital visiting card! Click to connect:\n\n${cardData.name}\n${cardData.designation}\n\n👉 ${getPublicShareURL()}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GlassCard AI</h1>
            <p className="text-gray-600">Create beautiful, fully clickable digital visiting cards</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/batch-processor")}
              variant="outline"
              className="bg-white hover:bg-teal-50 border-teal-200 text-teal-800"
            >
              Batch Generator
            </Button>
            <Button
              onClick={() => setAiSettingsOpen(true)}
              variant="outline"
              className="gap-2 bg-white hover:bg-gray-50"
            >
              <Settings size={18} />
              AI Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section - Left Column (Clean, tight padding, overlap-free) */}
          <div className="lg:col-span-1">
            <Card className="glass-card p-4 space-y-4 shadow-md bg-white/80 border border-white/20">
              
              {/* Excel / CSV Autofill Dropzone (Top priority for ease-of-use) */}
              <div className="border border-dashed border-teal-300 bg-teal-50/50 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-teal-600 shrink-0" size={24} />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Quick Excel/CSV Autofill</h4>
                    <p className="text-[10px] text-gray-500">Upload candidate rows to fill form</p>
                  </div>
                </div>
                <label className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1">
                  <Upload size={12} />
                  Upload
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleAutofillUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Form Tabs */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="basic" className="text-xs py-1.5">Basic</TabsTrigger>
                  <TabsTrigger value="social" className="text-xs py-1.5">Social</TabsTrigger>
                  <TabsTrigger value="brand" className="text-xs py-1.5">Brand</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-3 mt-3">
                  {/* Headshot Photo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Headshot Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeadshotUpload}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                    {cardData.headshot && (
                      <img
                        src={cardData.headshot}
                        alt="Headshot preview"
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={cardData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Designation</label>
                    <Input
                      placeholder="Product Designer"
                      value={cardData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Phone / Mobile</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={cardData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Email Address</label>
                    <Input
                      placeholder="john@example.com"
                      type="email"
                      value={cardData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Office Address</label>
                    <Textarea
                      placeholder="123 Main St, City, State"
                      value={cardData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="border-gray-200 resize-none h-14 text-sm py-1.5"
                    />
                  </div>

                  {/* Office Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Office Name</label>
                    <Input
                      placeholder="Sorigin Group"
                      value={cardData.officeName}
                      onChange={(e) => handleInputChange("officeName", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Office Details / Tagline */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Office Details / Tagline</label>
                    <Textarea
                      placeholder="Office details or company slogan"
                      value={cardData.officeDetails}
                      onChange={(e) => handleInputChange("officeDetails", e.target.value)}
                      className="border-gray-200 resize-none h-14 text-sm py-1.5"
                    />
                  </div>

                  {/* AI Suggestions Button */}
                  <Button
                    onClick={handleGenerateSuggestions}
                    disabled={bioMutation.isPending || taglineMutation.isPending}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-9 text-xs"
                  >
                    <Sparkles size={14} />
                    {bioMutation.isPending ? "Generating..." : "Generate AI Suggestions"}
                  </Button>
                </TabsContent>

                {/* Social Links Tab */}
                <TabsContent value="social" className="space-y-3 mt-3 max-h-[45vh] overflow-y-auto pr-1">
                  {Object.entries(cardData.social).map(([platform, value]) => (
                    <div key={platform} className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 capitalize">{platform}</label>
                      <Input
                        placeholder={`Your ${platform} URL or handle`}
                        value={value}
                        onChange={(e) => handleInputChange(`social.${platform}`, e.target.value)}
                        className="border-gray-200 h-8 text-sm"
                      />
                    </div>
                  ))}
                </TabsContent>

                {/* Brand Assets Tab */}
                <TabsContent value="brand" className="mt-3">
                  <BrandAssets
                    onBrandUpdate={handleBrandUpdate}
                    currentBrandLogo={cardData.brandLogo}
                    currentBrandColors={cardData.brandColors}
                  />
                </TabsContent>
              </Tabs>

              {/* Card Layout Dropdown (Clean, Portal-Based) */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Card Layout Template</label>
                <Select
                  value={layoutType}
                  onValueChange={(val: any) => setLayoutType(val)}
                >
                  <SelectTrigger className="w-full h-9 border-gray-200 text-sm bg-white">
                    <SelectValue placeholder="Select card template" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    <SelectItem value="horizontal-no-photo">Horizontal (No Photo)</SelectItem>
                    <SelectItem value="horizontal-with-photo">Horizontal (With Photo)</SelectItem>
                    <SelectItem value="vertical">Vertical (3:4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save & Share Card Action (Exposes public mobile page links) */}
              <Button
                onClick={handleSaveCard}
                disabled={isSaving}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-5 rounded-lg flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <Save size={16} />
                {isSaving ? "Saving Card..." : "Save & Share Card"}
              </Button>
            </Card>
          </div>

          {/* Preview Section - Right Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* AI suggestions dialog box */}
            {showSuggestions && (
              <Card className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-teal-800 flex items-center gap-1">
                    <Sparkles size={16} />
                    AI Suggestions
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)} className="text-xs text-gray-500 h-6">
                    Close
                  </Button>
                </div>
                
                {taglineSuggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-teal-700 font-bold">Office Taglines</span>
                    <div className="flex flex-wrap gap-2">
                      {taglineSuggestions.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleInputChange("officeDetails", t)}
                          className="bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs px-2 py-1 rounded-lg text-left"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <CardPreview
              cardData={cardData}
              layoutType={layoutType}
              onOffsetsChange={(newOffsets) => setOffsets(newOffsets)}
              cardId={savedCardId || undefined}
            />
          </div>
        </div>
      </div>

      {/* AI Settings Dialog */}
      {aiSettingsOpen && <AISettings open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />}

      {/* Share / Save Modal */}
      {shareModalOpen && (
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">
                Card Saved successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <p className="text-sm text-gray-600">
                Share this digital visiting card with clients, receivers, and contacts. Scanning the QR code or clicking the link on mobile will open an interactive page with clickable connections!
              </p>
              
              <div className="flex items-center gap-2 border bg-gray-50 p-2.5 rounded-lg">
                <span className="text-xs font-mono text-gray-500 overflow-x-auto whitespace-nowrap flex-1 pr-2">
                  {getPublicShareURL()}
                </span>
                <Button onClick={handleCopyLink} size="sm" variant="outline" className="bg-white">
                  <Copy size={14} className="mr-1" />
                  Copy
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl gap-2 shadow-sm text-xs"
                >
                  <MessageCircle size={16} />
                  Share on WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShareModalOpen(false)}
                  className="flex-1 py-5 rounded-xl text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
