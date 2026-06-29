import { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CARD_THEMES, FONT_PAIRINGS, resolveCardTheme, type CardTheme, type FontPairing } from "./ThemeSelector";

import { Button } from "@/components/ui/button";
import { Download, MessageCircle, Move, Settings } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface CardData {
  headshot: string | null;
  name: string;
  designation: string;
  phone: string;
  email: string;
  address: string;
  officeName: string;
  officeDetails: string;
  bio?: string;
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
  themeId?: string;        // Phase 2: selected card theme ID
  fontPairingId?: string;  // Phase 2: selected font pairing ID
  telephone?: string;
}

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  width: number;  // SVG units — controls word-wrap column width
}

interface CardPreviewProps {
  cardData: CardData;
  layoutType: "horizontal-no-photo" | "horizontal-with-photo" | "vertical-no-photo" | "vertical-with-photo";
  savedOffsets?: Record<string, { x: number; y: number; scale?: number; fontSize?: number }>;
  onOffsetsChange?: (offsets: Record<string, { x: number; y: number; scale?: number; fontSize?: number }>) => void;
  isPublicView?: boolean;
  cardId?: number;
  textBoxes?: TextBox[];
  onTextBoxMove?: (id: string, x: number, y: number) => void;
}

// ── SVG path data for icons (all 24×24 viewBox) ──────────────────────────────
const ICONS = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.04 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  email: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
  emailChevron: "M22 6l-10 7L2 6",
  // Correct geographic globe with latitude/longitude ellipses (NOT a clock)
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.86-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  mapPin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  instagram: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zm-5 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm5.25-9.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z",
  youtube: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33zM9.75 15.02l6-3.27-6-3.27v6.54z",
  twitter: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
};

// Helper: truncate text to fit within maxLen characters
const truncate = (text: string, maxLen: number) => {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
};

// Helper: render contact icon circle + label + value in pure SVG
function ContactRow({
  cx, cy, iconPath, iconPath2, label, value, href, fillColor, isWhatsapp = false, scale = 0.55
}: {
  cx: number; cy: number; iconPath: string; iconPath2?: string;
  label: string; value: string; href: string;
  fillColor: string; isWhatsapp?: boolean; scale?: number;
}) {
  const r = 14;
  const isMissing = !value || value === "Data Missing";
  const display = isMissing ? "Data Missing" : truncate(value, 30);
  const textColor = isMissing ? "#ef4444" : "#1f2937";
  const offset = -(24 * scale) / 2;
  return (
    <a href={isMissing ? undefined : href} target="_blank" rel="noopener noreferrer">
      <circle cx={cx} cy={cy} r={r} fill={fillColor} />
      <path d={iconPath} fill={isWhatsapp ? fillColor : "#ffffff"}
        transform={`translate(${cx + offset}, ${cy + offset}) scale(${scale})`}
        stroke={isWhatsapp ? undefined : "none"}
      />
      {iconPath2 && (
        <path d={iconPath2} stroke="#ffffff" strokeWidth="2" fill="none"
          transform={`translate(${cx + offset}, ${cy + offset}) scale(${scale})`} />
      )}
      <text x={cx + r + 6} y={cy - 5} fontSize="8" fontWeight="700" fill="#374151" fontFamily="'Plus Jakarta Sans', sans-serif">{label}</text>
      <text x={cx + r + 6} y={cy + 9} fontSize="11" fontWeight="600" fill={textColor} fontFamily="'Plus Jakarta Sans', sans-serif">{display}</text>
    </a>
  );
}

// Helper: social icon circle with label
function SocialIcon({ cx, cy, iconPath, bgColor, href, label }: {
  cx: number; cy: number; iconPath: string; bgColor: string; href: string; label: string;
}) {
  const hasHref = href && href !== "Data Missing" && href !== "#";
  return (
    <a href={hasHref ? href : undefined} target="_blank" rel="noopener noreferrer">
      <circle cx={cx} cy={cy} r={11} fill={bgColor} />
      <path d={iconPath} fill="#ffffff" transform={`translate(${cx - 5.5}, ${cy - 5.5}) scale(0.458)`} />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="7" fontWeight="600" fill="#6b7280" fontFamily="'Plus Jakarta Sans', sans-serif">{label}</text>
    </a>
  );
}

