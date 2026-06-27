import { useRef, useState } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Share2, MessageCircle } from "lucide-react";
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
}

// Self-contained raw SVG path definitions for printing & rendering on canvas
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

export default function CardPreview({ cardData, layoutType }: CardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // Helper to split address into separate lines by comma
  const splitAddress = (address: string): string[] => {
    if (!address) return [];
    return address.split(",").map((p) => p.trim()).filter(Boolean);
  };

  const [firstName, lastName] = splitName(cardData.name || "Babu Chakraborty");

  const brandColors = {
    primary: cardData.brandColors?.primary || "#047857", // default Sorigin Group green
    secondary: cardData.brandColors?.secondary || "#0d9488"
  };

  // Generate standard vCard standard string
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

    if (cardData.social.linkedin) vcard += `\nURL;TYPE=LINKEDIN:${cardData.social.linkedin}`;
    if (cardData.social.twitter) vcard += `\nURL;TYPE=TWITTER:${cardData.social.twitter}`;
    if (cardData.social.instagram) vcard += `\nURL;TYPE=INSTAGRAM:${cardData.social.instagram}`;
    if (cardData.social.facebook) vcard += `\nURL;TYPE=FACEBOOK:${cardData.social.facebook}`;
    if (cardData.social.youtube) vcard += `\nURL;TYPE=YOUTUBE:${cardData.social.youtube}`;
    if (cardData.social.whatsapp) vcard += `\nURL;TYPE=WHATSAPP:${cardData.social.whatsapp}`;

    vcard += `\nEND:VCARD`;
    return vcard;
  };

  // Client-side SVG Download
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

  // Client-side PNG Download
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

  // Client-side PDF Download
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

  // Share WhatsApp Link
  const shareWhatsApp = () => {
    try {
      const vcard = generateVCard();
      const message = `Check out my digital visiting card!\n\n${cardData.name}\n${cardData.designation}\n\n${vcard}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappURL, "_blank");
      toast.success("Opening WhatsApp...");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("Failed to open WhatsApp");
    }
  };

  // Render SVG content inside main container
  const renderSvgCard = () => {
    if (layoutType === "horizontal-no-photo") {
      return (
        <svg
          id="digital-card-svg"
          viewBox="0 0 800 450"
          className="w-full h-full object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Custom Poppins styling to load fonts natively */}
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap');
              text, tspan {'{'} font-family: 'Poppins', 'Helvetica Neue', sans-serif; {'}'}
            </style>
          </defs>

          {/* Background Card Base */}
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g>
            <rect
              x="635"
              y="20"
              width="115"
              height="38"
              rx="4"
              stroke={brandColors.primary}
              strokeWidth="1"
              fill="none"
            />
            {cardData.brandLogo ? (
              <image
                href={cardData.brandLogo}
                x="637"
                y="22"
                width="111"
                height="34"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <text
                x="692.5"
                y="43"
                textAnchor="middle"
                fontSize="12"
                fontWeight="500"
                fill={brandColors.primary}
              >
                Logo
              </text>
            )}
          </g>

          {/* Name & Title Section */}
          <text x="50" y="105" fontSize="48" fontWeight="700" fill="#000000">
            {firstName}
          </text>
          {lastName && (
            <text x="50" y="152" fontSize="48" fontWeight="700" fill={brandColors.primary}>
              {lastName}
            </text>
          )}

          {/* Green accent line */}
          <line
            x1="50"
            y1="178"
            x2="95"
            y2="178"
            stroke={brandColors.primary}
            strokeWidth="5"
          />

          {/* Job details */}
          <text x="50" y="212" fontSize="18" fontWeight="700" fill="#000000">
            {cardData.designation || "Head of Marketing"}
          </text>
          <text x="50" y="234" fontSize="18" fontWeight="500" fill={brandColors.primary}>
            {cardData.officeName || "Sorigin Group"}
          </text>

          {/* Row 1 Divider */}
          <line x1="50" y1="265" x2="750" y2="265" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Contacts Row */}
          <g>
            {/* Phone */}
            <circle cx="65" cy="292" r="13" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.phone}
              fill="#ffffff"
              transform="translate(58.5, 285.5) scale(0.55)"
            />
            <text x="88" y="297" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.phone || "+91 98220 12345"}
            </text>

            <line x1="225" y1="282" x2="225" y2="302" stroke="#d1d5db" strokeWidth="1.5" />

            {/* WhatsApp */}
            <circle cx="243" cy="292" r="13" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.whatsapp}
              fill="#ffffff"
              transform="translate(236.5, 285.5) scale(0.55)"
            />
            <text x="266" y="297" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.phone || "+91 98220 12345"}
            </text>

            <line x1="400" y1="282" x2="400" y2="302" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Email */}
            <circle cx="418" cy="292" r="13" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.email}
              fill="#ffffff"
              transform="translate(411.5, 285.5) scale(0.55)"
            />
            <path
              d={RAW_ICONS.emailLine}
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
              transform="translate(411.5, 285.5) scale(0.55)"
            />
            <text x="441" y="297" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.email || "babu.chakraborty@sorigin.in"}
            </text>
          </g>

          {/* Row 2 Divider */}
          <line x1="50" y1="320" x2="750" y2="320" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Address Row */}
          <g>
            <path
              d={RAW_ICONS.mapPin}
              fill={brandColors.primary}
              transform="translate(52, 335) scale(0.85)"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              fill="#ffffff"
              transform="translate(52, 335) scale(0.85)"
            />
            <text x="88" y="352" fontSize="12" fontWeight="700" fill="#000000">
              {cardData.officeName || "Sorigin Group Pvt. Ltd."}
            </text>
            <text x="235" y="352" fontSize="12" fontWeight="500" fill="#000000">
              |  {cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089, Maharashtra, India"}
            </text>
          </g>

          {/* Row 3 Divider */}
          <line x1="50" y1="375" x2="750" y2="375" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Social Row & QR Section */}
          <g>
            {/* LinkedIn */}
            <circle cx="65" cy="408" r="12" fill="#0077b5" />
            <path
              d={RAW_ICONS.linkedin}
              fill="#ffffff"
              transform="translate(58.5, 401.5) scale(0.55)"
            />
            <text x="85" y="413" fontSize="12" fontWeight="500" fill="#000000">
              LinkedIn
            </text>

            <line x1="165" y1="398" x2="165" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Instagram */}
            <circle cx="185" cy="408" r="12" fill="#e1306c" />
            <path
              d={RAW_ICONS.instagram}
              fill="#ffffff"
              transform="translate(178.5, 401.5) scale(0.55)"
            />
            <text x="205" y="413" fontSize="12" fontWeight="500" fill="#000000">
              Instagram
            </text>

            <line x1="290" y1="398" x2="290" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* YouTube */}
            <circle cx="310" cy="408" r="12" fill="#ff0000" />
            <path
              d={RAW_ICONS.youtube}
              fill="#ffffff"
              transform="translate(303.5, 401.5) scale(0.55)"
            />
            <text x="330" y="413" fontSize="12" fontWeight="500" fill="#000000">
              YouTube
            </text>

            <line x1="405" y1="398" x2="405" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Twitter */}
            <circle cx="425" cy="408" r="12" fill="#1da1f2" />
            <path
              d={RAW_ICONS.twitter}
              fill="#ffffff"
              transform="translate(418.5, 401.5) scale(0.55)"
            />
            <text x="445" y="413" fontSize="12" fontWeight="500" fill="#000000">
              Twitter
            </text>

            <line x1="510" y1="398" x2="510" y2="418" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Facebook */}
            <circle cx="530" cy="408" r="12" fill="#1877f2" />
            <path
              d={RAW_ICONS.facebook}
              fill="#ffffff"
              transform="translate(523.5, 401.5) scale(0.55)"
            />
            <text x="550" y="413" fontSize="12" fontWeight="500" fill="#000000">
              Facebook
            </text>
          </g>

          {/* QR Code Container */}
          <g>
            <rect
              x="635"
              y="220"
              width="115"
              height="115"
              rx="8"
              stroke={brandColors.primary}
              strokeWidth="1"
              fill="#ffffff"
            />
            <svg x="645" y="228" width="95" height="95">
              <QRCode value={generateVCard()} size={95} level="H" includeMargin={false} />
            </svg>
            <rect
              x="635"
              y="323"
              width="115"
              height="20"
              rx="4"
              fill={brandColors.primary}
            />
            <text
              x="692.5"
              y="336"
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#ffffff"
            >
              SCAN TO CONNECT
            </text>
          </g>
        </svg>
      );
    } else if (layoutType === "horizontal-with-photo") {
      return (
        <svg
          id="digital-card-svg"
          viewBox="0 0 800 450"
          className="w-full h-full object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap');
              text, tspan {'{'} font-family: 'Poppins', 'Helvetica Neue', sans-serif; {'}'}
            </style>
            <clipPath id="circle-photo-clip">
              <circle cx="170" cy="210" r="100" />
            </clipPath>
          </defs>

          {/* Background Card Base */}
          <rect width="800" height="450" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g>
            <rect
              x="635"
              y="20"
              width="115"
              height="38"
              rx="4"
              stroke={brandColors.primary}
              strokeWidth="1"
              fill="none"
            />
            {cardData.brandLogo ? (
              <image
                href={cardData.brandLogo}
                x="637"
                y="22"
                width="111"
                height="34"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <text
                x="692.5"
                y="43"
                textAnchor="middle"
                fontSize="12"
                fontWeight="500"
                fill={brandColors.primary}
              >
                Logo
              </text>
            )}
          </g>

          {/* Profile Photo */}
          <g>
            {/* Circular shadow and frame */}
            <circle cx="170" cy="210" r="103" stroke="#e5e7eb" strokeWidth="1" fill="none" />
            <circle cx="170" cy="210" r="100" fill="#f3f4f6" />
            
            {cardData.headshot ? (
              <image
                href={cardData.headshot}
                x="70"
                y="110"
                width="200"
                height="200"
                clipPath="url(#circle-photo-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <g>
                <circle cx="170" cy="190" r="30" fill="#9ca3af" />
                <path
                  d="M110,265 C110,225 130,220 170,220 C210,220 230,225 230,265 Z"
                  fill="#9ca3af"
                  clipPath="url(#circle-photo-clip)"
                />
                <text
                  x="170"
                  y="275"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#6b7280"
                >
                  UPLOAD PHOTO
                </text>
              </g>
            )}
            <circle cx="170" cy="210" r="100" stroke="#ffffff" strokeWidth="6" fill="none" />
          </g>

          {/* Name & Details Section */}
          <g>
            <text x="315" y="105" fontSize="48" fontWeight="700" fill="#000000">
              {firstName}
            </text>
            {lastName && (
              <text x="315" y="152" fontSize="48" fontWeight="700" fill={brandColors.primary}>
                {lastName}
              </text>
            )}

            {/* Green Accent Line */}
            <line
              x1="315"
              y1="178"
              x2="360"
              y2="178"
              stroke={brandColors.primary}
              strokeWidth="5"
            />

            {/* Designation & Company */}
            <text x="315" y="212" fontSize="18" fontWeight="700" fill="#000000">
              {cardData.designation || "Head of Marketing"}
            </text>
            <text x="315" y="234" fontSize="18" fontWeight="500" fill={brandColors.primary}>
              {cardData.officeName || "Sorigin Group"}
            </text>
          </g>

          {/* Contact Details (Vertical List) */}
          <g>
            {/* Phone */}
            <circle cx="327" cy="272" r="11" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.phone}
              fill="#ffffff"
              transform="translate(321.5, 266.5) scale(0.45)"
            />
            <text x="348" y="276" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.phone || "+91 98220 12345"}
            </text>

            {/* Email */}
            <circle cx="327" cy="304" r="11" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.email}
              fill="#ffffff"
              transform="translate(321.5, 298.5) scale(0.45)"
            />
            <path
              d={RAW_ICONS.emailLine}
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
              transform="translate(321.5, 298.5) scale(0.45)"
            />
            <text x="348" y="308" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.email || "babu.chakraborty@sorigin.in"}
            </text>

            {/* Website */}
            <circle cx="327" cy="336" r="11" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.globe}
              stroke="#ffffff"
              strokeWidth="2"
              fill="none"
              transform="translate(321.5, 330.5) scale(0.45)"
            />
            <text x="348" y="340" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.social.linkedin ? "www.sorigin.in" : "www.sorigin.in"}
            </text>

            {/* Location */}
            <circle cx="327" cy="368" r="11" fill={brandColors.primary} />
            <path
              d={RAW_ICONS.mapPin}
              fill="#ffffff"
              transform="translate(321.5, 362.5) scale(0.45)"
            />
            <text x="348" y="372" fontSize="13" fontWeight="500" fill="#000000">
              {cardData.address ? cardData.address.split(",").slice(-3).join(", ").trim() : "Pune, Maharashtra, India"}
            </text>
          </g>

          {/* QR Code Container */}
          <g>
            <rect
              x="635"
              y="205"
              width="115"
              height="115"
              rx="8"
              stroke={brandColors.primary}
              strokeWidth="1"
              fill="#ffffff"
            />
            <svg x="645" y="213" width="95" height="95">
              <QRCode value={generateVCard()} size={95} level="H" includeMargin={false} />
            </svg>
            <rect
              x="635"
              y="308"
              width="115"
              height="20"
              rx="4"
              fill={brandColors.primary}
            />
            <text
              x="692.5"
              y="321"
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#ffffff"
            >
              SCAN TO CONNECT
            </text>
          </g>

          {/* Divider above bottom row */}
          <line x1="50" y1="398" x2="750" y2="398" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom row: Address on left, Social links on right */}
          <g>
            {/* Address */}
            <path
              d={RAW_ICONS.mapPin}
              fill={brandColors.primary}
              transform="translate(52, 405) scale(0.7)"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              fill="#ffffff"
              transform="translate(52, 405) scale(0.7)"
            />
            <text x="75" y="418" fontSize="10" fontWeight="700" fill="#000000">
              {cardData.officeName || "Sorigin Group Pvt. Ltd."}
            </text>
            <text x="75" y="430" fontSize="9" fontWeight="500" fill="#6b7280" width="350">
              {cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089, Maharashtra, India"}
            </text>

            {/* Social Icons row */}
            <g>
              {/* LinkedIn */}
              <circle cx="480" cy="413" r="10" fill="#0077b5" />
              <path
                d={RAW_ICONS.linkedin}
                fill="#ffffff"
                transform="translate(475, 408) scale(0.42)"
              />
              <text x="480" y="432" textAnchor="middle" fontSize="8" fontWeight="500" fill="#000000">
                LinkedIn
              </text>

              {/* Instagram */}
              <circle cx="535" cy="413" r="10" fill="#e1306c" />
              <path
                d={RAW_ICONS.instagram}
                fill="#ffffff"
                transform="translate(530, 408) scale(0.42)"
              />
              <text x="535" y="432" textAnchor="middle" fontSize="8" fontWeight="500" fill="#000000">
                Instagram
              </text>

              {/* YouTube */}
              <circle cx="590" cy="413" r="10" fill="#ff0000" />
              <path
                d={RAW_ICONS.youtube}
                fill="#ffffff"
                transform="translate(585, 408) scale(0.42)"
              />
              <text x="590" y="432" textAnchor="middle" fontSize="8" fontWeight="500" fill="#000000">
                YouTube
              </text>

              {/* Twitter */}
              <circle cx="645" cy="413" r="10" fill="#1da1f2" />
              <path
                d={RAW_ICONS.twitter}
                fill="#ffffff"
                transform="translate(640, 408) scale(0.42)"
              />
              <text x="645" y="432" textAnchor="middle" fontSize="8" fontWeight="500" fill="#000000">
                Twitter
              </text>

              {/* Facebook */}
              <circle cx="700" cy="413" r="10" fill="#1877f2" />
              <path
                d={RAW_ICONS.facebook}
                fill="#ffffff"
                transform="translate(695, 408) scale(0.42)"
              />
              <text x="700" y="432" textAnchor="middle" fontSize="8" fontWeight="500" fill="#000000">
                Facebook
              </text>
            </g>
          </g>
        </svg>
      );
    } else {
      // Vertical (3:4 viewBox="0 0 600 900")
      return (
        <svg
          id="digital-card-svg"
          viewBox="0 0 600 900"
          className="w-full h-full object-contain"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;display=swap');
              text, tspan {'{'} font-family: 'Poppins', 'Helvetica Neue', sans-serif; {'}'}
            </style>
            <clipPath id="rect-photo-clip">
              <rect x="380" y="120" width="180" height="220" rx="12" />
            </clipPath>
          </defs>

          {/* Background Card Base */}
          <rect width="600" height="900" fill="#ffffff" rx="16" />

          {/* Logo Section */}
          <g>
            <rect
              x="445"
              y="30"
              width="115"
              height="38"
              rx="4"
              stroke={brandColors.primary}
              strokeWidth="1"
              fill="none"
            />
            {cardData.brandLogo ? (
              <image
                href={cardData.brandLogo}
                x="447"
                y="32"
                width="111"
                height="34"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <text
                x="502.5"
                y="53"
                textAnchor="middle"
                fontSize="12"
                fontWeight="500"
                fill={brandColors.primary}
              >
                Logo
              </text>
            )}
          </g>

          {/* Name & Details Section */}
          <g>
            <text x="40" y="175" fontSize="36" fontWeight="700" fill="#000000">
              {firstName}
            </text>
            {lastName && (
              <text x="40" y="215" fontSize="36" fontWeight="700" fill={brandColors.primary}>
                {lastName}
              </text>
            )}

            {/* Green Accent Line */}
            <line
              x1="40"
              y1="238"
              x2="85"
              y2="238"
              stroke={brandColors.primary}
              strokeWidth="5"
            />

            {/* Designation & Company */}
            <text x="40" y="272" fontSize="18" fontWeight="700" fill="#000000">
              {cardData.designation || "Head of Marketing"}
            </text>
            <text x="40" y="294" fontSize="18" fontWeight="500" fill={brandColors.primary}>
              {cardData.officeName || "Sorigin Group"}
            </text>
          </g>

          {/* Photo Frame Container */}
          <g>
            <rect
              x="380"
              y="120"
              width="180"
              height="220"
              rx="12"
              fill="#f3f4f6"
              stroke="#e5e7eb"
              strokeWidth="1.5"
              strokeDasharray={cardData.headshot ? "none" : "4,4"}
            />
            {cardData.headshot ? (
              <image
                href={cardData.headshot}
                x="380"
                y="120"
                width="180"
                height="220"
                clipPath="url(#rect-photo-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <g>
                <circle cx="470" cy="200" r="30" fill="#9ca3af" />
                <path
                  d="M420,280 C420,240 440,230 470,230 C500,230 520,240 520,280 Z"
                  fill="#9ca3af"
                  clipPath="url(#rect-photo-clip)"
                />
                <text
                  x="470"
                  y="290"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#6b7280"
                >
                  UPLOAD PHOTO
                </text>
              </g>
            )}
          </g>

          {/* Middle: 2x2 grid of contact details (y = 420 for row 1, y = 500 for row 2) */}
          <g>
            {/* Phone (Row 1, Col 1) */}
            <g>
              <circle cx="65" cy="420" r="18" fill={brandColors.primary} />
              <path
                d={RAW_ICONS.phone}
                fill="#ffffff"
                transform="translate(56, 411) scale(0.75)"
              />
              <text x="95" y="415" fontSize="12" fontWeight="700" fill="#000000">
                PHONE
              </text>
              <text x="95" y="433" fontSize="13" fontWeight="500" fill="#000000">
                {cardData.phone || "+91 98220 12345"}
              </text>
            </g>

            {/* WhatsApp (Row 1, Col 2) */}
            <g>
              <circle cx="330" cy="420" r="18" fill={brandColors.primary} />
              <path
                d={RAW_ICONS.whatsapp}
                fill="#ffffff"
                transform="translate(321, 411) scale(0.75)"
              />
              <text x="360" y="415" fontSize="12" fontWeight="700" fill="#000000">
                WHATSAPP
              </text>
              <text x="360" y="433" fontSize="13" fontWeight="500" fill="#000000">
                {cardData.phone || "+91 98220 12345"}
              </text>
            </g>

            {/* Email (Row 2, Col 1) */}
            <g>
              <circle cx="65" cy="500" r="18" fill={brandColors.primary} />
              <path
                d={RAW_ICONS.email}
                fill="#ffffff"
                transform="translate(56, 491) scale(0.75)"
              />
              <path
                d={RAW_ICONS.emailLine}
                stroke="#ffffff"
                strokeWidth="2"
                fill="none"
                transform="translate(56, 491) scale(0.75)"
              />
              <text x="95" y="495" fontSize="12" fontWeight="700" fill="#000000">
                EMAIL
              </text>
              <text x="95" y="513" fontSize="13" fontWeight="500" fill="#000000">
                {cardData.email || "babu.chakraborty@sorigin.in"}
              </text>
            </g>

            {/* Website (Row 2, Col 2) */}
            <g>
              <circle cx="330" cy="500" r="18" fill={brandColors.primary} />
              <path
                d={RAW_ICONS.globe}
                stroke="#ffffff"
                strokeWidth="2"
                fill="none"
                transform="translate(321, 491) scale(0.75)"
              />
              <text x="360" y="495" fontSize="12" fontWeight="700" fill="#000000">
                WEBSITE
              </text>
              <text x="360" y="513" fontSize="13" fontWeight="500" fill="#000000">
                www.sorigin.in
              </text>
            </g>
          </g>

          {/* Middle Row Divider */}
          <line x1="40" y1="560" x2="560" y2="560" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Bottom Section: Address on Left, QR code on Right */}
          <g>
            {/* Address Column */}
            <g>
              <path
                d={RAW_ICONS.mapPin}
                fill={brandColors.primary}
                transform="translate(40, 580) scale(0.85)"
              />
              <circle
                cx="12"
                cy="10"
                r="3"
                fill="#ffffff"
                transform="translate(40, 580) scale(0.85)"
              />
              <text x="65" y="594" fontSize="12" fontWeight="700" fill="#000000">
                ADDRESS
              </text>
              <text x="65" y="618" fontSize="12" fontWeight="600" fill="#000000">
                {cardData.officeName || "Sorigin Group Pvt. Ltd."}
              </text>
              {/* Address details split dynamically */}
              <text x="65" y="636" fontSize="12" fontWeight="500" fill="#4b5563">
                {splitAddress(cardData.address || "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089, Maharashtra, India").slice(0, 4).map((line, idx) => (
                  <tspan x="65" dy={idx === 0 ? 0 : 18} key={idx}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>

            {/* QR Column */}
            <g>
              <rect
                x="380"
                y="590"
                width="180"
                height="180"
                rx="16"
                stroke={brandColors.primary}
                strokeWidth="1.5"
                strokeDasharray="4,4"
                fill="#ffffff"
              />
              <svg x="405" y="612" width="130" height="130">
                <QRCode value={generateVCard()} size={130} level="H" includeMargin={false} />
              </svg>
              <rect
                x="380"
                y="780"
                width="180"
                height="30"
                rx="15"
                fill={brandColors.primary}
              />
              <text
                x="470"
                y="799"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
              >
                SCAN TO CONNECT
              </text>
            </g>
          </g>

          {/* Bottom Divider */}
          <line x1="40" y1="835" x2="560" y2="835" stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Social Row at bottom */}
          <g>
            {/* LinkedIn */}
            <g>
              <circle cx="70" cy="855" r="12" fill="#0077b5" />
              <path
                d={RAW_ICONS.linkedin}
                fill="#ffffff"
                transform="translate(63.5, 848.5) scale(0.54)"
              />
              <text x="70" y="882" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280">
                LINKEDIN
              </text>
            </g>

            <line x1="125" y1="845" x2="125" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Instagram */}
            <g>
              <circle cx="180" cy="855" r="12" fill="#e1306c" />
              <path
                d={RAW_ICONS.instagram}
                fill="#ffffff"
                transform="translate(173.5, 848.5) scale(0.54)"
              />
              <text x="180" y="882" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280">
                INSTAGRAM
              </text>
            </g>

            <line x1="235" y1="845" x2="235" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* YouTube */}
            <g>
              <circle cx="290" cy="855" r="12" fill="#ff0000" />
              <path
                d={RAW_ICONS.youtube}
                fill="#ffffff"
                transform="translate(283.5, 848.5) scale(0.54)"
              />
              <text x="290" y="882" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280">
                YOUTUBE
              </text>
            </g>

            <line x1="345" y1="845" x2="345" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Twitter */}
            <g>
              <circle cx="400" cy="855" r="12" fill="#1da1f2" />
              <path
                d={RAW_ICONS.twitter}
                fill="#ffffff"
                transform="translate(393.5, 848.5) scale(0.54)"
              />
              <text x="400" y="882" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280">
                TWITTER
              </text>
            </g>

            <line x1="455" y1="845" x2="455" y2="880" stroke="#d1d5db" strokeWidth="1.5" />

            {/* Facebook */}
            <g>
              <circle cx="510" cy="855" r="12" fill="#1877f2" />
              <path
                d={RAW_ICONS.facebook}
                fill="#ffffff"
                transform="translate(503.5, 848.5) scale(0.54)"
              />
              <text x="510" y="882" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280">
                FACEBOOK
              </text>
            </g>
          </g>
        </svg>
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Card Preview Container */}
      <div className="flex justify-center p-4 bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 rounded-2xl border border-teal-100 shadow-inner">
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
