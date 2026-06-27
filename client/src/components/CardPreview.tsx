import { useRef, useState, useEffect } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Share2, MessageCircle, Move, Settings } from "lucide-react";
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
  layoutType: "horizontal-no-photo" | "horizontal-with-photo" | "vertical-no-photo" | "vertical-with-photo";
  savedOffsets?: Record<string, { x: number; y: number; scale?: number; fontSize?: number }>;
  onOffsetsChange?: (offsets: Record<string, { x: number; y: number; scale?: number; fontSize?: number }>) => void;
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

  // Initialize coordinates and scales/sizes
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number; scale?: number; fontSize?: number }>>({
    name: { x: 0, y: 0, fontSize: 36 },
    designation: { x: 0, y: 0, fontSize: 18 },
    logo: { x: 0, y: 0, scale: 1.0 },
    qr: { x: 0, y: 0, scale: 1.0 },
    contacts: { x: 0, y: 0, scale: 1.0 },
    address: { x: 0, y: 0, scale: 1.0 },
    socials: { x: 0, y: 0, scale: 1.0 },
    photo: { x: 0, y: 0, scale: 1.0 },
  });

  // Sync offsets from database when loaded
  useEffect(() => {
    if (savedOffsets) {
      setOffsets((prev) => ({ ...prev, ...savedOffsets }));
    }
  }, [savedOffsets]);

  // Bubble up offsets when changed
  const updateOffsets = (newOffsets: Record<string, { x: number; y: number; scale?: number; fontSize?: number }>) => {
    setOffsets(newOffsets);
    if (onOffsetsChange) {
      onOffsetsChange(newOffsets);
    }
  };

  const handleSliderChange = (key: string, prop: "fontSize" | "scale", value: number) => {
    const updated = {
      ...offsets,
      [key]: {
        ...(offsets[key] || { x: 0, y: 0 }),
        [prop]: value
      }
    };
    updateOffsets(updated);
  };

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent, item: string) => {
    if (!editorMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedItem(item);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !editorMode) return;
    
    // Scale client delta based on SVG viewport width/height relative to DOM container
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = (layoutType.startsWith("vertical") ? 600 : 800) / rect.width;
    const scaleY = (layoutType.startsWith("vertical") ? 900 : 450) / rect.height;

    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;

    const currentOffset = offsets[draggedItem] || { x: 0, y: 0, scale: 1.0, fontSize: 18 };

    const newOffsets = {
      ...offsets,
      [draggedItem]: {
        ...currentOffset,
        x: currentOffset.x + dx,
        y: currentOffset.y + dy,
      },
    };

    updateOffsets(newOffsets);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  // Helpers to split first/last names
  const nameParts = (cardData.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Babu";
  const lastName = nameParts.slice(1).join(" ") || "Chakraborty";

  const brandColors = cardData.brandColors || { primary: "#047857", secondary: "#0d9488" };

  // Helper for QR redirection homepage URL
  const getQRRedirectURL = () => {
    if (cardData.social?.website && cardData.social.website !== "Data Missing") {
      let ws = cardData.social.website.trim();
      if (!/^https?:\/\//i.test(ws)) {
        ws = `https://${ws}`;
      }
      return ws;
    }
    return cardId ? `${window.location.origin}/card/${cardId}` : "https://www.sorigin.in";
  };

  // Export functions
  const downloadSVG = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${cardData.name.replace(/\s+/g, "_") || "glasscard"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("SVG Card downloaded successfully!");
  };

  const downloadPNG = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setIsExporting(true);
    try {
      const dataUrl = await convertSvgToPngDataUrl(svgEl, 3);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${cardData.name.replace(/\s+/g, "_") || "glasscard"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG Card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PNG image");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setIsExporting(true);
    try {
      const pngUrl = await convertSvgToPngDataUrl(svgEl, 3);
      const viewBoxWidth = svgEl.viewBox?.baseVal?.width || 800;
      const viewBoxHeight = svgEl.viewBox?.baseVal?.height || 450;
      
      const pdf = new jsPDF({
        orientation: layoutType.startsWith("vertical") ? "portrait" : "landscape",
        unit: "px",
        format: [viewBoxWidth, viewBoxHeight],
      });
      pdf.addImage(pngUrl, "PNG", 0, 0, viewBoxWidth, viewBoxHeight);
      pdf.save(`${cardData.name.replace(/\s+/g, "_") || "glasscard"}.pdf`);
      toast.success("PDF Card downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document");
    } finally {
      setIsExporting(false);
    }
  };

  const shareWhatsApp = () => {
    const message = `Check out my digital visiting card! Click to connect:\n\n${cardData.name}\n${cardData.designation}\n\n👉 ${window.location.origin}/card/${cardId || "demo"}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  // Embed premium typography and classes
  const svgStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    text {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .card-name {
      font-family: 'Outfit', sans-serif;
    }
    .draggable-rect {
      stroke: #06b6d4;
      stroke-width: 1.5;
      stroke-dasharray: 4;
      fill: #06b6d4;
      fill-opacity: 0.05;
    }
    .text-data-missing {
      fill: #ef4444 !important;
      font-weight: 700 !important;
    }
  `;

  // Render text element with potential Data Missing class styling
  const renderText = (
    textVal: string, 
    fallback: string, 
    x: number | string, 
    y: number | string, 
    fontSize: number, 
    fontWeight: string, 
    fillColor: string, 
    options: any = {}
  ) => {
    const isMissing = textVal === "Data Missing" || textVal === "missing value";
    const displayVal = isMissing ? "Data Missing" : textVal || fallback;
    const finalFill = isMissing ? "#ef4444" : fillColor;

    return (
      <text
        x={x}
        y={y}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={finalFill}
        {...options}
      >
        {displayVal}
      </text>
    );
  };

  // Render SVG Cards dynamically
  const renderSvgCard = () => {
    // ----------------------------------------------------
    // Layout 1: Horizontal - No Photo
    // ----------------------------------------------------
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
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Logo */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1.0})`}
          >
            {editorMode && <rect x="630" y="15" width="125" height="48" rx="6" className="draggable-rect" />}
            <rect x="635" y="20" width="115" height="38" rx="4" stroke={brandColors.primary} strokeWidth="1" fill="none" />
            {cardData.brandLogo ? (
              <image href={cardData.brandLogo} x="637" y="22" width="111" height="34" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="692.5" y="43" textAnchor="middle" fontSize="12" fontWeight="500" fill={brandColors.primary}>Logo</text>
            )}
          </g>

          {/* Name */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "name")}
            transform={`translate(${offsets.name?.x || 0}, ${offsets.name?.y || 0})`}
          >
            {editorMode && <rect x="45" y="60" width="450" height="110" rx="6" className="draggable-rect" />}
            {renderText(firstName, "Babu", 50, 105, offsets.name?.fontSize || 48, "700", "#000000", { className: "card-name" })}
            {lastName && renderText(lastName, "Chakraborty", 50, 152, offsets.name?.fontSize || 48, "700", brandColors.primary, { className: "card-name" })}
            <line x1="50" y1="178" x2="95" y2="178" stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Office */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="45" y="190" width="450" height="55" rx="6" className="draggable-rect" />}
            {renderText(cardData.designation, "Head of Marketing", 50, 212, offsets.designation?.fontSize || 18, "700", "#000000")}
            {renderText(cardData.officeName, "Sorigin Group", 50, 234, offsets.designation?.fontSize || 18, "500", brandColors.primary)}
          </g>

          {/* Contacts Row */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0}) scale(${offsets.contacts?.scale || 1.0})`}
          >
            {editorMode && <rect x="45" y="255" width="530" height="120" rx="6" className="draggable-rect" />}
            
            {/* Phone */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="68" cy="285" r="15" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(60.5, 277.5) scale(0.62)" />
              <text x="94" y="280" fontSize="9" fontWeight="700" fill="#000000">PHONE</text>
              {renderText(cardData.phone, "+91 98220 12345", 94, 296, 12, "600", "#000000")}
            </a>

            {/* Email */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="68" cy="345" r="15" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(60.5, 337.5) scale(0.62)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(60.5, 337.5) scale(0.62)" />
              <text x="94" y="340" fontSize="9" fontWeight="700" fill="#000000">EMAIL</text>
              {renderText(cardData.email, "babu.chakraborty@sorigin.in", 94, 356, 12, "600", "#000000")}
            </a>

            {/* WhatsApp */}
            <a href={`https://wa.me/${(cardData.phone || "").replace(/[^0-9]/g, "")}`} target="_blank">
              <circle cx="330" cy="285" r="15" fill={brandColors.primary} />
              <path d={RAW_ICONS.whatsapp} fill="#ffffff" transform="translate(322.5, 277.5) scale(0.62)" />
              <text x="356" y="280" fontSize="9" fontWeight="700" fill="#000000">WHATSAPP</text>
              {renderText(cardData.phone, "+91 98220 12345", 356, 296, 12, "600", "#000000")}
            </a>

            {/* Website */}
            <a href={cardData.social.website || "https://www.sorigin.in"} target="_blank">
              <circle cx="330" cy="345" r="15" fill={brandColors.primary} />
              <path d={RAW_ICONS.globe} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(322.5, 337.5) scale(0.62)" />
              <text x="356" y="340" fontSize="9" fontWeight="700" fill="#000000">WEBSITE</text>
              {renderText(cardData.social.website || "", "www.sorigin.in", 356, 356, 12, "600", "#000000")}
            </a>
          </g>

          {/* QR Code */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "qr")}
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1.0})`}
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

          <line x1="50" y1="398" x2="750" y2="398" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Address & Socials Bottom Bar */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "address")}
            transform={`translate(${offsets.address?.x || 0}, ${offsets.address?.y || 0})`}
          >
            {editorMode && <rect x="45" y="398" width="710" height="45" rx="6" className="draggable-rect" />}
            
            <path d={RAW_ICONS.mapPin} fill={brandColors.primary} transform="translate(52, 405) scale(0.7)" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" transform="translate(52, 405) scale(0.7)" />
            <text x="75" y="418" fontSize="10" fontWeight="700" fill="#000000">{cardData.officeName || "Sorigin Group Pvt. Ltd."}</text>
            {renderText(cardData.address, "7th Floor, Cybercity Commerzone, Mundhwa, Pune - 411089", 75, 430, 9, "500", "#6b7280")}

            {/* Social links */}
            <g transform="translate(0, 0)">
              <a href={cardData.social.linkedin || "#"} target="_blank">
                <circle cx="480" cy="413" r="10" fill="#0077b5" />
                <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(475, 408) scale(0.42)" />
                <text x="480" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">LinkedIn</text>
              </a>
              <a href={cardData.social.instagram || "#"} target="_blank">
                <circle cx="535" cy="413" r="10" fill="#e1306c" />
                <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(530, 408) scale(0.42)" />
                <text x="535" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Instagram</text>
              </a>
              <a href={cardData.social.youtube || "#"} target="_blank">
                <circle cx="590" cy="413" r="10" fill="#ff0000" />
                <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(585, 408) scale(0.42)" />
                <text x="590" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">YouTube</text>
              </a>
              <a href={cardData.social.twitter || "#"} target="_blank">
                <circle cx="645" cy="413" r="10" fill="#1da1f2" />
                <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(640, 408) scale(0.42)" />
                <text x="645" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Twitter</text>
              </a>
              <a href={cardData.social.facebook || "#"} target="_blank">
                <circle cx="700" cy="413" r="10" fill="#1877f2" />
                <path d={RAW_ICONS.facebook} fill="#ffffff" transform="translate(695, 408) scale(0.42)" />
                <text x="700" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Facebook</text>
              </a>
            </g>
          </g>
        </svg>
      );
    }

    // ----------------------------------------------------
    // Layout 2: Horizontal - With Photo
    // ----------------------------------------------------
    if (layoutType === "horizontal-with-photo") {
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
            <clipPath id="rect-headshot-clip">
              <rect x="50" y="55" width="200" height="250" rx="16" />
            </clipPath>
          </defs>
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Photo Frame */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "photo")}
            transform={`translate(${offsets.photo?.x || 0}, ${offsets.photo?.y || 0}) scale(${offsets.photo?.scale || 1.0})`}
          >
            {editorMode && <rect x="45" y="50" width="210" height="260" rx="16" className="draggable-rect" />}
            <rect x="50" y="55" width="200" height="250" rx="16" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
            {cardData.headshot ? (
              <image href={cardData.headshot} x="50" y="55" width="200" height="250" clipPath="url(#rect-headshot-clip)" preserveAspectRatio="xMidYMid slice" />
            ) : (
              <g>
                <circle cx="150" cy="150" r="32" fill="#9ca3af" />
                <path d="M90,240 C90,200 110,190 150,190 C190,190 210,200 210,240 Z" fill="#9ca3af" clipPath="url(#rect-headshot-clip)" />
                <text x="150" y="260" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280">UPLOAD PHOTO</text>
              </g>
            )}
          </g>

          {/* Logo */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "logo")}
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1.0})`}
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
            {editorMode && <rect x="275" y="60" width="345" height="110" rx="6" className="draggable-rect" />}
            {renderText(firstName, "Babu", 280, 105, offsets.name?.fontSize || 48, "700", "#000000", { className: "card-name" })}
            {lastName && renderText(lastName, "Chakraborty", 280, 152, offsets.name?.fontSize || 48, "700", brandColors.primary, { className: "card-name" })}
            <line x1="280" y1="178" x2="325" y2="178" stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Office */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="275" y="190" width="345" height="55" rx="6" className="draggable-rect" />}
            {renderText(cardData.designation, "Head of Marketing", 280, 212, offsets.designation?.fontSize || 18, "700", "#000000")}
            {renderText(cardData.officeName, "Sorigin Group", 280, 234, offsets.designation?.fontSize || 18, "500", brandColors.primary)}
          </g>

          {/* Contacts Row */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0}) scale(${offsets.contacts?.scale || 1.0})`}
          >
            {editorMode && <rect x="275" y="255" width="345" height="120" rx="6" className="draggable-rect" />}
            
            {/* Phone */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="295" cy="285" r="14" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(288, 278) scale(0.58)" />
              <text x="315" y="280" fontSize="8" fontWeight="700" fill="#000000">PHONE</text>
              {renderText(cardData.phone, "+91 98220 12345", 315, 295, 11, "600", "#000000")}
            </a>

            {/* Email */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="295" cy="345" r="14" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(288, 338) scale(0.58)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(288, 338) scale(0.58)" />
              <text x="315" y="340" fontSize="8" fontWeight="700" fill="#000000">EMAIL</text>
              {renderText(cardData.email, "babu@sorigin.in", 315, 355, 11, "600", "#000000")}
            </a>
          </g>

          {/* QR Code */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "qr")}
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1.0})`}
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

          <line x1="50" y1="398" x2="750" y2="398" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Address & Social Bottom Bar */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "address")}
            transform={`translate(${offsets.address?.x || 0}, ${offsets.address?.y || 0})`}
          >
            {editorMode && <rect x="45" y="398" width="710" height="45" rx="6" className="draggable-rect" />}
            <path d={RAW_ICONS.mapPin} fill={brandColors.primary} transform="translate(52, 405) scale(0.7)" />
            <circle cx="12" cy="10" r="3" fill="#ffffff" transform="translate(52, 405) scale(0.7)" />
            <text x="75" y="418" fontSize="10" fontWeight="700" fill="#000000">{cardData.officeName || "Sorigin Group Pvt. Ltd."}</text>
            {renderText(cardData.address, "7th Floor, Cybercity Commerzone, Mundhwa, Pune - 411089", 75, 430, 9, "500", "#6b7280")}

            {/* Social links */}
            <g transform="translate(0, 0)">
              <a href={cardData.social.linkedin || "#"} target="_blank">
                <circle cx="480" cy="413" r="10" fill="#0077b5" />
                <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(475, 408) scale(0.42)" />
                <text x="480" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">LinkedIn</text>
              </a>
              <a href={cardData.social.instagram || "#"} target="_blank">
                <circle cx="535" cy="413" r="10" fill="#e1306c" />
                <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(530, 408) scale(0.42)" />
                <text x="535" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Instagram</text>
              </a>
              <a href={cardData.social.youtube || "#"} target="_blank">
                <circle cx="590" cy="413" r="10" fill="#ff0000" />
                <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(585, 408) scale(0.42)" />
                <text x="590" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">YouTube</text>
              </a>
              <a href={cardData.social.twitter || "#"} target="_blank">
                <circle cx="645" cy="413" r="10" fill="#1da1f2" />
                <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(640, 408) scale(0.42)" />
                <text x="645" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Twitter</text>
              </a>
              <a href={cardData.social.facebook || "#"} target="_blank">
                <circle cx="700" cy="413" r="10" fill="#1877f2" />
                <path d={RAW_ICONS.facebook} fill="#ffffff" transform="translate(695, 408) scale(0.42)" />
                <text x="700" y="432" textAnchor="middle" fontSize="7" fontWeight="500" fill="#000000">Facebook</text>
              </a>
            </g>
          </g>
        </svg>
      );
    }

    // ----------------------------------------------------
    // Layout 3 & 4: Vertical (With & Without Photo)
    // ----------------------------------------------------
    if (layoutType.startsWith("vertical")) {
      const hasPhoto = layoutType === "vertical-with-photo";

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
            transform={`translate(${offsets.logo?.x || 0}, ${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1.0})`}
          >
            {editorMode && <rect x="440" y="25" width="125" height="48" rx="6" className="draggable-rect" />}
            <rect x="445" y="30" width="115" height="38" rx="4" stroke={brandColors.primary} strokeWidth="1" fill="none" />
            {cardData.brandLogo ? (
              <image href={cardData.brandLogo} x="447" y="32" width="111" height="34" preserveAspectRatio="xMidYMid meet" />
            ) : (
              <text x="502.5" y="53" textAnchor="middle" fontSize="12" fontWeight="500" fill={brandColors.primary}>Logo</text>
            )}
          </g>

          {/* Profile Photo (Only rendered in vertical-with-photo) */}
          {hasPhoto && (
            <g
              style={{ cursor: editorMode ? "move" : "default" }}
              onMouseDown={(e) => handleMouseDown(e, "photo")}
              transform={`translate(${offsets.photo?.x || 0}, ${offsets.photo?.y || 0}) scale(${offsets.photo?.scale || 1.0})`}
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
          )}

          {/* Name Section (Position shifts to center / spans full width in no-photo layout) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "name")}
            transform={`translate(${offsets.name?.x || 0}, ${offsets.name?.y || 0})`}
          >
            {editorMode && <rect x="35" y={hasPhoto ? "130" : "150"} width={hasPhoto ? "330" : "530"} height="120" rx="6" className="draggable-rect" />}
            {renderText(firstName, "Babu", 40, hasPhoto ? 175 : 195, offsets.name?.fontSize || 36, "700", "#000000", { className: "card-name" })}
            {lastName && renderText(lastName, "Chakraborty", 40, hasPhoto ? 215 : 242, offsets.name?.fontSize || 36, "700", brandColors.primary, { className: "card-name" })}
            <line x1="40" y1={hasPhoto ? 238 : 265} x2="85" y2={hasPhoto ? 238 : 265} stroke={brandColors.primary} strokeWidth="5" />
          </g>

          {/* Designation & Company */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "designation")}
            transform={`translate(${offsets.designation?.x || 0}, ${offsets.designation?.y || 0})`}
          >
            {editorMode && <rect x="35" y={hasPhoto ? "255" : "285"} width="530" height="60" rx="6" className="draggable-rect" />}
            {renderText(cardData.designation, "Head of Marketing", 40, hasPhoto ? 272 : 305, offsets.designation?.fontSize || 18, "700", "#000000")}
            {renderText(cardData.officeName, "Sorigin Group", 40, hasPhoto ? 294 : 327, offsets.designation?.fontSize || 18, "500", brandColors.primary)}
          </g>

          {/* Contacts (2x2 Grid) */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "contacts")}
            transform={`translate(${offsets.contacts?.x || 0}, ${offsets.contacts?.y || 0}) scale(${offsets.contacts?.scale || 1.0})`}
          >
            {editorMode && <rect x="35" y="390" width="530" height="150" rx="6" className="draggable-rect" />}
            
            {/* Phone */}
            <a href={`tel:${cardData.phone}`} target="_blank">
              <circle cx="65" cy="420" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.phone} fill="#ffffff" transform="translate(56, 411) scale(0.75)" />
              <text x="95" y="415" fontSize="11" fontWeight="700" fill="#000000">PHONE</text>
              {renderText(cardData.phone, "+91 98220 12345", 95, 433, 13, "600", "#000000")}
            </a>

            {/* WhatsApp */}
            <a href={`https://wa.me/${(cardData.phone || "").replace(/[^0-9]/g, "")}`} target="_blank">
              <circle cx="330" cy="420" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.whatsapp} fill="#ffffff" transform="translate(321, 411) scale(0.75)" />
              <text x="360" y="415" fontSize="11" fontWeight="700" fill="#000000">WHATSAPP</text>
              {renderText(cardData.phone, "+91 98220 12345", 360, 433, 13, "600", "#000000")}
            </a>

            {/* Email */}
            <a href={`mailto:${cardData.email}`} target="_blank">
              <circle cx="65" cy="500" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.email} fill="#ffffff" transform="translate(56, 491) scale(0.75)" />
              <path d={RAW_ICONS.emailLine} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(56, 491) scale(0.75)" />
              <text x="95" y="495" fontSize="11" fontWeight="700" fill="#000000">EMAIL</text>
              {renderText(cardData.email, "babu.chakraborty@sorigin.in", 95, 513, 13, "600", "#000000")}
            </a>

            {/* Website */}
            <a href={cardData.social.website || "https://www.sorigin.in"} target="_blank">
              <circle cx="330" cy="500" r="18" fill={brandColors.primary} />
              <path d={RAW_ICONS.globe} stroke="#ffffff" strokeWidth="2" fill="none" transform="translate(321, 491) scale(0.75)" />
              <text x="360" y="495" fontSize="11" fontWeight="700" fill="#000000">WEBSITE</text>
              {renderText(cardData.social.website || "", "www.sorigin.in", 360, 513, 13, "600", "#000000")}
            </a>
          </g>

          <line x1="40" y1="560" x2="560" y2="560" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom Address */}
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
            transform={`translate(${offsets.qr?.x || 0}, ${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1.0})`}
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

          {/* Social Row */}
          <g
            style={{ cursor: editorMode ? "move" : "default" }}
            onMouseDown={(e) => handleMouseDown(e, "socials")}
            transform={`translate(${offsets.socials?.x || 0}, ${offsets.socials?.y || 0})`}
          >
            {editorMode && <rect x="35" y="835" width="530" height="55" rx="6" className="draggable-rect" />}
            
            <a href={cardData.social.linkedin || "#"} target="_blank">
              <circle cx="70" cy="855" r="12" fill="#0077b5" />
              <path d={RAW_ICONS.linkedin} fill="#ffffff" transform="translate(63.5, 848.5) scale(0.54)" />
              <text x="70" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">LINKEDIN</text>
            </a>

            <line x1="125" y1="845" x2="125" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            <a href={cardData.social.instagram || "#"} target="_blank">
              <circle cx="180" cy="855" r="12" fill="#e1306c" />
              <path d={RAW_ICONS.instagram} fill="#ffffff" transform="translate(173.5, 848.5) scale(0.54)" />
              <text x="180" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">INSTAGRAM</text>
            </a>

            <line x1="235" y1="845" x2="235" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            <a href={cardData.social.youtube || "#"} target="_blank">
              <circle cx="290" cy="855" r="12" fill="#ff0000" />
              <path d={RAW_ICONS.youtube} fill="#ffffff" transform="translate(283.5, 848.5) scale(0.54)" />
              <text x="290" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">YOUTUBE</text>
            </a>

            <line x1="345" y1="845" x2="345" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            <a href={cardData.social.twitter || "#"} target="_blank">
              <circle cx="400" cy="855" r="12" fill="#1da1f2" />
              <path d={RAW_ICONS.twitter} fill="#ffffff" transform="translate(393.5, 848.5) scale(0.54)" />
              <text x="400" y="882" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b7280">TWITTER</text>
            </a>

            <line x1="455" y1="845" x2="455" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

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
    <div className="w-full space-y-4">
      {/* Card Preview Area */}
      <div className="flex flex-col items-center p-4 bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 rounded-2xl border border-teal-100 shadow-inner">
        
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
                  name: { x: 0, y: 0, fontSize: layoutType.startsWith("vertical") ? 36 : 48 },
                  designation: { x: 0, y: 0, fontSize: 18 },
                  logo: { x: 0, y: 0, scale: 1.0 },
                  qr: { x: 0, y: 0, scale: 1.0 },
                  contacts: { x: 0, y: 0, scale: 1.0 },
                  address: { x: 0, y: 0, scale: 1.0 },
                  socials: { x: 0, y: 0, scale: 1.0 },
                  photo: { x: 0, y: 0, scale: 1.0 },
                })}
                className="text-gray-500 text-xs border bg-white"
              >
                Reset Layout
              </Button>
            )}
          </div>
        )}

        <div
          ref={cardRef}
          className={`w-full max-w-2xl ${
            layoutType.startsWith("vertical") ? "aspect-[3/4]" : "aspect-[16/9]"
          } relative overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white`}
        >
          {renderSvgCard()}
        </div>
      </div>

      {/* Real-time Resizing Sliders (Visible during drag editor mode) */}
      {editorMode && !isPublicView && (
        <div className="w-full bg-white border border-teal-100 p-4 rounded-xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
            <Settings size={14} className="text-teal-600 animate-spin-slow" />
            ELEMENT SIZING CONTROLS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name Size Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Name Font Size</span>
                <span>{offsets.name?.fontSize || (layoutType.startsWith("vertical") ? 36 : 48)}px</span>
              </div>
              <input
                type="range"
                min="18"
                max="64"
                value={offsets.name?.fontSize || (layoutType.startsWith("vertical") ? 36 : 48)}
                onChange={(e) => handleSliderChange("name", "fontSize", parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            {/* Designation Size Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Title Font Size</span>
                <span>{offsets.designation?.fontSize || 18}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                value={offsets.designation?.fontSize || 18}
                onChange={(e) => handleSliderChange("designation", "fontSize", parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            {/* Logo Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Logo Scale</span>
                <span>{Math.round((offsets.logo?.scale || 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={Math.round((offsets.logo?.scale || 1.0) * 100)}
                onChange={(e) => handleSliderChange("logo", "scale", parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            {/* QR Code Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>QR Scale</span>
                <span>{Math.round((offsets.qr?.scale || 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={Math.round((offsets.qr?.scale || 1.0) * 100)}
                onChange={(e) => handleSliderChange("qr", "scale", parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            {/* Photo Scale Slider */}
            {layoutType !== "horizontal-no-photo" && layoutType !== "vertical-no-photo" && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Photo Scale</span>
                  <span>{Math.round((offsets.photo?.scale || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={Math.round((offsets.photo?.scale || 1.0) * 100)}
                  onChange={(e) => handleSliderChange("photo", "scale", parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center px-4">
        <Button
          onClick={downloadSVG}
          disabled={isExporting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md text-xs h-9"
        >
          <Download size={14} />
          Download SVG
        </Button>
        <Button
          onClick={downloadPNG}
          disabled={isExporting}
          className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md text-xs h-9"
        >
          <Download size={14} />
          {isExporting ? "Exporting..." : "Download PNG"}
        </Button>
        <Button
          onClick={downloadPDF}
          disabled={isExporting}
          className="bg-cyan-700 hover:bg-cyan-800 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md text-xs h-9"
        >
          <Download size={14} />
          {isExporting ? "Exporting..." : "Download PDF"}
        </Button>
        <Button
          onClick={shareWhatsApp}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md text-xs h-9"
        >
          <MessageCircle size={14} />
          Share WhatsApp
        </Button>
      </div>
    </div>
  );
}
