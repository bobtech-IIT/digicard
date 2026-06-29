import { Check } from "lucide-react";

/** ─────────────────────────────────────────────────────────────────────────────
 * CARD THEMES  ─  Phase 2 Design System
 * Each theme defines every visual token used by CardPreview.
 * ─────────────────────────────────────────────────────────────────────────────*/
export interface CardTheme {
  id: string;
  name: string;
  tag: string;             // short label shown on tile
  bg: string;              // card background fill (hex or "gradient")
  bgGradient?: string;     // linearGradient stops as JSX string (used in svgDefs)
  bgGradientId?: string;   // id for the <linearGradient>
  accentStrip: string;     // top accent bar color
  nameColor1: string;      // first name color
  nameColor2: string;      // last name / accent color
  accentLine: string;      // underline after name
  bodyText: string;        // designation / contact text color
  subText: string;         // secondary label color
  divider: string;         // divider line color
  iconBg: string;          // contact icon circle fill
  previewGradient: string; // CSS gradient string for tile preview
  textStyle: "dark" | "light"; // dark cards need white body text
}

/** ─────────────────────────────────────────────────────────────────────────────
 * DYNAMIC THEME RESOLVER
 * Derives card colors dynamically from user brand colors for a unified palette.
 * Ensures high contrast text colors so that cards are always readable.
 * ─────────────────────────────────────────────────────────────────────────────*/
export function resolveCardTheme(
  themeId: string,
  brandColors?: { primary: string; secondary: string }
): CardTheme {
  const primary = brandColors?.primary || "#047857";
  const secondary = brandColors?.secondary || "#0d9488";

  // Helper to determine if a hex color is light or dark (YIQ model)
  const getContrast = (hex: string) => {
    if (!hex) return "#ffffff";
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return "#ffffff";
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "#111827" : "#ffffff";
  };

  switch (themeId) {
    case "luxury-gold": // Premium
      return {
        id: "luxury-gold",
        name: "Premium Metal",
        tag: "Premium",
        bg: "#2e353b",
        bgGradient: `<linearGradient id="luxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e2226"/>
          <stop offset="25%" stopColor="#5c6570"/>
          <stop offset="50%" stopColor="#b8c0c9"/>
          <stop offset="75%" stopColor="#5c6570"/>
          <stop offset="100%" stopColor="#131619"/>
        </linearGradient>`,
        bgGradientId: "luxGrad",
        accentStrip: primary,
        nameColor1: "#ffffff",
        nameColor2: "#cfd6df",
        accentLine: primary,
        bodyText: "#f3f4f6",
        subText: "#cbd5e1",
        divider: "#4b5563",
        iconBg: primary,
        previewGradient: `linear-gradient(135deg, #1e2226 0%, #5c6570 50%, #b8c0c9 100%)`,
        textStyle: "light",
      };

    case "cyber-gradient": // Tech
      return {
        id: "cyber-gradient",
        name: "Glassmorphic Tech",
        tag: "Tech",
        bg: "#1A1C19",
        bgGradient: `<linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A1C19"/>
          <stop offset="50%" stopColor="#2D5A27"/>
          <stop offset="100%" stopColor="#84B643"/>
        </linearGradient>`,
        bgGradientId: "cyberGrad",
        accentStrip: secondary,
        nameColor1: "#ffffff",
        nameColor2: "#cbd5e1",
        accentLine: secondary,
        bodyText: "#f9fafb",
        subText: "#cbd5e1",
        divider: "#2d3748",
        iconBg: primary,
        previewGradient: `linear-gradient(135deg, #1A1C19 0%, #2D5A27 50%, #84B643 100%)`,
        textStyle: "light",
      };

    case "neo-brutalist": // Bold
      return {
        id: "neo-brutalist",
        name: "Multicolor Glass",
        tag: "Bold",
        bg: "#84B643",
        bgGradient: `<linearGradient id="boldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84B643"/>
          <stop offset="50%" stopColor="#F9F8F4"/>
          <stop offset="100%" stopColor="#2D5A27"/>
        </linearGradient>`,
        bgGradientId: "boldGrad",
        accentStrip: primary,
        nameColor1: "#1A1C19",
        nameColor2: primary,
        accentLine: primary,
        bodyText: "#1A1C19",
        subText: "#4b5563",
        divider: primary,
        iconBg: primary,
        previewGradient: `linear-gradient(135deg, #84B643 0%, #F9F8F4 50%, #2D5A27 100%)`,
        textStyle: "dark",
      };

    case "eco-green": // Natural
      return {
        id: "eco-green",
        name: "Eco Forest",
        tag: "Natural",
        bg: "#F4F2EC",
        bgGradient: `<linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4F2EC"/>
          <stop offset="100%" stopColor="#e8e4d8"/>
        </linearGradient>`,
        bgGradientId: "ecoGrad",
        accentStrip: primary,
        nameColor1: primary,
        nameColor2: secondary,
        accentLine: secondary,
        bodyText: "#1f2937",        // Dark grey body text for guaranteed legibility
        subText: "#4b5563",         // Medium grey subtext
        divider: "#d1d5db",         // Balanced divider
        iconBg: primary,
        previewGradient: `linear-gradient(135deg, #F4F2EC 0%, #e8e4d8 100%)`,
        textStyle: "dark",
      };

    case "classic-white": // Clean (default)
    default:
      return {
        id: "classic-white",
        name: "Classic White",
        tag: "Clean",
        bg: "#ffffff",
        accentStrip: primary,
        nameColor1: "#000000",
        nameColor2: primary,
        accentLine: primary,
        bodyText: "#111827",
        subText: "#6b7280",
        divider: "#e5e7eb",
        iconBg: primary,
        previewGradient: `linear-gradient(135deg, #ffffff 60%, #e5e7eb 100%)`,
        textStyle: "dark",
      };
  }
}

