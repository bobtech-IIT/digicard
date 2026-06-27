import { useRef, useState, useEffect } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Share2, MessageCircle, Move } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { convertSvgToPngDataUrl } from "@/lib/export-utils";

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
    website?: string;
  };
  brandLogo?: string | null;
  brandColors?: {
    primary: string;
    secondary: string;
  };
}

interface CardPreviewProps {
  cardData: CardData;
  layoutType: "horizontal-no-photo" | "horizontal-with-photo" | "vertical";
  savedOffsets?: Record<string, { x: number; y: number }>;
  onOffsetsChange?: (offsets: Record<string, { x: number; y: number }>) => void;
  isPublicView?: boolean;
  cardId?: number;
}

const RAW_ICONS = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  email: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
  emailLine: "M22 6l-10 7L2 6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
  mapPinCircle: "M12 10 A 3 3 0 1 1 12 9.99 Z",
  globe: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 20c-4 0-7-4.5-7-10S8 2 12 2s7 4.5 7 10-3 10-7 10z M2 12h20",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2zm2-5a2 2 0 1 1-2 2 2 2 0 0 1 2-2z",
  instagram: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zm-5 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm5.25-8.25a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25z",
  youtube: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z M9.75 15.02V8.48L15.5 11.75z",
  twitter: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
};

export default function CardPreview({
  cardData,
  layoutType,
  savedOffsets,
  onOffsetsChange,
  isPublicView = false,
  cardId
}: CardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize coordinate translation offsets
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({
    name: { x: 0, y: 0 },
    designation: { x: 0, y: 0 },
    logo: { x: 0, y: 0 },
    qr: { x: 0, y: 0 },
    contacts: { x: 0, y: 0 },
    address: { x: 0, y: 0 },
    socials: { x: 0, y: 0 },
    photo: { x: 0, y: 0 },
  });

  // Sync offsets from database when loaded
  useEffect(() => {
    if (savedOffsets) {
      setOffsets((prev) => ({ ...prev, ...savedOffsets }));
    }
  }, [savedOffsets]);

  // Bubble up offsets when changed
  const updateOffsets = (newOffsets: Record<string, { x: number; y: number }>) => {
    setOffsets(newOffsets);
    if (onOffsetsChange) {
      onOffsetsChange(newOffsets);
    }
  };

  // Helper to split full name: first part(s) in black, last part in green
  const splitName = (fullName: string): [string, string] => {
    const trimmed = fullName.trim();
    if (!trimmed) return ["FULL", "NAME"];
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return [parts[0].toUpperCase(), ""];
    }
    const lastName = parts[parts.length - 1].toUpperCase();
    const firstName = parts.slice(0, parts.length - 1).join(" ").toUpperCase();
    return [firstName, lastName];
  };

  const [firstName, lastName] = splitName(cardData.name || "Babu Chakraborty");

  const brandColors = {
    primary: cardData.brandColors?.primary || "#047857",
    secondary: cardData.brandColors?.secondary || "#0d9488"
  };

  // vCard generator
  const generateVCard = (): string => {
    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.name || ""}