export default function CardPreview({
  cardData,
  layoutType,
  savedOffsets,
  onOffsetsChange,
  isPublicView = false,
  cardId,
  textBoxes = [],
  onTextBoxMove,
}: CardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Phase 2: resolve active theme + font pairing ──────────────────────────
  const activeTheme = resolveCardTheme(cardData.themeId || "classic-white", cardData.brandColors);
  const activeFontPairing: FontPairing =
    FONT_PAIRINGS.find(f => f.id === cardData.fontPairingId) ?? FONT_PAIRINGS[0];

  // When theme is light-text, override body/sub text for SVG fills
  const themeBodyText = cardData.customTextColor || activeTheme.bodyText;
  const themeSubText  = cardData.customTextColor || activeTheme.subText;
  const themeDivider  = cardData.customTextColor || activeTheme.divider;
  const nameColor1    = cardData.customTextColor || activeTheme.nameColor1;
  const nameColor2    = cardData.customTextColor || activeTheme.nameColor2;
  const accentLine    = cardData.customTextColor || activeTheme.accentLine;

  const [isExporting, setIsExporting] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ clientX: 0, scale: 1.0 });
  // Track which text box is being dragged separately
  const [draggedTextBoxId, setDraggedTextBoxId] = useState<string | null>(null);
  const [tbDragStart, setTbDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [localTextBoxes, setLocalTextBoxes] = useState<TextBox[]>(textBoxes);

  // Sync external textBoxes prop into local state
  useEffect(() => { setLocalTextBoxes(textBoxes); }, [textBoxes]);

  const defaultOffsets: Record<string, { x: number; y: number; scale?: number; fontSize?: number }> = {
    name: { x: 0, y: 0, fontSize: layoutType.startsWith("vertical") ? 32 : 44 },
    designation: { x: 0, y: 0, fontSize: 15 },
    logo: { x: 0, y: 0, scale: 1.0 },
    qr: { x: 0, y: 0, scale: 1.0 },
    contacts: { x: 0, y: 0, scale: 1.0 },
    address: { x: 0, y: 0, scale: 1.0 },
    socials: { x: 0, y: 0, scale: 1.0 },
    photo: { x: 0, y: 0, scale: 1.0 },
  };

  const [offsets, setOffsets] = useState(defaultOffsets);

  useEffect(() => {
    if (savedOffsets) {
      setOffsets((prev) => ({ ...prev, ...savedOffsets }));
    }
  }, [savedOffsets]);

  const updateOffsets = (newOffsets: typeof offsets) => {
    setOffsets(newOffsets);
    if (onOffsetsChange) onOffsetsChange(newOffsets);
  };

  const handleSliderChange = (key: string, prop: "fontSize" | "scale", value: number) => {
    updateOffsets({ ...offsets, [key]: { ...(offsets[key] || { x: 0, y: 0 }), [prop]: value } });
  };

  const handleResizeStart = (e: React.MouseEvent, item: string) => {
    if (!editorMode) return;
    e.preventDefault(); e.stopPropagation();
    setResizingItem(item);
    setResizeStart({ clientX: e.clientX, scale: offsets[item]?.scale || 1.0 });
  };

  const handleMouseDown = (e: React.MouseEvent, item: string) => {
    if (!editorMode) return;
    e.preventDefault(); e.stopPropagation();
    setDraggedItem(item);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Text box drag
    if (draggedTextBoxId) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const svgW = layoutType.startsWith("vertical") ? 514 : 800;
      const svgH = layoutType.startsWith("vertical") ? 760 : 457;
      const scaleX = svgW / rect.width;
      const scaleY = svgH / rect.height;
      const nx = tbDragStart.ox + (e.clientX - tbDragStart.x) * scaleX;
      const ny = tbDragStart.oy + (e.clientY - tbDragStart.y) * scaleY;
      setLocalTextBoxes(prev => prev.map(tb => tb.id === draggedTextBoxId ? { ...tb, x: Math.max(0, nx), y: Math.max(10, ny) } : tb));
      return;
    }
    if (resizingItem && editorMode) {
      e.preventDefault();
      const dx = e.clientX - resizeStart.clientX;
      const newScale = Math.max(0.3, Math.min(2.5, resizeStart.scale + dx / 150));
      updateOffsets({ ...offsets, [resizingItem]: { ...(offsets[resizingItem] || { x: 0, y: 0 }), scale: parseFloat(newScale.toFixed(2)) } });
      return;
    }
    if (!draggedItem || !editorMode) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgW = layoutType.startsWith("vertical") ? 514 : 800;
    const svgH = layoutType.startsWith("vertical") ? 760 : 457;
    const scaleX = svgW / rect.width;
    const scaleY = svgH / rect.height;
    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;
    const cur = offsets[draggedItem] || { x: 0, y: 0 };
    updateOffsets({ ...offsets, [draggedItem]: { ...cur, x: cur.x + dx, y: cur.y + dy } });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (draggedTextBoxId) {
      // Notify parent of final position
      const moved = localTextBoxes.find(tb => tb.id === draggedTextBoxId);
      if (moved && onTextBoxMove) onTextBoxMove(moved.id, moved.x, moved.y);
      setDraggedTextBoxId(null);
    }
    setDraggedItem(null);
    setResizingItem(null);
  };



  // Split name into first + last for two-tone rendering
  const nameParts = (cardData.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "FULL NAME";
  const lastName = nameParts.slice(1).join(" ") || "";

  const getWebsite = () => {
    const ws = cardData.social?.website;
    if (ws && ws !== "Data Missing") {
      return /^https?:\/\//i.test(ws) ? ws : `https://${ws}`;
    }
    return null;
  };

  const getQRValue = () => {
    const ws = getWebsite();
    if (ws) return ws;
    return cardId ? `${window.location.origin}/card/${cardId}` : "https://www.sorigin.in";
  };

  // ── Export helpers ───────────────────────────────────────────────────────────

  // Build a flat canvas with the card rendered at 3x resolution using html2canvas-like approach
  // We draw into canvas directly using the design coordinates (no foreignObject workaround needed)
  const buildCardCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      // Find the SVG in the card container div
      const container = cardRef.current;
      if (!container) { reject(new Error("No container")); return; }
      const svgEl = container.querySelector("svg") as SVGSVGElement | null;
      if (!svgEl) { reject(new Error("No SVG")); return; }

      const vbWidth = svgEl.viewBox.baseVal.width || 800;
      const vbHeight = svgEl.viewBox.baseVal.height || 457;
      const scale = 3;

      // Serialize the SVG to blob
      const serialized = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = vbWidth * scale;
        canvas.height = vbHeight * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas);
      };
      img.onerror = (err) => { URL.revokeObjectURL(blobUrl); reject(err); };
      img.src = blobUrl;
    });
  };

  const downloadSVG = () => {
    const svgEl = cardRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(cardData.name || "card").replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("SVG downloaded!");
  };

  const downloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await buildCardCanvas();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${(cardData.name || "card").replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("PNG downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("PNG export failed");
    } finally { setIsExporting(false); }
  };

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await buildCardCanvas();
      const pngUrl = canvas.toDataURL("image/png");
      const svgEl = cardRef.current?.querySelector("svg") as SVGSVGElement;
      const vbW = svgEl?.viewBox?.baseVal?.width || 800;
      const vbH = svgEl?.viewBox?.baseVal?.height || 457;
      const isVert = layoutType.startsWith("vertical");

      const pdf = new jsPDF({ orientation: isVert ? "portrait" : "landscape", unit: "px", format: [vbW, vbH] });
      pdf.addImage(pngUrl, "PNG", 0, 0, vbW, vbH);

      // Overlay clickable links
      const phone = cardData.phone || "";
      const email = cardData.email || "";
      const ws = getWebsite() || getQRValue();
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const li = cardData.social.linkedin || "";
      const ig = cardData.social.instagram || "";
      const yt = cardData.social.youtube || "";
      const tw = cardData.social.twitter || "";
      const fb = cardData.social.facebook || "";

      const cx = offsets.contacts?.x || 0, cy = offsets.contacts?.y || 0;
      const sx = offsets.socials?.x || 0, sy = offsets.socials?.y || 0;
      const qx = offsets.qr?.x || 0, qy = offsets.qr?.y || 0;

      if (isVert) {
        // Vertical layout links
        pdf.link(40 + cx, 380 + cy, 220, 55, { url: `tel:${phone}` });
        pdf.link(270 + cx, 380 + cy, 220, 55, { url: `https://wa.me/${cleanPhone}` });
        pdf.link(40 + cx, 455 + cy, 220, 55, { url: `mailto:${email}` });
        pdf.link(270 + cx, 455 + cy, 220, 55, { url: ws });
        pdf.link(300 + qx, 570 + qy, 175, 175, { url: ws });
        pdf.link(60 + sx, 833 + sy, 40, 40, { url: li });
        pdf.link(155 + sx, 833 + sy, 40, 40, { url: ig });
        pdf.link(245 + sx, 833 + sy, 40, 40, { url: yt });
        pdf.link(335 + sx, 833 + sy, 40, 40, { url: tw });
        pdf.link(420 + sx, 833 + sy, 40, 40, { url: fb });
      } else {
        // Horizontal layout links
        if (layoutType === "horizontal-no-photo") {
          pdf.link(50 + cx, 265 + cy, 220, 50, { url: `tel:${phone}` });
          pdf.link(310 + cx, 265 + cy, 220, 50, { url: `mailto:${email}` });
          pdf.link(50 + cx, 330 + cy, 220, 50, { url: `https://wa.me/${cleanPhone}` });
          pdf.link(310 + cx, 330 + cy, 220, 50, { url: ws });
          pdf.link(640 + qx, 200 + qy, 115, 115, { url: ws });
        } else {
          pdf.link(285 + cx, 265 + cy, 200, 50, { url: `tel:${phone}` });
          pdf.link(285 + cx, 330 + cy, 200, 50, { url: `mailto:${email}` });
          pdf.link(640 + qx, 200 + qy, 115, 115, { url: ws });
        }
        const ax = offsets.address?.x || 0, ay = offsets.address?.y || 0;
        pdf.link(465 + ax, 405 + ay, 40, 40, { url: li });
        pdf.link(520 + ax, 405 + ay, 40, 40, { url: ig });
        pdf.link(575 + ax, 405 + ay, 40, 40, { url: yt });
        pdf.link(630 + ax, 405 + ay, 40, 40, { url: tw });
        pdf.link(685 + ax, 405 + ay, 40, 40, { url: fb });
      }

      pdf.save(`${(cardData.name || "card").replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF with clickable links downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    } finally { setIsExporting(false); }
  };

  // WhatsApp share: sends card image as PNG via Web Share API if available,
  // otherwise sends a link. On mobile browsers this shares the actual image.
  const shareWhatsApp = async () => {
    try {
      const canvas = await buildCardCanvas();
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => b ? res(b) : rej(new Error("No blob")), "image/png")
      );
      const file = new File([blob], `${(cardData.name || "card").replace(/\s+/g, "_")}_card.png`, { type: "image/png" });

      // Try Web Share API with file (works on Android Chrome, Safari iOS)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${cardData.name} - Digital Card`,
          text: `📇 ${cardData.name}\n${cardData.designation}\n\nConnect: ${getWebsite() || window.location.origin}`,
        });
      } else {
        // Fallback: open WhatsApp with pre-filled text + link
        const link = cardId ? `${window.location.origin}/card/${cardId}` : getWebsite() || window.location.origin;
        const msg = `📇 *${cardData.name}*\n*${cardData.designation}* | ${cardData.officeName}\n📞 ${cardData.phone}\n📧 ${cardData.email}\n🔗 ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch {
      // Final fallback
      const link = cardId ? `${window.location.origin}/card/${cardId}` : getWebsite() || window.location.origin;
      const msg = `📇 *${cardData.name}*\n*${cardData.designation}*\n${cardData.phone}\n${cardData.email}\n${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  // ── Drag editor helpers ──────────────────────────────────────────────────────
  const dragHandle = (item: string) => ({
    style: { cursor: editorMode ? "move" as const : "default" as const },
    onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, item),
  });

  // CSS-based scaled drag group — transform-box:fill-box ensures scale is
  // around the element's OWN center, not SVG origin (fixes jump/disappear bug)
  const scaledGroup = (item: string, children: React.ReactNode) => {
    const o = offsets[item] || { x: 0, y: 0, scale: 1 };
    const s = o.scale ?? 1;
    const tx = o.x || 0;
    const ty = o.y || 0;
    return (
      <g
        onMouseDown={(e) => handleMouseDown(e, item)}
        style={{
          cursor: editorMode ? "move" : "default",
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          transformBox: 'fill-box' as never,
          transformOrigin: 'center' as never,
        } as React.CSSProperties}
      >
        {children}
      </g>
    );
  };

  const resizeHandle = (item: string, cx: number, cy: number) => editorMode && (
    <circle cx={cx} cy={cy} r={6} fill="#06b6d4" stroke="#fff" strokeWidth="1.5"
      style={{ cursor: "nwse-resize" }}
      onMouseDown={(e) => handleResizeStart(e, item)} />
  );

  // ── Phase 2: brand colors — theme takes precedence over user brand colors ─
  const brandColors = {
    primary: activeTheme.iconBg,
    secondary: activeTheme.nameColor2,
  };

  const svgDefs = (
    <defs>
      <style>{`
        @import url('${activeFontPairing.googleUrl}');
        .fc-name { font-family: '${activeFontPairing.headingFont}', sans-serif; }
        .fc-body { font-family: '${activeFontPairing.bodyFont}', sans-serif; }
        .drag-outline { stroke: #06b6d4; stroke-width: 1.5; stroke-dasharray: 4; fill: #06b6d4; fill-opacity: 0.04; }
      `}</style>
      {/* Statically define background gradients so they always load correctly */}
      <linearGradient id="luxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a0a0a"/>
        <stop offset="50%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#0a0a0a"/>
      </linearGradient>
      <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a"/>
        <stop offset="55%" stopColor="#1e1b4b"/>
        <stop offset="100%" stopColor="#0f172a"/>
      </linearGradient>
      <linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4F2EC"/>
        <stop offset="100%" stopColor="#e8e4d8"/>
      </linearGradient>
      <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="25%" stopColor={activeTheme.accentStrip} stopOpacity="0.2" />
        <stop offset="75%" stopColor={activeTheme.accentStrip} stopOpacity="0.2" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
      <filter id="photoShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={activeTheme.accentStrip} floodOpacity="0.2" />
      </filter>
    </defs>
  );

  // ── Render text boxes: proper word-wrap using tspan rows ──────────────────
  const renderTextBoxes = () => localTextBoxes.map(tb => {
    // Word-wrap: split text into lines that fit within tb.width SVG units
    // Approximate: 1 char ≈ fontSize * 0.58 SVG units
    const charsPerLine = Math.max(5, Math.floor(tb.width / (tb.fontSize * 0.58)));
    const words = (tb.text || "").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const candidate = cur ? cur + " " + w : w;
      if (candidate.length > charsPerLine && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);

    const lineHeight = tb.fontSize * 1.35;
    const boxH = lines.length * lineHeight + 8;

    return (
      <g key={tb.id}
        style={{ cursor: editorMode ? "move" : "default" }}
        onMouseDown={(e) => {
          if (!editorMode) return;
          e.preventDefault(); e.stopPropagation();
          setDraggedTextBoxId(tb.id);
          setTbDragStart({ x: e.clientX, y: e.clientY, ox: tb.x, oy: tb.y });
        }}
      >
        {/* Editor outline — shows actual bounding box */}
        {editorMode && (
          <rect
            x={tb.x - 4}
            y={tb.y - tb.fontSize - 4}
            width={tb.width + 8}
            height={boxH}
            rx="4"
            className="drag-outline"
          />
        )}
        {/* Word-wrapped text using tspan rows */}
        <text
          x={tb.x}
          y={tb.y}
          fontSize={tb.fontSize}
          fill={tb.color}
          fontWeight={tb.bold ? "700" : "400"}
          fontStyle={tb.italic ? "italic" : "normal"}
          className="fc-body"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={tb.x} dy={i === 0 ? 0 : lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  });

  // ── Multi-line text helper (SVG tspan) ───────────────────────────────────────
  const multiline = (text: string, x: number, y: number, maxChars: number, lineHeight: number, style: object) => {
    const words = (text || "").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
      else cur = cur ? cur + " " + w : w;
    }
    if (cur) lines.push(cur.trim());
    return (
      <text x={x} y={y} {...style}>
        {lines.slice(0, 3).map((l, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>{l}</tspan>
        ))}
      </text>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // Layout 1: Horizontal No-Photo   (viewBox 800×457)
  // Reference: media__1782549394704.jpg  — clean white, logo top-right, name top-left,
  //            3 contact icons in a row, address + socials bottom bar, QR bottom-right
  // ═════════════════════════════════════════════════════════════════════════════
  const renderHorizontalNoPhoto = () => (
    <svg id="digital-card-svg" ref={undefined} viewBox="0 0 800 457"
      className="w-full h-full" xmlns="http://www.w3.org/2000/svg"
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {svgDefs}
      {/* Background */}
      <rect width="800" height="457"
        fill={cardData.customBg || (activeTheme.bgGradientId ? `url(#${activeTheme.bgGradientId})` : activeTheme.bg)}
        rx="12" />
      {/* ── Brand accent strip (top) ── */}
      <rect x="0" y="0" width="800" height="5" fill={activeTheme.accentStrip} rx="2" />

      {/* ── Logo (top-right) — no border, transparent PNG renders directly ── */}
      <g {...dragHandle("logo")} transform={`translate(${offsets.logo?.x || 0},${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1})`}>
        {cardData.brandLogo
          ? <image href={cardData.brandLogo} x="630" y="12" width="140" height="50" preserveAspectRatio="xMidYMid meet" />
          : <text x="700" y="43" textAnchor="middle" fontSize="11" fontWeight="600" fill={brandColors.primary} className="fc-body" letterSpacing="0.5" opacity="0.5">YOUR LOGO</text>}
        {editorMode && <><rect x="626" y="8" width="148" height="58" rx="6" className="drag-outline" />{resizeHandle("logo", 774, 66)}</>}
      </g>

      {/* ── Name (top-left, two-tone) — auto wraps if total name > 16 chars ── */}
      <g {...dragHandle("name")} transform={`translate(${offsets.name?.x || 0},${offsets.name?.y || 0})`}>
        {(() => {
          const totalLen = (firstName + " " + lastName).length;
          const longName = totalLen > 16;
          const fs = Math.min(offsets.name?.fontSize || 44, longName ? Math.max(26, 44 - (totalLen - 16) * 1.2) : 44);
          return longName ? (
            <text x="50" className="fc-name" fontSize={fs} fontWeight="800" letterSpacing="-0.5">
              <tspan x="50" y="88" fill={nameColor1}>{firstName}</tspan>
              <tspan x="50" dy={fs + 4} fill={nameColor2}>{lastName}</tspan>
            </text>
          ) : (
            <text x="50" y="100" className="fc-name" fontSize={fs} fontWeight="800" letterSpacing="-0.5">
              <tspan fill={nameColor1}>{firstName}</tspan>
              {lastName && <tspan fill={nameColor2}> {lastName}</tspan>}
            </text>
          );
        })()}
        <line x1="50" y1="130" x2="95" y2="130" stroke={accentLine} strokeWidth="5" strokeLinecap="round" />
        {editorMode && <rect x="44" y="55" width="460" height="85" rx="6" className="drag-outline" />}
      </g>

      {/* ── Designation + Office + Bio (optional) ── */}
      <g {...dragHandle("designation")} transform={`translate(${offsets.designation?.x || 0},${offsets.designation?.y || 0})`}>
        {/* Designation */}
        <text x="50" y="150" fontSize={offsets.designation?.fontSize || 15} fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.designation, 45) || "Head of Marketing"}</text>
        {/* Thin separator line between Designation and Office Name */}

        {/* Office Name */}
        <text x="50" y="174" fontSize={(offsets.designation?.fontSize || 15) - 1} fontWeight="600" fill={nameColor2} className="fc-body">{truncate(cardData.officeName, 40) || "Company Name"}</text>
        {cardData.bio && cardData.bio.trim() && (
          <text x="50" y="192" fontSize={10} fontWeight="400" fill={themeSubText} fontStyle="italic" className="fc-body" opacity="0.85">{truncate(cardData.bio, 80)}</text>
        )}
        {editorMode && <rect x="44" y="136" width="440" height="66" rx="6" className="drag-outline" />}
      </g>

      {/* ── Contact Row: Mobile | Phone | Email | Website ── */}
      {scaledGroup("contacts", <>
        {editorMode && <rect x="40" y="190" width="580" height="65" rx="6" className="drag-outline" />}
        {/* Separator line */}
        <line x1="50" y1="195" x2="620" y2="195" stroke="#e5e7eb" strokeWidth="1" />

        {/* Mobile */}
        <a href={`tel:${cardData.phone}`} target="_blank" rel="noopener noreferrer">
          <circle cx="72" cy="225" r="15" fill={activeTheme.iconBg} />
          <path d={ICONS.phone} fill="#fff" transform="translate(64.5,217.5) scale(0.625)" />
          <text x="96" y="218" fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body">MOBILE</text>
          <text x="96" y="232" fontSize="10" fontWeight="600" fill={(!cardData.phone || cardData.phone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.phone, 18) || "Data Missing"}</text>
        </a>

        {/* Divider */}
        <line x1="185" y1="208" x2="185" y2="242" stroke={themeDivider} strokeWidth="1" />

        {/* Phone */}
        <a href={`tel:${cardData.telephone || ""}`} target="_blank" rel="noopener noreferrer">
          <circle cx="207" cy="225" r="15" fill={activeTheme.iconBg} />
          <path d={ICONS.phone} fill="#fff" transform="translate(199.5,217.5) scale(0.625)" />
          <text x="231" y="218" fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body">PHONE</text>
          <text x="231" y="232" fontSize="10" fontWeight="600" fill={(!cardData.telephone || cardData.telephone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.telephone, 18) || "Data Missing"}</text>
        </a>

        {/* Divider */}
        <line x1="325" y1="208" x2="325" y2="242" stroke={themeDivider} strokeWidth="1" />

        {/* Email */}
        <a href={`mailto:${cardData.email}`} target="_blank" rel="noopener noreferrer">
          <circle cx="347" cy="225" r="15" fill={activeTheme.iconBg} />
          <path d={ICONS.email} fill="#fff" transform="translate(339.5,217.5) scale(0.625)" />
          <path d={ICONS.emailChevron} stroke="#fff" strokeWidth="2" fill="none" transform="translate(339.5,217.5) scale(0.625)" />
          <text x="371" y="218" fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body">EMAIL</text>
          <text x="371" y="232" fontSize="10" fontWeight="600" fill={(!cardData.email || cardData.email === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.email, 18) || "Data Missing"}</text>
        </a>

        {/* Divider */}
        <line x1="475" y1="208" x2="475" y2="242" stroke={themeDivider} strokeWidth="1" />

        {/* Website */}
        <a href={cardData.social?.website || "#"} target="_blank" rel="noopener noreferrer">
          <circle cx="497" cy="225" r="15" fill={activeTheme.iconBg} />
          <path d={ICONS.globe} fill="#fff" transform="translate(489.5,217.5) scale(0.625)" />
          <text x="521" y="218" fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body">WEBSITE</text>
          <text x="521" y="232" fontSize="10" fontWeight="600" fill={(!cardData.social?.website || cardData.social.website === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.social?.website || "", 18) || "Data Missing"}</text>
        </a>

        <line x1="50" y1="260" x2="620" y2="260" stroke={themeDivider} strokeWidth="1" />
      </>)}

        {/* Address bottom-left */}
        {scaledGroup("address", <>
          {editorMode && <rect x="40" y="268" width="430" height="50" rx="6" className="drag-outline" />}
          <path d={ICONS.mapPin} fill={activeTheme.iconBg} transform="translate(48,275) scale(0.72)" />
          <text x="72" y="286" fontSize="10" fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.officeName, 28) || "Company Name Pvt. Ltd."}</text>
          {multiline(cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune – 411089", 72, 302, 55, 13,
            { fontSize: 9.5, fontWeight: "500", fill: themeSubText, className: "fc-body" })}

      </>)}

      {/* ── Social icons row ── */}
      {/* Divider line is FIXED — outside the scaledGroup so it doesn't scale */}
      <line x1="50" y1="345" x2="740" y2="345" stroke="#e5e7eb" strokeWidth="1" />
      {scaledGroup("socials", <>
        <SocialIcon cx={420} cy={388} iconPath={ICONS.whatsapp} bgColor="#25D366" href={cardData.social.whatsapp || "#"} label="WhatsApp" />
        <line x1="450" y1="373" x2="450" y2="405" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={480} cy={388} iconPath={ICONS.linkedin} bgColor="#0077b5" href={cardData.social.linkedin || "#"} label="LinkedIn" />
        <line x1="510" y1="373" x2="510" y2="405" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={540} cy={388} iconPath={ICONS.instagram} bgColor="#e1306c" href={cardData.social.instagram || "#"} label="Instagram" />
        <line x1="570" y1="373" x2="570" y2="405" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={600} cy={388} iconPath={ICONS.youtube} bgColor="#ff0000" href={cardData.social.youtube || "#"} label="YouTube" />
        <line x1="630" y1="373" x2="630" y2="405" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={660} cy={388} iconPath={ICONS.twitter} bgColor="#1da1f2" href={cardData.social.twitter || "#"} label="Twitter" />
        <line x1="690" y1="373" x2="690" y2="405" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={720} cy={388} iconPath={ICONS.facebook} bgColor="#1877f2" href={cardData.social.facebook || "#"} label="Facebook" />
      </>)}

      {/* ── QR Code (bottom-right) ── */}
      <g {...dragHandle("qr")} transform={`translate(${offsets.qr?.x || 0},${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1})`}>
        <a href={getQRValue()} target="_blank" rel="noopener noreferrer">
          <rect x="640" y="195" width="118" height="118" rx="10" stroke={brandColors.primary} strokeWidth="1.5" fill="#ffffff" />
          <svg x="648" y="203" width="102" height="102">
            <QRCodeSVG value={getQRValue()} size={102} level="H" includeMargin={false} />
          </svg>
          <rect x="640" y="319" width="118" height="22" rx="11" fill={brandColors.primary} />
          <text x="699" y="333" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" className="fc-body">SCAN TO CONNECT</text>
        </a>
        {editorMode && <><rect x="635" y="190" width="128" height="157" rx="6" className="drag-outline" />{resizeHandle("qr", 763, 347)}</>}
      </g>
      {/* ── Free-form text boxes (draggable, optional) ── */}
      {renderTextBoxes()}
    </svg>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // Layout 2: Horizontal With-Photo  (viewBox 800×457)
  // ═════════════════════════════════════════════════════════════════════════════
  const renderHorizontalWithPhoto = () => (
    <svg id="digital-card-svg" viewBox="0 0 800 457"
      className="w-full h-full" xmlns="http://www.w3.org/2000/svg"
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {svgDefs}
      <defs>
        <clipPath id="photo-clip-h"><circle cx="155" cy="185" r="130" /></clipPath>
      </defs>
      {/* Background */}
      <rect width="800" height="457"
        fill={cardData.customBg || (activeTheme.bgGradientId ? `url(#${activeTheme.bgGradientId})` : activeTheme.bg)}
        rx="12" />
      {/* ── Brand accent strip (top) ── */}
      <rect x="0" y="0" width="800" height="5" fill={activeTheme.accentStrip} rx="2" />

      {/* ── Photo (left circular) ── */}
      <g {...dragHandle("photo")} transform={`translate(${offsets.photo?.x || 0},${offsets.photo?.y || 0}) scale(${offsets.photo?.scale || 1})`}>
        {/* Photo shadow */}
        <circle cx="155" cy="185" r="130" fill={brandColors.primary} opacity="0.08" filter="url(#photoShadow)" />
        <circle cx="155" cy="185" r="130" fill="#f3f4f6" />
        {cardData.headshot
          ? <image href={cardData.headshot} x="25" y="55" width="260" height="260" clipPath="url(#photo-clip-h)" preserveAspectRatio="xMidYMid slice" />
          : <>
            <circle cx="155" cy="155" r="38" fill="#9ca3af" />
            <path d="M65,280 C65,235 100,218 155,218 C210,218 245,235 245,280 Z" fill="#9ca3af" clipPath="url(#photo-clip-h)" />
            <text x="155" y="310" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6b7280" className="fc-body">UPLOAD PHOTO</text>
          </>}
        {/* Brand ring around photo */}
        <circle cx="155" cy="185" r="133" fill="none" stroke={brandColors.primary} strokeWidth="3" opacity="0.35" />
        {editorMode && <><circle cx="155" cy="185" r="136" className="drag-outline" />{resizeHandle("photo", 280, 310)}</>}
      </g>

      {/* ── Logo (top-right) — no border, transparent PNG renders directly ── */}
      <g {...dragHandle("logo")} transform={`translate(${offsets.logo?.x || 0},${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1})`}>
        {cardData.brandLogo
          ? <image href={cardData.brandLogo} x="630" y="12" width="140" height="50" preserveAspectRatio="xMidYMid meet" />
          : <text x="700" y="43" textAnchor="middle" fontSize="11" fontWeight="600" fill={brandColors.primary} className="fc-body" letterSpacing="0.5" opacity="0.5">YOUR LOGO</text>}
        {editorMode && <><rect x="626" y="8" width="148" height="58" rx="6" className="drag-outline" />{resizeHandle("logo", 774, 66)}</>}
      </g>

      {/* ── Name ── */}
      <g {...dragHandle("name")} transform={`translate(${offsets.name?.x || 0},${offsets.name?.y || 0})`}>
        <text x="310" y="90" className="fc-name" fontSize={offsets.name?.fontSize || 44} fontWeight="800" letterSpacing="-0.5">
          <tspan fill={nameColor1}>{firstName}</tspan>
          {lastName && <tspan fill={nameColor2}> {lastName}</tspan>}
        </text>
        <line x1="310" y1="107" x2="355" y2="107" stroke={accentLine} strokeWidth="5" strokeLinecap="round" />
        {editorMode && <rect x="304" y="45" width="380" height="70" rx="6" className="drag-outline" />}
      </g>

      {/* ── Designation ── */}
      <g {...dragHandle("designation")} transform={`translate(${offsets.designation?.x || 0},${offsets.designation?.y || 0})`}>
        {/* Designation */}
        <text x="310" y="133" fontSize={offsets.designation?.fontSize || 15} fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.designation, 35) || "Head of Marketing"}</text>
        {/* Thin separator line between Designation and Office Name */}

        {/* Office Name */}
        <text x="310" y="157" fontSize={(offsets.designation?.fontSize || 15) - 1} fontWeight="600" fill={nameColor2} className="fc-body">{truncate(cardData.officeName, 30) || "Company Name"}</text>
        {editorMode && <rect x="304" y="118" width="340" height="48" rx="6" className="drag-outline" />}
      </g>

      {/* ── Contacts (stacked: Mobile, Phone, Email, Website) — NO address here, address has its own section below ── */}
      {scaledGroup("contacts", <>
        {editorMode && <rect x="304" y="173" width="310" height="160" rx="6" className="drag-outline" />}
        <line x1="310" y1="178" x2="610" y2="178" stroke="#e5e7eb" strokeWidth="1" />
        {/* Mobile */}
        <a href={`tel:${cardData.phone}`} target="_blank" rel="noopener noreferrer">
          <circle cx="325" cy="205" r="13" fill={brandColors.primary} />
          <path d={ICONS.phone} fill="#fff" transform="translate(318.5,198.5) scale(0.55)" />
          <text x="348" y="210" fontSize="11" fontWeight="600" fill={(!cardData.phone || cardData.phone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.phone, 30) || "Data Missing"}</text>
        </a>
        {/* Phone */}
        <a href={`tel:${cardData.telephone || ""}`} target="_blank" rel="noopener noreferrer">
          <circle cx="325" cy="240" r="13" fill={brandColors.primary} />
          <path d={ICONS.phone} fill="#fff" transform="translate(318.5,233.5) scale(0.55)" />
          <text x="348" y="245" fontSize="11" fontWeight="600" fill={(!cardData.telephone || cardData.telephone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.telephone, 30) || "Data Missing"}</text>
        </a>
        {/* Email */}
        <a href={`mailto:${cardData.email}`} target="_blank" rel="noopener noreferrer">
          <circle cx="325" cy="275" r="13" fill={brandColors.primary} />
          <path d={ICONS.email} fill="#fff" transform="translate(318.5,268.5) scale(0.55)" />
          <path d={ICONS.emailChevron} stroke="#fff" strokeWidth="2" fill="none" transform="translate(318.5,268.5) scale(0.55)" />
          <text x="348" y="280" fontSize="11" fontWeight="600" fill={(!cardData.email || cardData.email === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.email, 30) || "Data Missing"}</text>
        </a>
        {/* Website */}
        <a href={getWebsite() || "#"} target="_blank" rel="noopener noreferrer">
          <circle cx="325" cy="310" r="13" fill={brandColors.primary} />
          <path d={ICONS.globe} fill="#fff" transform="translate(318.5,303.5) scale(0.55)" />
          <text x="348" y="315" fontSize="11" fontWeight="600" fill={(!getWebsite()) ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.social?.website || "", 30) || "Data Missing"}</text>
        </a>
      </>)}

      {/* Vertical divider */}
      <line x1="622" y1="178" x2="622" y2="345" stroke="url(#dividerGrad)" strokeWidth="1.5" />

      {/* ── QR ── */}
      <g {...dragHandle("qr")} transform={`translate(${offsets.qr?.x || 0},${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1})`}>
        <a href={getQRValue()} target="_blank" rel="noopener noreferrer">
          <rect x="638" y="178" width="118" height="118" rx="10" stroke={brandColors.primary} strokeWidth="1.5" fill="#fff" />
          {/* Premium double border */}
          <rect x="641" y="181" width="112" height="112" rx="8" stroke={brandColors.primary} strokeWidth="0.5" fill="none" opacity="0.3" />
          <svg x="646" y="186" width="102" height="102">
            <QRCodeSVG value={getQRValue()} size={102} level="H" includeMargin={false} />
          </svg>
          <rect x="638" y="302" width="118" height="28" rx="14" fill={brandColors.primary} />
          <text x="697" y="320" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" className="fc-body" letterSpacing="0.5">SCAN TO CONNECT</text>
        </a>
        {editorMode && <><rect x="633" y="173" width="128" height="163" rx="6" className="drag-outline" />{resizeHandle("qr", 761, 336)}</>}
      </g>

      {/* ── Bottom bar: Address + Socials ── */}
      <line x1="50" y1="350" x2="750" y2="350" stroke="url(#dividerGrad)" strokeWidth="1.5" />
      {scaledGroup("address", <>
        {editorMode && <rect x="44" y="350" width="710" height="90" rx="6" className="drag-outline" />}
        <path d={ICONS.mapPin} fill={brandColors.primary} transform="translate(53,359) scale(0.75)" />
        <text x="75" y="370" fontSize="10" fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.officeName, 28) || "Company Name Pvt. Ltd."}</text>
        {multiline(cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune – 411089", 75, 386, 50, 13,
          { fontSize: 9, fontWeight: "500", fill: themeSubText, className: "fc-body" })}

      </>)}
      {scaledGroup("socials", <>
        <SocialIcon cx={437} cy={390} iconPath={ICONS.whatsapp} bgColor="#25D366" href={cardData.social.whatsapp || "#"} label="WhatsApp" />
        <line x1="463" y1="376" x2="463" y2="407" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={490} cy={390} iconPath={ICONS.linkedin} bgColor="#0077b5" href={cardData.social.linkedin || "#"} label="LinkedIn" />
        <line x1="514" y1="376" x2="514" y2="407" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={543} cy={390} iconPath={ICONS.instagram} bgColor="#e1306c" href={cardData.social.instagram || "#"} label="Instagram" />
        <line x1="567" y1="376" x2="567" y2="407" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={596} cy={390} iconPath={ICONS.youtube} bgColor="#ff0000" href={cardData.social.youtube || "#"} label="YouTube" />
        <line x1="620" y1="376" x2="620" y2="407" stroke="#e5e7eb" strokeWidth="0.8" />

        <SocialIcon cx={649} cy={390} iconPath={ICONS.twitter} bgColor="#1da1f2" href={cardData.social.twitter || "#"} label="Twitter" />
        <line x1="673" y1="376" x2="673" y2="407" stroke="#e5e7eb" strokeWidth="0.8" />
        <SocialIcon cx={702} cy={390} iconPath={ICONS.facebook} bgColor="#1877f2" href={cardData.social.facebook || "#"} label="Facebook" />
      </>)}
      {/* ── Free-form text boxes (draggable, optional) ── */}
      {renderTextBoxes()}
    </svg>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // Layout 3 & 4: Vertical  (viewBox 514×900)
  // ═════════════════════════════════════════════════════════════════════════════
  const renderVertical = () => {
    const hasPhoto = layoutType === "vertical-with-photo";
    return (
      <svg id="digital-card-svg" viewBox="0 0 514 760"
        className="w-full h-full" xmlns="http://www.w3.org/2000/svg"
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {svgDefs}
        <defs>
          <clipPath id="photo-clip-v"><circle cx="385" cy="195" r="90" /></clipPath>
        </defs>
        {/* Background */}
        <rect width="514" height="760"
          fill={cardData.customBg || (activeTheme.bgGradientId ? `url(#${activeTheme.bgGradientId})` : activeTheme.bg)}
          rx="12" />
        {/* ── Brand accent strip (top) ── */}
        <rect x="0" y="0" width="514" height="5" fill={activeTheme.accentStrip} rx="2" />

        {/* ── Logo — no border, transparent PNG renders directly ── */}
        <g {...dragHandle("logo")} transform={`translate(${offsets.logo?.x || 0},${offsets.logo?.y || 0}) scale(${offsets.logo?.scale || 1})`}>
          {cardData.brandLogo
            ? <image href={cardData.brandLogo} x="340" y="8" width="150" height="50" preserveAspectRatio="xMidYMid meet" />
            : <text x="415" y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill={brandColors.primary} className="fc-body" letterSpacing="0.5" opacity="0.5">YOUR LOGO</text>}
          {editorMode && <><rect x="336" y="4" width="158" height="58" rx="6" className="drag-outline" />{resizeHandle("logo", 494, 62)}</>}
        </g>

        {/* ── Profile Photo (right column, if enabled) ── */}
        {hasPhoto && (
          <g {...dragHandle("photo")} transform={`translate(${offsets.photo?.x || 0},${offsets.photo?.y || 0}) scale(${offsets.photo?.scale || 1})`}>
            {/* Shadow glow */}
            <circle cx="385" cy="195" r="90" fill={brandColors.primary} opacity="0.07" filter="url(#photoShadow)" />
            <circle cx="385" cy="195" r="90" fill="#f3f4f6" />
            {cardData.headshot
              ? <image href={cardData.headshot} x="295" y="105" width="180" height="180" clipPath="url(#photo-clip-v)" preserveAspectRatio="xMidYMid slice" />
              : <>
                <circle cx="385" cy="175" r="28" fill="#9ca3af" />
                <path d="M330,255 C330,230 355,220 385,220 C415,220 440,230 440,255 Z" fill="#9ca3af" clipPath="url(#photo-clip-v)" />
                <text x="385" y="272" textAnchor="middle" fontSize="10" fontWeight="600" fill="#6b7280" className="fc-body">UPLOAD PHOTO</text>
              </>}
            {/* Brand ring */}
            <circle cx="385" cy="195" r="93" fill="none" stroke={brandColors.primary} strokeWidth="3" opacity="0.35" />
            {editorMode && <><circle cx="385" cy="195" r="96" className="drag-outline" />{resizeHandle("photo", 470, 280)}</>}
          </g>
        )}

        {/* ── Name ── */}
        <g {...dragHandle("name")} transform={`translate(${offsets.name?.x || 0},${offsets.name?.y || 0})`}>
          <text x="38" y={hasPhoto ? 145 : 160} className="fc-name" fontSize={offsets.name?.fontSize || 32} fontWeight="800" letterSpacing="-0.5" fill={nameColor1}>
            <tspan x="38">{firstName}</tspan>
            {lastName && <tspan x="38" dy={offsets.name?.fontSize ? offsets.name.fontSize + 4 : 36} fill={nameColor2}>{lastName}</tspan>}
          </text>
          <line x1="38" y1={hasPhoto ? 200 : 225} x2="83" y2={hasPhoto ? 200 : 225} stroke={accentLine} strokeWidth="5" strokeLinecap="round" />
          {editorMode && <rect x="32" y={hasPhoto ? 105 : 120} width={hasPhoto ? 255 : 435} height="100" rx="6" className="drag-outline" />}
        </g>

        {/* ── Designation ── */}
        <g {...dragHandle("designation")} transform={`translate(${offsets.designation?.x || 0},${offsets.designation?.y || 0})`}>
          {/* Designation */}
          <text x="38" y={hasPhoto ? 225 : 255} fontSize={offsets.designation?.fontSize || 14} fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.designation, 32) || "Head of Marketing"}</text>
          {/* Thin separator line */}

          {/* Office Name */}
          <text x="38" y={hasPhoto ? 250 : 280} fontSize={(offsets.designation?.fontSize || 14) - 1} fontWeight="600" fill={nameColor2} className="fc-body">{truncate(cardData.officeName, 30) || "Company Name"}</text>
          {editorMode && <rect x="32" y={hasPhoto ? 210 : 240} width="440" height="50" rx="6" className="drag-outline" />}
        </g>

        {/* Separator — gradient */}
        <line x1="38" y1={hasPhoto ? 270 : 295} x2="476" y2={hasPhoto ? 270 : 295} stroke="url(#dividerGrad)" strokeWidth="1.5" />

        {/* ── Contacts (2×2 grid) — Mobile/Phone top row, Email/Website bottom row ── */}
        {scaledGroup("contacts", <>
          {editorMode && <rect x="32" y={hasPhoto ? 274 : 299} width="450" height="140" rx="6" className="drag-outline" />}
          {/* Mobile — top left */}
          <a href={`tel:${cardData.phone}`} target="_blank" rel="noopener noreferrer">
            <circle cx="60" cy={hasPhoto ? 305 : 330} r="15" fill={activeTheme.iconBg} />
            <path d={ICONS.phone} fill="#fff" transform={`translate(52.5,${hasPhoto ? 297.5 : 322.5}) scale(0.63)`} />
            <text x="84" y={hasPhoto ? 299 : 324} fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body" letterSpacing="0.5">MOBILE</text>
            <text x="84" y={hasPhoto ? 313 : 338} fontSize="11" fontWeight="600" fill={(!cardData.phone || cardData.phone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.phone, 26) || "Data Missing"}</text>
          </a>
          {/* Phone — top right */}
          <a href={`tel:${cardData.telephone || ""}`} target="_blank" rel="noopener noreferrer">
            <circle cx="270" cy={hasPhoto ? 305 : 330} r="15" fill={activeTheme.iconBg} />
            <path d={ICONS.phone} fill="#fff" transform={`translate(262.5,${hasPhoto ? 297.5 : 322.5}) scale(0.63)`} />
            <text x="294" y={hasPhoto ? 299 : 324} fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body" letterSpacing="0.5">PHONE</text>
            <text x="294" y={hasPhoto ? 313 : 338} fontSize="11" fontWeight="600" fill={(!cardData.telephone || cardData.telephone === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.telephone, 26) || "Data Missing"}</text>
          </a>
          {/* Email — bottom left */}
          <a href={`mailto:${cardData.email}`} target="_blank" rel="noopener noreferrer">
            <circle cx="60" cy={hasPhoto ? 358 : 383} r="15" fill={activeTheme.iconBg} />
            <path d={ICONS.email} fill="#fff" transform={`translate(52.5,${hasPhoto ? 350.5 : 375.5}) scale(0.63)`} />
            <path d={ICONS.emailChevron} stroke="#fff" strokeWidth="2" fill="none" transform={`translate(52.5,${hasPhoto ? 350.5 : 375.5}) scale(0.63)`} />
            <text x="84" y={hasPhoto ? 352 : 377} fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body" letterSpacing="0.5">EMAIL</text>
            <text x="84" y={hasPhoto ? 366 : 391} fontSize="11" fontWeight="600" fill={(!cardData.email || cardData.email === "Data Missing") ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.email, 26) || "Data Missing"}</text>
          </a>
          {/* Website — bottom right */}
          <a href={getWebsite() || "#"} target="_blank" rel="noopener noreferrer">
            <circle cx="270" cy={hasPhoto ? 358 : 383} r="15" fill={activeTheme.iconBg} />
            <path d={ICONS.globe} fill="#fff" transform={`translate(262.5,${hasPhoto ? 350.5 : 375.5}) scale(0.63)`} />
            <text x="294" y={hasPhoto ? 352 : 377} fontSize="8" fontWeight="700" fill={themeSubText} className="fc-body" letterSpacing="0.5">WEBSITE</text>
            <text x="294" y={hasPhoto ? 366 : 391} fontSize="11" fontWeight="600" fill={(!getWebsite()) ? "#ef4444" : themeBodyText} className="fc-body">{truncate(cardData.social?.website || "", 26) || "Data Missing"}</text>
          </a>
        </>)}

        {/* Separator — gradient */}
        <line x1="38" y1={hasPhoto ? 408 : 433} x2="476" y2={hasPhoto ? 408 : 433} stroke="url(#dividerGrad)" strokeWidth="1.5" />

        {/* ── Address (bottom-left) ── */}
        {scaledGroup("address", <>
          {editorMode && <rect x="32" y={hasPhoto ? 412 : 437} width="240" height="180" rx="6" className="drag-outline" />}
          <path d={ICONS.mapPin} fill={activeTheme.iconBg} transform={`translate(38,${hasPhoto ? 423 : 448}) scale(0.8)`} />
          <text x="62" y={hasPhoto ? 437 : 462} fontSize="10" fontWeight="700" fill={themeBodyText} className="fc-body">ADDRESS</text>
          <text x="62" y={hasPhoto ? 454 : 479} fontSize="10" fontWeight="700" fill={themeBodyText} className="fc-body">{truncate(cardData.officeName, 25) || "Company Name Pvt. Ltd."}</text>
          {multiline(cardData.address || "City, State, Country", 62, hasPhoto ? 470 : 495, 28, 14,
            { fontSize: 9.5, fontWeight: "500", fill: themeSubText, className: "fc-body" })}
        </>)}

        {/* ── QR Code (bottom-right) ── */}
        <g {...dragHandle("qr")} transform={`translate(${offsets.qr?.x || 0},${offsets.qr?.y || 0}) scale(${offsets.qr?.scale || 1})`}>
          <a href={getQRValue()} target="_blank" rel="noopener noreferrer">
            <rect x="295" y={hasPhoto ? 414 : 439} width="178" height="178" rx="12" stroke={activeTheme.accentStrip} strokeWidth="1.5" fill={activeTheme.textStyle === "light" ? "#1e293b" : "#fff"} />
            {/* Premium double border */}
            <rect x="298" y={hasPhoto ? 417 : 442} width="172" height="172" rx="10" stroke={activeTheme.accentStrip} strokeWidth="0.5" fill="none" opacity="0.3" />
            <svg x="305" y={hasPhoto ? 424 : 449} width="158" height="158">
              <QRCodeSVG value={getQRValue()} size={158} level="H" includeMargin={false} bgColor={activeTheme.textStyle === "light" ? "#1e293b" : "#ffffff"} fgColor={activeTheme.textStyle === "light" ? "#ffffff" : "#000000"} />
            </svg>
            <rect x="295" y={hasPhoto ? 598 : 623} width="178" height="30" rx="15" fill={activeTheme.accentStrip} />
            <text x="384" y={hasPhoto ? 617 : 642} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" className="fc-body" letterSpacing="0.5">SCAN TO CONNECT</text>
          </a>
          {editorMode && <><rect x="290" y={hasPhoto ? 409 : 434} width="188" height="228" rx="6" className="drag-outline" />{resizeHandle("qr", 478, hasPhoto ? 637 : 662)}</> }
        </g>

        {/* ── Socials Bar (bottom) ── */}
        <line x1="38" y1={hasPhoto ? 660 : 685} x2="476" y2={hasPhoto ? 660 : 685} stroke="url(#dividerGrad)" strokeWidth="1.5" />
        {scaledGroup("socials", <>
          {editorMode && <rect x="32" y={hasPhoto ? 664 : 689} width="450" height="55" rx="6" className="drag-outline" />}
          <SocialIcon cx={55} cy={hasPhoto ? 700 : 725} iconPath={ICONS.whatsapp} bgColor="#25D366" href={cardData.social.whatsapp || "#"} label="WHATSAPP" />
          <line x1="91" y1={hasPhoto ? 685 : 710} x2="91" y2={hasPhoto ? 725 : 750} stroke="#e5e7eb" strokeWidth="0.8" />
          <SocialIcon cx={127} cy={hasPhoto ? 700 : 725} iconPath={ICONS.linkedin} bgColor="#0077b5" href={cardData.social.linkedin || "#"} label="LINKEDIN" />
          <line x1="163" y1={hasPhoto ? 685 : 710} x2="163" y2={hasPhoto ? 725 : 750} stroke="#e5e7eb" strokeWidth="0.8" />
          <SocialIcon cx={199} cy={hasPhoto ? 700 : 725} iconPath={ICONS.instagram} bgColor="#e1306c" href={cardData.social.instagram || "#"} label="INSTAGRAM" />
          <line x1="235" y1={hasPhoto ? 685 : 710} x2="235" y2={hasPhoto ? 725 : 750} stroke="#e5e7eb" strokeWidth="0.8" />
          <SocialIcon cx={271} cy={hasPhoto ? 700 : 725} iconPath={ICONS.youtube} bgColor="#ff0000" href={cardData.social.youtube || "#"} label="YOUTUBE" />
          <line x1="307" y1={hasPhoto ? 685 : 710} x2="307" y2={hasPhoto ? 725 : 750} stroke="#e5e7eb" strokeWidth="0.8" />
          <SocialIcon cx={343} cy={hasPhoto ? 700 : 725} iconPath={ICONS.twitter} bgColor="#1da1f2" href={cardData.social.twitter || "#"} label="TWITTER" />
          <line x1="379" y1={hasPhoto ? 685 : 710} x2="379" y2={hasPhoto ? 725 : 750} stroke="#e5e7eb" strokeWidth="0.8" />
          <SocialIcon cx={415} cy={hasPhoto ? 700 : 725} iconPath={ICONS.facebook} bgColor="#1877f2" href={cardData.social.facebook || "#"} label="FACEBOOK" />
        </>)}
        {/* ── Free-form text boxes (draggable, optional) ── */}
        {renderTextBoxes()}
      </svg>
    );
  };

  const renderCard = () => {
    switch (layoutType) {
      case "horizontal-no-photo": return renderHorizontalNoPhoto();
      case "horizontal-with-photo": return renderHorizontalWithPhoto();
      case "vertical-no-photo":
      case "vertical-with-photo": return renderVertical();
      default: return renderHorizontalNoPhoto();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Card Preview Area */}
      <div className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 rounded-2xl border border-gray-200 shadow-inner">
        {!isPublicView && (
          <div className="flex gap-2 mb-3 justify-center w-full flex-wrap">
            <Button onClick={() => setEditorMode(!editorMode)} variant={editorMode ? "default" : "outline"}
              className={`gap-2 font-semibold shadow-sm text-xs h-8 ${editorMode ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-white"}`}>
              <Move size={14} />
              {editorMode ? "Exit Editor" : "Edit Layout"}
            </Button>
            {editorMode && (
              <Button variant="ghost" size="sm" className="text-gray-500 text-xs border bg-white h-8"
                onClick={() => updateOffsets(defaultOffsets)}>
                Reset Layout
              </Button>
            )}
          </div>
        )}

        <div ref={cardRef} className={`w-full ${layoutType.startsWith("vertical") ? "max-w-xs" : "max-w-3xl"} ${layoutType.startsWith("vertical") ? "aspect-[4/7]" : "aspect-[7/4]"} relative rounded-xl shadow-lg border border-gray-200 bg-white overflow-hidden`}>
          {renderCard()}
        </div>
      </div>

      {/* Font & Size Controls — always visible, no editor-mode gate */}
      {!isPublicView && (
        <div className="w-full bg-white border border-teal-100 p-4 rounded-xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">
            <Settings size={14} className="text-teal-600" />
            FONT &amp; SIZE CONTROLS
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { key: "name", label: "Name Font Size", prop: "fontSize" as const, min: 18, max: 64, def: layoutType.startsWith("vertical") ? 32 : 44 },
              { key: "designation", label: "Title Font Size", prop: "fontSize" as const, min: 10, max: 28, def: 15 },
              { key: "logo", label: "Logo Scale", prop: "scale" as const, min: 50, max: 200, def: 100 },
              { key: "qr", label: "QR Scale", prop: "scale" as const, min: 50, max: 180, def: 100 },
              { key: "contacts", label: "Contacts Scale", prop: "scale" as const, min: 50, max: 150, def: 100 },
              { key: "address", label: "Address Scale", prop: "scale" as const, min: 50, max: 150, def: 100 },
              { key: "socials", label: "Social Icons Scale", prop: "scale" as const, min: 50, max: 150, def: 100 },
            ].map(({ key, label, prop, min, max, def }) => {
              const rawVal = prop === "scale" ? Math.round((offsets[key]?.scale || 1.0) * 100) : (offsets[key]?.fontSize || def);
              const displayVal = prop === "scale" ? `${rawVal}%` : `${rawVal}px`;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>{label}</span><span className="text-teal-600">{displayVal}</span>
                  </div>
                  <input type="range" min={min} max={max} value={rawVal}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      handleSliderChange(key, prop, prop === "scale" ? parseFloat((v / 100).toFixed(2)) : v);
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                </div>
              );
            })}
            {(layoutType === "horizontal-with-photo" || layoutType === "vertical-with-photo") && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>Photo Scale</span><span className="text-teal-600">{Math.round((offsets.photo?.scale || 1.0) * 100)}%</span>
                </div>
                <input type="range" min={50} max={180} value={Math.round((offsets.photo?.scale || 1.0) * 100)}
                  onChange={(e) => handleSliderChange("photo", "scale", parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">💡 Click <strong>Edit Layout</strong> above to drag elements around the card. Sliders work at all times.</p>
        </div>
      )}

    </div>
  );
}
