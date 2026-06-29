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

export const CARD_THEMES: CardTheme[] = [
  {
    id: "classic-white",
    name: "Classic White",
    tag: "Clean",
    bg: "#ffffff",
    accentStrip: "#047857",
    nameColor1: "#000000",
    nameColor2: "#047857",
    accentLine: "#047857",
    bodyText: "#111827",
    subText: "#6b7280",
    divider: "#e5e7eb",
    iconBg: "#047857",
    previewGradient: "linear-gradient(135deg, #ffffff 60%, #d1fae5 100%)",
    textStyle: "dark",
  },
  {
    id: "luxury-gold",
    name: "Luxury Black",
    tag: "Premium",
    bg: "#0a0a0a",
    bgGradient: `<linearGradient id="luxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0a0a0a"/>
      <stop offset="50%" stopColor="#1a1a2e"/>
      <stop offset="100%" stopColor="#0a0a0a"/>
    </linearGradient>`,
    bgGradientId: "luxGrad",
    accentStrip: "#D4AF37",
    nameColor1: "#ffffff",
    nameColor2: "#D4AF37",
    accentLine: "#D4AF37",
    bodyText: "#e5e7eb",
    subText: "#9ca3af",
    divider: "#374151",
    iconBg: "#D4AF37",
    previewGradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
    textStyle: "light",
  },
  {
    id: "cyber-gradient",
    name: "Cyber Dark",
    tag: "Tech",
    bg: "#0f172a",
    bgGradient: `<linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0f172a"/>
      <stop offset="55%" stopColor="#1e1b4b"/>
      <stop offset="100%" stopColor="#0f172a"/>
    </linearGradient>`,
    bgGradientId: "cyberGrad",
    accentStrip: "#06b6d4",
    nameColor1: "#f8fafc",
    nameColor2: "#06b6d4",
    accentLine: "#06b6d4",
    bodyText: "#e2e8f0",
    subText: "#94a3b8",
    divider: "#1e293b",
    iconBg: "#0284c7",
    previewGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #164e63 100%)",
    textStyle: "light",
  },
  {
    id: "neo-brutalist",
    name: "Neo Brutalist",
    tag: "Bold",
    bg: "#FFDE4D",
    accentStrip: "#000000",
    nameColor1: "#000000",
    nameColor2: "#cc0000",
    accentLine: "#000000",
    bodyText: "#111111",
    subText: "#444444",
    divider: "#000000",
    iconBg: "#000000",
    previewGradient: "linear-gradient(135deg, #FFDE4D 0%, #FFB800 100%)",
    textStyle: "dark",
  },
  {
    id: "eco-green",
    name: "Eco Forest",
    tag: "Natural",
    bg: "#F4F2EC",
    bgGradient: `<linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F4F2EC"/>
      <stop offset="100%" stopColor="#e8e4d8"/>
    </linearGradient>`,
    bgGradientId: "ecoGrad",
    accentStrip: "#1B3B2B",
    nameColor1: "#1B3B2B",
    nameColor2: "#2d6a4f",
    accentLine: "#2d6a4f",
    bodyText: "#1B3B2B",
    subText: "#4a7c59",
    divider: "#c8c4b2",
    iconBg: "#1B3B2B",
    previewGradient: "linear-gradient(135deg, #F4F2EC 0%, #d8f3dc 100%)",
    textStyle: "dark",
  },
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
    preview: "Friendly Round",
  },
  {
    id: "syne-dm",
    label: "Syne · DM Sans",
    headingFont: "Syne",
    bodyFont: "DM Sans",
    googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap",
    preview: "Creative Edge",
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
}

export default function ThemeSelector({
  selectedThemeId,
  selectedFontId,
  onThemeChange,
  onFontChange,
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
          {CARD_THEMES.map((theme) => {
            const selected = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                title={theme.name}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all duration-200 overflow-hidden
                  ${selected
                    ? "border-teal-500 shadow-lg shadow-teal-100 scale-[1.05]"
                    : "border-gray-200 hover:border-gray-300 hover:scale-[1.02]"
                  }`}
              >
                {/* Theme colour preview */}
                <div
                  className="w-full h-10 rounded-t-[10px]"
                  style={{ background: theme.previewGradient }}
                />
                {/* Accent strip preview */}
                <div className="w-full h-[3px]" style={{ background: theme.accentStrip }} />
                {/* Selected check */}
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center shadow">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="text-[9px] font-bold text-gray-600 pb-1.5 leading-tight px-1 text-center">
                  {theme.tag}
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