// Static definition list for names only (fallback)
export const CARD_THEMES: { id: string; name: string; tag: string }[] = [
  { id: "classic-white", name: "Classic White", tag: "Clean" },
  { id: "luxury-gold", name: "Premium Metal", tag: "Premium" },
  { id: "cyber-gradient", name: "Glassmorphic Tech", tag: "Tech" },
  { id: "neo-brutalist", name: "Multicolor Glass", tag: "Bold" },
  { id: "eco-green", name: "Eco Forest", tag: "Natural" },
];

/** ─────────────────────────────────────────────────────────────────────────────
 * FONT PAIRINGS
 * ─────────────────────────────────────────────────────────────────────────────*/
export interface FontPairing {
  id: string;
  label: string;
  headingFont: string;   // for name (fc-name class)
  bodyFont: string;      // for rest (fc-body class)
  googleUrl: string;
  preview: string;       // sample text for preview tile
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "outfit-jakarta",
    label: "Outfit · Jakarta",
    headingFont: "Outfit",
    bodyFont: "Plus Jakarta Sans",
    googleUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    preview: "Modern Clean",
  },
  {
    id: "playfair-inter",
    label: "Playfair · Inter",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600&display=swap",
    preview: "Elegant Serif",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    headingFont: "Space Grotesk",
    bodyFont: "Space Grotesk",
    googleUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    preview: "Tech Bold",
  },
  {
    id: "cinzel-crimson",
    label: "Cinzel · Crimson",
    headingFont: "Cinzel",
    bodyFont: "Crimson Text",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Crimson+Text:wght@400;600&display=swap",
    preview: "Classic Royal",
  },
  {
    id: "poppins",
    label: "Poppins",
    headingFont: "Poppins",
    bodyFont: "Poppins",
    googleUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
    preview: "Poppins",
  },
  {
    id: "syne-dm",
    label: "Syne · DM Sans",
    headingFont: "Syne",
    bodyFont: "DM Sans",
    googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap",
    preview: "Creative Edge",
  },
  {
    id: "brother-1816",
    label: "Brother 1816",
    headingFont: "Brother 1816', 'Inter",
    bodyFont: "Brother 1816', 'Inter",
    googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    preview: "Brother 1816",
  },
];

/** ─────────────────────────────────────────────────────────────────────────────
 * ThemeSelector component
 * ─────────────────────────────────────────────────────────────────────────────*/
interface ThemeSelectorProps {
  selectedThemeId: string;
  selectedFontId: string;
  onThemeChange: (themeId: string) => void;
  onFontChange: (fontId: string) => void;
  brandColors?: { primary: string; secondary: string };
}

export default function ThemeSelector({
  selectedThemeId,
  selectedFontId,
  onThemeChange,
  onFontChange,
  brandColors,
}: ThemeSelectorProps) {
  return (
    <div className="space-y-5">

      {/* ── Theme Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Card Theme</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {CARD_THEMES.find(t => t.id === selectedThemeId)?.name ?? "Classic White"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CARD_THEMES.map((themeDef) => {
            const selected = themeDef.id === selectedThemeId;
            // Resolve custom visual properties dynamically using the active brand colors
            const themeObj = resolveCardTheme(themeDef.id, brandColors);

            return (
              <button
                key={themeDef.id}
                onClick={() => onThemeChange(themeDef.id)}
                title={themeDef.name}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all duration-200 overflow-hidden
                  ${selected
                    ? "border-teal-500 shadow-lg shadow-teal-100 scale-[1.05]"
                    : "border-gray-200 hover:border-gray-300 hover:scale-[1.02]"
                  }`}
              >
                {/* Theme colour preview background */}
                <div
                  className="w-full h-10 rounded-t-[10px]"
                  style={{ background: themeObj.previewGradient }}
                />
                {/* Accent strip preview */}
                <div className="w-full h-[3px]" style={{ background: themeObj.accentStrip }} />
                {/* Selected check marker */}
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center shadow">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="text-[9px] font-bold text-gray-600 pb-1.5 leading-tight px-1 text-center">
                  {themeDef.tag}
                </span>
              </button>
            );
          })}
        </div>
        {/* Full name below grid */}
        <p className="text-[10px] text-gray-400 mt-1.5 pl-0.5">
          Selected: <span className="font-semibold text-gray-600">{CARD_THEMES.find(t => t.id === selectedThemeId)?.name}</span>
        </p>
      </div>

      {/* ── Font Selector ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Typography</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Font Pairing</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_PAIRINGS.map((fp) => {
            const selected = fp.id === selectedFontId;
            return (
              <button
                key={fp.id}
                onClick={() => onFontChange(fp.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150
                  ${selected
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <div>
                  <p className="text-[11px] font-bold text-gray-800 leading-tight">{fp.preview}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{fp.label}</p>
                </div>
                {selected && (
                  <Check size={13} className="text-teal-500 shrink-0 ml-1" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