TITLE:${cardData.designation || ""}
TEL:${cardData.phone || ""}
EMAIL:${cardData.email || ""}
ADR:;;${cardData.address || ""}
ORG:${cardData.officeName || ""}
NOTE:${cardData.officeDetails || ""}`;
    if (cardData.social.website) vcard += `\nURL;TYPE=WEBSITE:${cardData.social.website}`;
    vcard += `\nEND:VCARD`;
    return vcard;
  };

  // QR Code Redirect Route: uses company website entered by user, falls back to public card link
  const getQRRedirectURL = (): string => {
    const website = cardData.social.website?.trim();
    if (website) {
      return website.startsWith("http") ? website : `https://${website}`;
    }
    if (cardId) {
      return `${window.location.origin}/card/${cardId}`;
    }
    return "https://www.sorigin.in";
  };

  // SVG Mouse handlers for dragging offsets
  const handleMouseDown = (e: React.MouseEvent, item: string) => {
    if (!editorMode || isPublicView) return;
    e.preventDefault();
    setDraggedItem(item);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !editorMode || isPublicView) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const viewBoxWidth = layoutType === "vertical" ? 600 : 800;
    const viewBoxHeight = layoutType === "vertical" ? 900 : 450;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;

    const newOffsets = {
      ...offsets,
      [draggedItem]: {
        x: (offsets[draggedItem]?.x || 0) + dx * scaleX,
        y: (offsets[draggedItem]?.y || 0) + dy * scaleY,
      }
    };
    updateOffsets(newOffsets);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  const downloadSVG = () => {
    const svgEl = document.getElementById("digital-card-svg") as unknown as SVGSVGElement;
    if (!svgEl) {
      toast.error("SVG Element not found");
      return;
    }
    try {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(cardData.name || "digital-card").replace(/\s+/g, "_")}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("SVG downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download SVG");
    }
  };

  const downloadPNG = async () => {
    const svgEl = document.getElementById("digital-card-svg") as unknown as SVGSVGElement;
    if (!svgEl) {
      toast.error("SVG Element not found");
      return;
    }
    setIsExporting(true);
    try {
      const pngDataUrl = await convertSvgToPngDataUrl(svgEl, 3);
      const link = document.createElement("a");
      link.href = pngDataUrl;
      link.download = `${(cardData.name || "digital-card").replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PNG");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    const svgEl = document.getElementById("digital-card-svg") as unknown as SVGSVGElement;
    if (!svgEl) {
      toast.error("SVG Element not found");
      return;
    }
    setIsExporting(true);
    try {
      const pngDataUrl = await convertSvgToPngDataUrl(svgEl, 3);
      const viewBoxWidth = svgEl.viewBox?.baseVal?.width || 800;
      const viewBoxHeight = svgEl.viewBox?.baseVal?.height || 450;

      const pdf = new jsPDF({
        orientation: layoutType === "vertical" ? "portrait" : "landscape",
        unit: "px",
        format: [viewBoxWidth, viewBoxHeight],
      });

      pdf.addImage(pngDataUrl, "PNG", 0, 0, viewBoxWidth, viewBoxHeight);
      pdf.save(`${(cardData.name || "digital-card").replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp share sends public URL link so that receivers open mobile active web pages
  const shareWhatsApp = () => {
    try {
      const shareUrl = cardId
        ? `${window.location.origin}/card/${cardId}`
        : window.location.href;

      const message = `Check out my digital visiting card! Click the link to connect:\n\n${cardData.name}\n${cardData.designation}\n\n👉 ${shareUrl}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappURL, "_blank");
      toast.success("Opening WhatsApp share URL...");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("Failed to share on WhatsApp");
    }
  };

  // Render SVG structure
  const renderSvgCard = () => {
    // Shared styling to make anchors hover nicely in SVG
    const svgStyle = (
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap');
          text, tspan { font-family: 'Poppins', 'Helvetica Neue', sans-serif; }
          a { cursor: pointer; text-decoration: none; }
          a:hover { opacity: 0.8; }
          .draggable-rect { stroke: #0ea5e9; stroke-width: 1.5; stroke-dasharray: 4 4; fill: rgba(14, 165, 233, 0.04); }
        `}
      </style>
    );

    if (layoutType === "horizontal-no-photo") {
      return (
        <svg
          id="digital-card-svg"
          ref={svgRef}
          viewBox="0 0 800 450"
          className="w-full h-full object-contain select-none"
          xmlns="http://www.w3.org/2000/svg"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>{svgStyle}</defs>

          {/* Background */}
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0})`}
          >
            {editorMode && <rect x="630" y="15" width="125" height="48" rx="6" className="draggable-rect" />}
            <rect x="635" y="20" width="115" height="38" rx="4" stroke={brandColors.primary} strokeWidth="1" fill="none" />
            {cardData.brandLogo ? (
              <image href={cardData.brandLogo} x="637" y="22" width="111" height="34" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="692.5" y="43" textAnchor="middle" fontSize="12" fontWeight="500" fill={brandColors.primary}>Logo</text>
            )}
          </g>

          {/* Name Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "name")}
            transform={`translate(${offsets.name?.x || 0}, ${offsets.name?.y || 0})`}
          >
            {editorMode && <rect x="45" y="60" width="450" height="110" rx="6" className="draggable-rect" />}
            <text x="50" y="105" fontSize="48" fontWeight="700" fill="#000000">{firstName}</text>
            {lastName && <text x="50" y="152" fontSize="48" fontWeight="700" fill={brandColors.primary}>{lastName}</text>}
            <line x1="50" y1="178" x2="95" y2="178" stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Company */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="45" y="190" width="450" height="55" rx="6" className="draggable-rect" />}
            <text x="50" y="212" fontSize="18" fontWeight="700" fill="#000000">{cardData.designation || "Head of Marketing"}</text>
            <text x="50" y="234" fontSize="18" fontWeight="500" fill={brandColors.primary}>{cardData.officeName || "Sorigin Group"}</text>
          </g>

          {/* Row 1 Divider */}
          <line x1="50" y1="265" x2="750" y2="265" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Contacts Row (Tight spacing, email column shifted left to avoid QR overlap) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0})`}
          >
            {editorMode && <rect x="45" y="270" width="550" height="40" rx="6" className="draggable-rect" />}
            
            {/* Phone (Clickable dialer) */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="63" cy="292" r="13" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(56.5, 285.5) scale(0.55)" />
              <text x="83" y="297" fontSize="11" fontWeight="600" fill="#000000">{cardData.phone || "+91 98220 12345"}</text>
            </a>

            <line x1="210" y1="282" x2="210" y2="302" stroke="#d1d5db" strokeWidth="1.5" />

            {/* WhatsApp (Clickable chat) */}
            <a href={`https://wa.me/${(cardData.phone || "").replace(/[^0-9]/g, "")}`} target="_blank">
              <circle cx="225" cy="292" r="13" fill={brandColors.primary} />
              <path d={RAW_ICONS.whatsapp} fill="#ffffff" transform="translate(218.5, 285.5) scale(0.55)" />
              <text x="245" y="297" fontSize="11" fontWeight="600" fill="#000000">{cardData.phone || "+91 98220 12345"}</text>
            </a>

            <line x1="380" y1="282" x2="380" y2="302" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Email (Clickable mailto) */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="395" cy="292" r="13" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(388.5, 285.5) scale(0.55)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(388.5, 285.5) scale(0.55)" />
              <text x="415" y="297" fontSize="11" fontWeight="600" fill="#000000">{cardData.email || "babu.chakraborty@sorigin.in"}</text>
            </a>
          </g>

          {/* Row 2 Divider */}
          <line x1="50" y1="320" x2="750" y2="320" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Address Row */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "address")}
            transform={`translate(${offsets.address?.x || 0}, ${offsets.address?.y || 0})`}
          >
            {editorMode && <rect x="45" y="330" width="550" height="40" rx="6" className="draggable-rect" />}
            <path d={RAW_ICONS.mapPin} fill={brandColors.primary} transform="translate(52, 335) scale(0.85)" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" transform="translate(52, 335) scale(0.85)" />
            <text x="88" y="352" fontSize="12" fontWeight="700" fill="#000000">{cardData.officeName || "Sorigin Group Pvt. Ltd."}</text>
            <text x="235" y="352" fontSize="11" fontWeight="500" fill="#000000">|  {cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089"}</text>
          </g>

          {/* Row 3 Divider */}
          <line x1="50" y1="375" x2="750" y2="375" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Social Row (Interactive icons with links) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "socials")}
            transform={`translate(${offsets.socials?.x || 0}, ${offsets.socials?.y || 0})`}
          >
            {editorMode && <rect x="45" y="390" width="550" height="40" rx="6" className="draggable-rect" />}
            
            {/* LinkedIn */}
            <a href={cardData.social.linkedin || "#"} target="_blank">
              <circle cx="65" cy="408" r="12" fill="#0077b5" />
              <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(58.5, 401.5) scale(0.55)" />
              <text x="85" y="413" fontSize="11" fontWeight="500" fill="#000000">LinkedIn</text>
            </a>

            <line x1="165" y1="398" x2="165" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Instagram */}
            <a href={cardData.social.instagram || "#"} target="_blank">
              <circle cx="185" cy="408" r="12" fill="#e1306c" />
              <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(178.5, 401.5) scale(0.55)" />
              <text x="205" y="413" fontSize="11" fontWeight="500" fill="#000000">Instagram</text>
            </a>

            <line x1="290" y1="398" x2="290" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* YouTube */}
            <a href={cardData.social.youtube || "#"} target="_blank">
              <circle cx="310" cy="408" r="12" fill="#ff0000" />
              <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(303.5, 401.5) scale(0.55)" />
              <text x="330" y="413" fontSize="11" fontWeight="500" fill="#000000">YouTube</text>
            </a>

            <line x1="405" y1="398" x2="405" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Twitter */}
            <a href={cardData.social.twitter || "#"} target="_blank">
              <circle cx="425" cy="408" r="12" fill="#1da1f2" />
              <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(418.5, 401.5) scale(0.55)" />
              <text x="445" y="413" fontSize="11" fontWeight="500" fill="#000000">Twitter</text>
            </a>

            <line x1="510" y1="398" x2="510" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Facebook */}
            <a href={cardData.social.facebook || "#"} target="_blank">
              <circle cx="530" cy="408" r="12" fill="#1877f2" />
              <path d={RAW_ICONS.facebook} fill="#ffffff" transform="translate(523.5, 401.5) scale(0.55)" />
              <text x="550" y="413" fontSize="11" fontWeight="500" fill="#000000">Facebook</text>
            </a>
          </g>

          {/* QR Code Container (Clickable and aligns perfectly) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "qr")}
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0})`}
          >
            {editorMode && <rect x="630" y="215" width="125" height="135" rx="6" className="draggable-rect" />}
            
            <a href={getQRRedirectURL()} target="_blank">
              <rect x="635" y="220" width="115" height="115" rx="8" stroke={brandColors.primary} strokeWidth="1.5" fill="#ffffff" />
              <svg x="645" y="228" width="95" height="95">
                <QRCode value={getQRRedirectURL()} size={95} level="H" includeMargin={false} />
              </svg>
              <rect x="635" y="323" width="115" height="20" rx="4" fill={brandColors.primary} />
              <text x="692.5" y="336" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">SCAN TO CONNECT</text>
            </a>
          </g>
        </svg>
      );
    } else if (layoutType === "horizontal-with-photo") {
      return (
        <svg
          id="digital-card-svg"
          ref={svgRef}
          viewBox="0 0 800 450"
          className="w-full h-full object-contain select-none"
          xmlns="http://www.w3.org/2000/svg"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {svgStyle}
            <clipPath id="circle-photo-clip">
              <circle cx="170" cy="210" r="100" />
            </clipPath>
          </defs>

          {/* Background */}
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0})`}
          >
            {editorMode && <rect x="630" y="15" width="125" height="48" rx="6" className="draggable-rect" />}
            <rect x="635" y="20" width="115" height="38" rx="4" stroke={brandColors.primary} strokeWidth="1" fill="none" />
            {cardData.brandLogo ? (
              <image href={cardData.brandLogo} x="637" y="22" width="111" height="34" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="692.5" y="43" textAnchor="middle" fontSize="12" fontWeight="500" fill={brandColors.primary}>Logo</text>
            )}
          </g>

          {/* Profile Photo */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "photo")}
            transform={`translate(${offsets.photo?.x || 0}, ${offsets.photo?.y || 0})`}
          >
            {editorMode && <rect x="60" y="100" width="220" height="220" rx="12" className="draggable-rect" />}
            <circle cx="170" cy="210" r="103" stroke="#e5e7eb" strokeWidth="1" fill="none" />
            <circle cx="170" cy="210" r="100" fill="#f3f4f6" />
            {cardData.headshot ? (
              <image href={cardData.headshot} x="70" y="110" width="200" height="200" clipPath="url(#circle-photo-clip)" preserveAspectRatio="xMidYMid slice" />
            ) : (
              <g>
                <circle cx="170" cy="190" r="30" fill="#9ca3af" />
                <path d="M110,265 C110,225 130,220 170,220 C210,220 230,225 230,265 Z" fill="#9ca3af" clipPath="url(#circle-photo-clip)" />
                <text x="170" y="275" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280">UPLOAD PHOTO</text>
              </g>
            )}
            <circle cx="170" cy="210" r="100" stroke="#ffffff" strokeWidth="6" fill="none" />
          </g>

          {/* Name & Title Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "name")}
            transform={`translate(${offsets.name?.x || 0}, ${offsets.name?.y || 0})`}
          >
            {editorMode && <rect x="305" y="60" width="300" height="110" rx="6" className="draggable-rect" />}
            <text x="315" y="105" fontSize="48" fontWeight="700" fill="#000000">{firstName}</text>
            {lastName && <text x="315" y="152" fontSize="48" fontWeight="700" fill={brandColors.primary}>{lastName}</text>}
            <line x1="315" y1="178" x2="360" y2="178" stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Company */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="305" y="190" width="300" height="55" rx="6" className="draggable-rect" />}
            <text x="315" y="212" fontSize="18" fontWeight="700" fill="#000000">{cardData.designation || "Head of Marketing"}</text>
            <text x="315" y="234" fontSize="18" fontWeight="500" fill={brandColors.primary}>{cardData.officeName || "Sorigin Group"}</text>
          </g>

          {/* Contact Details (Vertical List, Clickable) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0})`}
          >
            {editorMode && <rect x="305" y="255" width="300" height="130" rx="6" className="draggable-rect" />}
            
            {/* Phone */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="327" cy="272" r="11" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(321.5, 266.5) scale(0.45)" />
              <text x="348" y="276" fontSize="12" fontWeight="600" fill="#000000">{cardData.phone || "+91 98220 12345"}</text>
            </a>

            {/* Email */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="327" cy="304" r="11" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(321.5, 298.5) scale(0.45)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(321.5, 298.5) scale(0.45)" />
              <text x="348" y="308" fontSize="12" fontWeight="600" fill="#000000">{cardData.email || "babu.chakraborty@sorigin.in"}</text>
            </a>

            {/* Website */}
            <a href={cardData.social.website || "https://www.sorigin.in"} target="_blank">
              <circle cx="327" cy="336" r="11" fill={brandColors.primary} />
              <path d={RAW_ICONS.globe} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(321.5, 330.5) scale(0.45)" />
              <text x="348" y="340" fontSize="12" fontWeight="600" fill="#000000">{cardData.social.website || "www.sorigin.in"}</text>
            </a>

            {/* Location */}
            <circle cx="327" cy="368" r="11" fill={brandColors.primary} />
            <path d={RAW_ICONS.mapPin} fill="#ffffff" transform="translate(321.5, 362.5) scale(0.45)" />
            <text x="348" y="372" fontSize="12" fontWeight="600" fill="#000000">{cardData.address ? cardData.address.split(",").slice(-3).join(", ").trim() : "Pune, Maharashtra, India"}</text>
          </g>

          {/* QR Code Container */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "qr")}
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0})`}
          >
            {editorMode && <rect x="630" y="200" width="125" height="135" rx="6" className="draggable-rect" />}
            
            <a href={getQRRedirectURL()} target="_blank">
              <rect x="635" y="205" width="115" height="115" rx="8" stroke={brandColors.primary} strokeWidth="1.5" fill="#ffffff" />
              <svg x="645" y="213" width="95" height="95">
                <QRCode value={getQRRedirectURL()} size={95} level="H" includeMargin={false} />
              </svg>
              <rect x="635" y="308" width="115" height="20" rx="4" fill={brandColors.primary} />
              <text x="692.5" y="321" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">SCAN TO CONNECT</text>
            </a>
          </g>

          {/* Divider above bottom bar */}
          <line x1="50" y1="398" x2="750" y2="398" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom Bar: Address on Left, Socials on Right */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "address")}
            transform={`translate(${offsets.address?.x || 0}, ${offsets.address?.y || 0})`}
          >
            {editorMode && <rect x="45" y="398" width="710" height="45" rx="6" className="draggable-rect" />}
            
            {/* Address */}
            <path d={RAW_ICONS.mapPin} fill={brandColors.primary} transform="translate(52, 405) scale(0.7)" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" transform="translate(52, 405) scale(0.7)" />
            <text x="75" y="418" fontSize="10" fontWeight="700" fill="#000000">{cardData.officeName || "Sorigin Group Pvt. Ltd."}</text>
            <text x="75" y="430" fontSize="9" fontWeight="500" fill="#6b7280">{cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089"}</text>

            {/* Social Icons (Clickable) */}
            <g transform="translate(0, 0)">
              {/* LinkedIn */}
              <a href={cardData.social.linkedin || "#"} target="_blank">
                <circle cx="480" cy="413" r="10" fill="#0077b5" />
                <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(475, 408) scale(0.42)" />
                <text x="480" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">LinkedIn</text>
              </a>

              {/* Instagram */}
              <a href={cardData.social.instagram || "#"} target="_blank">
                <circle cx="535" cy="413" r="10" fill="#e1306c" />
                <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(530, 408) scale(0.42)" />
                <text x="535" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Instagram</text>
              </a>

              {/* YouTube */}
              <a href={cardData.social.youtube || "#"} target="_blank">
                <circle cx="590" cy="413" r="10" fill="#ff0000" />
                <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(585, 408) scale(0.42)" />
                <text x="590" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">YouTube</text>
              </a>

              {/* Twitter */}
              <a href={cardData.social.twitter || "#"} target="_blank">
                <circle cx="645" cy="413" r="10" fill="#1da1f2" />
                <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(640, 408) scale(0.42)" />
                <text x="645" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Twitter</text>
              </a>

              {/* Facebook */}
              <a href={cardData.social.facebook || "#"} target="_blank">
                <circle cx="700" cy="413" r="10" fill="#1877f2" />
                <path d={RAW_ICONS.facebook} fill="#ffffff" transform="translate(695, 408) scale(0.42)" />
                <text x="700" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Facebook</text>
              </a>
            </g>
          </g>
        </svg>
      );
    } else {
      // Vertical
      return (
        <svg
          id="digital-card-svg"
          ref={svgRef}
          viewBox="0 0 600 900"
          className="w-full h-full object-contain select-none"
          xmlns="http://www.w3.org/2000/svg"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {svgStyle}
            <clipPath id="rect-photo-clip">
              <rect x="380" y="120" width="180" height="220" rx="12" />
            </clipPath>
          </defs>

          {/* Background */}
          <rect width="600" height="900" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0})`}
          >
            {editorMode && <rect x="440" y="25" width="125" height="48" rx="6" className="draggable-rect" />}
            <rect x="445" y="30" width="115" height="38" rx="4" stroke={brandColors.primary} strokeWidth="1" fill="none" />
            {cardData.brandLogo ? (
              <image href={cardData.brandLogo} x="447" y="32" width="111" height="34" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="502.5" y="53" textAnchor="middle" fontSize="12" fontWeight="500" fill={brandColors.primary}>Logo</text>
            )}
          </g>

          {/* Profile Photo */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "photo")}
            transform={`translate(${offsets.photo?.x || 0}, ${offsets.photo?.y || 0})`}
          >
            {editorMode && <rect x="375" y="115" width="190" height="230" rx="12" className="draggable-rect" />}
            <rect x="380" y="120" width="180" height="220" rx="12" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" />
            {cardData.headshot ? (
              <image href={cardData.headshot} x="380" y="120" width="180" height="220" clipPath="url(#rect-photo-clip)" preserveAspectRatio="xMidYMid slice" />
            ) : (
              <g>
                <circle cx="470" cy="200" r="30" fill="#9ca3af" />
                <path d="M420,280 C420,240 440,230 470,230 C500,230 520,240 520,280 Z" fill="#9ca3af" clipPath="url(#rect-photo-clip)" />
                <text x="470" y="290" textAnchor="middle" fontSize="12" fontWeight="600" fill="#6b7280">UPLOAD PHOTO</text>
              </g>
            )}
          </g>

          {/* Name Section */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "name")}
            transform={`translate(${offsets.name?.x || 0}, ${offsets.name?.y || 0})`}
          >
            {editorMode && <rect x="35" y="130" width="330" height="120" rx="6" className="draggable-rect" />}
            <text x="40" y="175" fontSize="36" fontWeight="700" fill="#000000">{firstName}</text>
            {lastName && <text x="40" y="215" fontSize="36" fontWeight="700" fill={brandColors.primary}>{lastName}</text>}
            <line x1="40" y1="238" x2="85" y2="238" stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Company */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="35" y="255" width="330" height="60" rx="6" className="draggable-rect" />}
            <text x="40" y="272" fontSize="18" fontWeight="700" fill="#000000">{cardData.designation || "Head of Marketing"}</text>
            <text x="40" y="294" fontSize="18" fontWeight="500" fill={brandColors.primary}>{cardData.officeName || "Sorigin Group"}</text>
          </g>

          {/* 2x2 Grid of Contacts */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0})`}
          >
            {editorMode && <rect x="35" y="390" width="530" height="150" rx="6" className="draggable-rect" />}
            
            {/* Phone */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="65" cy="420" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(56, 411) scale(0.75)" />
              <text x="95" y="415" fontSize="11" fontWeight="700" fill="#000000">PHONE</text>
              <text x="95" y="433" fontSize="13" fontWeight="600" fill="#000000">{cardData.phone || "+91 98220 12345"}</text>
            </a>

            {/* WhatsApp */}
            <a href={`https://wa.me/${(cardData.phone || "").replace(/[^0-9]/g, "")}`} target="_blank">
              <circle cx="330" cy="420" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.whatsapp} fill="#ffffff" transform="translate(321, 411) scale(0.75)" />
              <text x="360" y="415" fontSize="11" fontWeight="700" fill="#000000">WHATSAPP</text>
              <text x="360" y="433" fontSize="13" fontWeight="600" fill="#000000">{cardData.phone || "+91 98220 12345"}</text>
            </a>

            {/* Email */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="65" cy="500" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(56, 491) scale(0.75)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(56, 491) scale(0.75)" />
              <text x="95" y="495" fontSize="11" fontWeight="700" fill="#000000">EMAIL</text>
              <text x="95" y="513" fontSize="13" fontWeight="600" fill="#000000">{cardData.email || "babu.chakraborty@sorigin.in"}</text>
            </a>

            {/* Website */}
            <a href={cardData.social.website || "https://www.sorigin.in"} target="_blank">
              <circle cx="330" cy="500" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.globe} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(321, 491) scale(0.75)" />
              <text x="360" y="495" fontSize="11" fontWeight="700" fill="#000000">WEBSITE</text>
              <text x="360" y="513" fontSize="13" fontWeight="600" fill="#000000">{cardData.social.website || "www.sorigin.in"}</text>
            </a>
          </g>

          <line x1="40" y1="560" x2="560" y2="560" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom Section: Address Left, QR Right */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "address")}
            transform={`translate(${offsets.address?.x || 0}, ${offsets.address?.y || 0})`}
          >
            {editorMode && <rect x="35" y="570" width="330" height="220" rx="6" className="draggable-rect" />}
            <path d={RAW_ICONS.mapPin} fill={brandColors.primary} transform="translate(40, 580) scale(0.85)" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" transform="translate(40, 580) scale(0.85)" />
            <text x="65" y="594" fontSize="12" fontWeight="700" fill="#000000">ADDRESS</text>
            <text x="65" y="618" fontSize="12" fontWeight="600" fill="#000000">{cardData.officeName || "Sorigin Group Pvt. Ltd."}</text>
            <text x="65" y="636" fontSize="12" fontWeight="500" fill="#4b5563">
              {(cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089").split(",").map((p) => p.trim()).filter(Boolean).slice(0, 4).map((line, idx) => (
                <tspan x="65" dy={idx === 0 ? 0 : 18} key={idx}>{line}</tspan>
              ))}
            </text>
          </g>

          {/* QR Code */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "qr")}
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0})`}
          >
            {editorMode && <rect x="375" y="580" width="190" height="240" rx="6" className="draggable-rect" />}
            
            <a href={getQRRedirectURL()} target="_blank">
              <rect x="380" y="590" width="180" height="180" rx="16" stroke={brandColors.primary} strokeWidth="1.5" fill="#ffffff" />
              <svg x="405" y="612" width="130" height="130">
                <QRCode value={getQRRedirectURL()} size={130} level="H" includeMargin={false} />
              </svg>
              <rect x="380" y="780" width="180" height="30" rx="15" fill={brandColors.primary} />
              <text x="470" y="799" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">SCAN TO CONNECT</text>
            </a>
          </g>

          <line x1="40" y1="835" x2="560" y2="835" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom Social Row */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "socials")}
            transform={`translate(${offsets.socials?.x || 0}, ${offsets.socials?.y || 0})`}
          >
            {editorMode && <rect x="35" y="835" width="530" height="55" rx="6" className="draggable-rect" />}
            
            {/* LinkedIn */}
            <a href={cardData.social.linkedin || "#"} target="_blank">
              <circle cx="70" cy="855" r="12" fill="#0077b5" />
              <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(63.5, 848.5) scale(0.54)" />
              <text x="70" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">LINKEDIN</text>
            </a>

            <line x1="125" y1="845" x2="125" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Instagram */}
            <a href={cardData.social.instagram || "#"} target="_blank">
              <circle cx="180" cy="855" r="12" fill="#e1306c" />
              <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(173.5, 848.5) scale(0.54)" />
              <text x="180" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">INSTAGRAM</text>
            </a>

            <line x1="235" y1="845" x2="235" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* YouTube */}
            <a href={cardData.social.youtube || "#"} target="_blank">
              <circle cx="290" cy="855" r="12" fill="#ff0000" />
              <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(283.5, 848.5) scale(0.54)" />
              <text x="290" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">YOUTUBE</text>
            </a>

            <line x1="345" y1="845" x2="345" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Twitter */}
            <a href={cardData.social.twitter || "#"} target="_blank">
              <circle cx="400" cy="855" r="12" fill="#1da1f2" />
              <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(393.5, 848.5) scale(0.54)" />
              <text x="400" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">TWITTER</text>
            </a>

            <line x1="455" y1="845" x2="455" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Facebook */}
            <a href={cardData.social.facebook || "#"} target="_blank">
              <circle cx="510" cy="855" r="12" fill="#1877f2" />
              <path d={RAW_ICONS.facebook} fill="#ffffff" transform="translate(503.5, 848.5) scale(0.54)" />
              <text x="510" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">FACEBOOK</text>
            </a>
          </g>
        </svg>
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Card Preview Container */}
      <div className="flex flex-col items-center p-4 bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 rounded-2xl border border-teal-100 shadow-inner">
        
        {/* Toggle layout editor controls if not on public view */}
        {!isPublicView && (
          <div className="flex gap-2 mb-4 justify-center w-full">
            <Button
              onClick={() => setEditorMode(!editorMode)}
              variant={editorMode ? "default" : "outline"}
              className={`gap-2 font-semibold shadow-sm ${editorMode ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-white"}`}
            >
              <Move size={16} />
              {editorMode ? "Disable Drag Editor" : "Enable Drag Editor"}
            </Button>
            {editorMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateOffsets({
                  name: { x: 0, y: 0 },
                  designation: { x: 0, y: 0 },
                  logo: { x: 0, y: 0 },
                  qr: { x: 0, y: 0 },
                  contacts: { x: 0, y: 0 },
                  address: { x: 0, y: 0 },
                  socials: { x: 0, y: 0 },
                  photo: { x: 0, y: 0 },
                })}
                className="text-gray-500 text-xs border"
              >
                Reset Positions
              </Button>
            )}
          </div>
        )}

        <div
          ref={cardRef}
          className={`w-full max-w-2xl ${
            layoutType === "vertical" ? "aspect-[3/4]" : "aspect-[16/9]"
          } relative overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white`}
        >
          {renderSvgCard()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center px-4">
        <Button
          onClick={downloadSVG}
          disabled={isExporting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md"
        >
          <Download size={18} />
          Download SVG
        </Button>
        <Button
          onClick={downloadPNG}
          disabled={isExporting}
          className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md"
        >
          <Download size={18} />
          {isExporting ? "Exporting..." : "Download PNG"}
        </Button>
        <Button
          onClick={downloadPDF}
          disabled={isExporting}
          className="bg-cyan-700 hover:bg-cyan-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md"
        >
          <Download size={18} />
          {isExporting ? "Exporting..." : "Download PDF"}
        </Button>
        <Button
          onClick={shareWhatsApp}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md"
        >
          <MessageCircle size={18} />
          Share WhatsApp
        </Button>
      </div>
    </div>
  );
}
