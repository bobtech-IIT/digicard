import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import CardPreview from "@/components/CardPreview";
import { resolveCardTheme } from "@/components/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, UserPlus, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function PublicCardView() {
  const [, params] = useRoute("/card/:id");
  const cardId = parseInt(params?.id || "");
  
  const { data: card, isLoading, error } = trpc.card.getPublic.useQuery(
    { id: cardId },
    { enabled: !isNaN(cardId), retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
          <p className="text-gray-600 font-medium">Loading digital visiting card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center glass-card shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Card Not Found</h2>
          <p className="text-gray-600 mb-6">The digital visiting card you are trying to access does not exist or has been removed.</p>
          <Button onClick={() => window.location.href = "/"} className="bg-teal-600 hover:bg-teal-700 text-white w-full">
            <Home size={18} className="mr-2" />
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  // Parse custom metadata (social, colors, logo, offsets) from socialLinks column
  let social = {
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: "",
    github: "",
    tiktok: "",
    whatsapp: "",
  };
  let brandColors = {
    primary: "#047857",
    secondary: "#0d9488",
  };
  let brandLogo: string | null = null;
  let offsets = undefined;
  let themeId = "classic-white";
  let fontPairingId = "outfit-jakarta";
  let customBg = "";
  let customTextColor = "";

  try {
    if (card.socialLinks) {
      const parsed = JSON.parse(card.socialLinks);
      if (parsed.social) social = parsed.social;
      if (parsed.brandColors) brandColors = parsed.brandColors;
      if (parsed.brandLogo) brandLogo = parsed.brandLogo;
      if (parsed.offsets) offsets = parsed.offsets;
      if (parsed.themeId) themeId = parsed.themeId;
      if (parsed.fontPairingId) fontPairingId = parsed.fontPairingId;
      if (parsed.customBg) customBg = parsed.customBg;
      if (parsed.customTextColor) customTextColor = parsed.customTextColor;
    }
  } catch (e) {
    // Fallback for raw legacy text
    console.warn("Failed to parse socialLinks metadata JSON, falling back", e);
    if (card.socialLinks) {
      social.linkedin = card.socialLinks;
    }
  }

  // Map database aspectRatio to layoutType
  let layoutType: "horizontal-no-photo" | "horizontal-with-photo" | "vertical-no-photo" | "vertical-with-photo" = "horizontal-no-photo";
  if (card.aspectRatio === "3:4") {
    layoutType = card.headshotUrl ? "vertical-with-photo" : "vertical-no-photo";
  } else {
    layoutType = card.headshotUrl ? "horizontal-with-photo" : "horizontal-no-photo";
  }

  // Generate VCF card download
  const handleSaveContact = () => {
    try {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${card.name || ""}
TITLE:${card.designation || ""}
TEL:${card.phone || ""}
EMAIL:${card.email || ""}
ADR:;;${card.address || ""}
ORG:${card.officeName || ""}
NOTE:${card.officeDetails || ""}
URL;TYPE=WEBSITE:${social.linkedin || ""}
END:VCARD`;

      const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${card.name.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Contact file (.vcf) downloaded! Open it to save to your address book.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download contact card");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Digital Visiting Card
        </h1>
        
        {/* Render interactive vector card preview */}
        <div className="bg-white/40 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-xl">
          <CardPreview
            cardData={{
              headshot: card.headshotUrl || null,
              name: card.name,
              designation: card.designation || "",
              phone: card.phone || "",
              email: card.email || "",
              address: card.address || "",
              officeName: card.officeName || "",
              officeDetails: card.officeDetails || "",
              social,
              brandLogo,
              brandColors,
              themeId,
              fontPairingId,
              customBg,
              customTextColor,
            }}
            layoutType={layoutType}
            savedOffsets={offsets}
            isPublicView={true}
          />
        </div>

        {/* Call to actions for mobile browser */}
        <div className="flex flex-col gap-3 px-4">
          <Button
            onClick={handleSaveContact}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-6 rounded-xl shadow-md gap-2"
          >
            <UserPlus size={20} />
            Save Contact to Phone
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/card-builder"}
            className="border-teal-200 text-teal-800 bg-white/70 hover:bg-teal-50 font-semibold py-6 rounded-xl"
          >
            Create Your Own Digital Card
          </Button>
        </div>
      </div>
    </div>
  );
}
