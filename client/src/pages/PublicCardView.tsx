import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import CardPreview from "@/components/CardPreview";
import { resolveCardTheme } from "@/components/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, UserPlus, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { jsPDF } from "jspdf";
import { convertSvgToPngDataUrl } from "@/lib/export-utils";


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

  // Overriding public page layout to ALWAYS render in vertical format design for scanning
  const layoutType = card.headshotUrl ? "vertical-with-photo" : "vertical-no-photo";

  // Generate standard VCF card download
  const handleSaveContact = () => {
    try {
      const nameParts = (card.name || "").trim().split(" ");
      const lastName = nameParts.pop() || "";
      const firstName = nameParts.join(" ");

      const vcard = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${lastName};${firstName};;;`,
        `FN:${card.name || ""}`,
        card.officeName ? `ORG:${card.officeName}` : "",
        card.designation ? `TITLE:${card.designation}` : "",
        card.phone ? `TEL;TYPE=CELL,VOICE:${card.phone}` : "",
        card.telephone ? `TEL;TYPE=WORK,VOICE:${card.telephone}` : "",
        card.email ? `EMAIL;TYPE=PREF,INTERNET:${card.email}` : "",
        social.website ? `URL:${social.website}` : "",
        card.address ? `ADR;TYPE=WORK:;;${card.address};;;;` : "",
        social.linkedin ? `X-SOCIALPROFILE;type=linkedin:${social.linkedin}` : "",
        social.instagram ? `X-SOCIALPROFILE;type=instagram:${social.instagram}` : "",
        "END:VCARD",
      ].filter(Boolean).join("\r\n");

      const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${card.name.replace(/\s+/g, "_")}_contact.vcf`;
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

  const [isExporting, setIsExporting] = useState(false);

  // Generate printable PDF from vertical layouts
  const handleDownloadPDF = async () => {
    const svgEl = document.querySelector("#digital-card-svg") as SVGSVGElement | null;
    if (!svgEl) {
      toast.error("Card preview not found — please wait for page to fully load");
      return;
    }
    setIsExporting(true);
    const safeName = (card.name || "visiting_card").replace(/\s+/g, "_");
    try {
      // High-res print scale = 4 (guarantees pixel-perfect matching and no pixelation)
      const pngUrl = await convertSvgToPngDataUrl(svgEl, 4);
      const vb = svgEl.viewBox?.baseVal;
      const w = vb?.width || 514;
      const h = vb?.height || 760;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [w, h],
        compress: true
      });
      pdf.addImage(pngUrl, "PNG", 0, 0, w, h);
      pdf.save(`${safeName}.pdf`);
      toast.success("PDF visiting card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF card");
    } finally {
      setIsExporting(false);
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSaveContact}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-6 rounded-xl shadow-md gap-2 text-xs"
            >
              <UserPlus size={16} />
              Save Contact
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-6 rounded-xl shadow-md gap-2 text-xs"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isExporting ? "Downloading..." : "Download PDF"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => window.location.href = "/card-builder"}
            className="border-teal-200 text-teal-800 bg-white/70 hover:bg-teal-50 font-semibold py-5 rounded-xl text-xs"
          >
            Create Your Own Digital Card
          </Button>
        </div>
      </div>
    </div>
  );
}
