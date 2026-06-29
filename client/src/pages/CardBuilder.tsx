import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CardPreview from "@/components/CardPreview";
import AISettings from "@/components/AISettings";
import BrandAssets from "@/components/BrandAssets";
import ThemeSelector from "@/components/ThemeSelector";
import { useLocation } from "wouter";
import { Sparkles, Upload, Save, Copy, MessageCircle, FileSpreadsheet, Sparkle, Download, ClipboardCheck, Loader2, Key, Eye, PenLine, Wand2, Type, Bold, Italic, RefreshCw, FileDown, FileImage, FileType, Contact } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { resizeImageBase64 } from "@/lib/image-utils";
import { convertSvgToPngDataUrl } from "@/lib/export-utils";

/** TextBox element for freeform card text overlays */
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

interface CardData {
  headshot: string | null;
  name: string;
  designation: string;
  phone: string;
  email: string;
  address: string;
  officeName: string;
  officeDetails: string;
  bio: string;
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
  themeId?: string;        // Phase 2: active card theme
  fontPairingId?: string;  // Phase 2: active font pairing
  customBg?: string;
  customTextColor?: string;
}

const EXPECTED_HEADERS = {
  name: ["name", "fullname", "full name", "employee name", "candidate name"],
  designation: ["designation", "role", "title", "jobtitle", "job title", "current designation"],
  phone: ["phone", "mobile", "contact", "phone number", "mobile number", "mobile no.", "mobile no"],
  email: ["email", "emailaddress", "email address", "email id", "emailid"],
  address: ["address", "office address", "location", "address"],
  officeName: ["officename", "office name", "company", "company name", "current company"],
  officeDetails: ["officedetails", "office details", "tagline", "company details", "position title"],
  website: ["website", "site", "webpage", "weburl", "web url", "url"],
  linkedin: ["linkedin", "linkedin url", "linkedin handle", "linkedin profile url"],
  twitter: ["twitter", "x", "twitter handle", "x handle"],
  instagram: ["instagram", "insta", "instagram handle"],
  facebook: ["facebook", "fb", "facebook handle"],
  youtube: ["youtube", "yt", "youtube handle"],
  github: ["github", "github handle"],
  tiktok: ["tiktok", "tiktok handle"],
  whatsapp: ["whatsapp", "whatsapp number"],
  telephone: ["telephone", "landline", "office phone", "telephone number", "phone no", "phone no."]
};

export default function CardBuilder() {
  const [, navigate] = useLocation();
  const [layoutType, setLayoutType] = useState<"horizontal-no-photo" | "horizontal-with-photo" | "vertical-no-photo" | "vertical-with-photo">("horizontal-no-photo");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isWritingBio, setIsWritingBio] = useState(false);
  const [bioPreview, setBioPreview] = useState<string | null>(null);

  // Excel AI cleaner states
  const [isCleaningExcel, setIsCleaningExcel] = useState(false);
  const [excelDiff, setExcelDiff] = useState<{original: any[], cleaned: any[]} | null>(null);
  const [showExcelDiff, setShowExcelDiff] = useState(false);

  // Text box tool states
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [showTextBoxPanel, setShowTextBoxPanel] = useState(false);
  
  // Custom offsets from the drag editor
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number; scale?: number; fontSize?: number }>>({})
  
  // State for the public share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [savedCardId, setSavedCardId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Candidate DB states from Excel upload
  const [dashboardRows, setDashboardRows] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [checkedCandidateIndexes, setCheckedCandidateIndexes] = useState<number[]>([]);
  
  // Focused field name for column cell mapping
  const [lastFocusedField, setLastFocusedField] = useState<string | null>("officeDetails");
  const [isCleaning, setIsCleaning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Client-side OpenRouter API Key (BYOK)
  const [openRouterKey, setOpenRouterKey] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("glasscard_openrouter_key") || "";
    setOpenRouterKey(savedKey);
  }, []);

  const handleSaveAPIKey = (key: string) => {
    setOpenRouterKey(key);
    localStorage.setItem("glasscard_openrouter_key", key);
    toast.success("OpenRouter API key saved locally!");
  };

  const bioMutation = trpc.aiGeneration.generateBios.useMutation();
  const taglineMutation = trpc.aiGeneration.generateTaglines.useMutation();
  const cleanMutation = trpc.aiGeneration.cleanCardData.useMutation();
  const saveMutation = trpc.card.create.useMutation();

  // ── Direct browser→OpenRouter AI call (bypasses server, no serverless issues) ───────────
  const callOpenRouterDirect = async (prompt: string): Promise<string> => {
    if (!openRouterKey) throw new Error("No API key");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "GlassCard AI"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  };

  const [cardData, setCardData] = useState<CardData>({
    headshot: null,
    name: "",
    designation: "",
    phone: "",
    email: "",
    address: "",
    officeName: "",
    officeDetails: "",
    bio: "",
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
    themeId: "classic-white",
    fontPairingId: "outfit-jakarta",
    customBg: "",
    customTextColor: "",
    telephone: "",
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

  // AI-powered data formatting/cleaning (direct browser→OpenRouter)
  const handleAICleanData = async () => {
    if (!cardData.name) { toast.error("Please enter candidate name first"); return; }
    if (!openRouterKey) { toast.error("Enter your OpenRouter API key at the top to enable AI features."); return; }
    setIsCleaning(true);
    try {
      const prompt = `You are a professional business card formatter. Clean and properly capitalize the following data. Return ONLY valid JSON, no explanation.

Input:
- Name: ${cardData.name}
- Designation: ${cardData.designation}
- Phone: ${cardData.phone}
- Email: ${cardData.email}
- Office Address: ${cardData.address}
- Office/Company Name: ${cardData.officeName}

Return JSON like: {"name":"...","designation":"...","phone":"...","email":"...","address":"...","officeName":"..."}`;

      const raw = await callOpenRouterDirect(prompt);
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const cleaned = JSON.parse(jsonMatch[0]);
      setCardData((prev) => ({
        ...prev,
        name: cleaned.name || prev.name,
        designation: cleaned.designation || prev.designation,
        phone: cleaned.phone || prev.phone,
        email: cleaned.email || prev.email,
        address: cleaned.address || prev.address,
        officeName: cleaned.officeName || prev.officeName,
      }));
      toast.success("AI formatted your card data successfully!");
    } catch (err: any) {
      console.error("AI Format error:", err);
      toast.error(`AI Format failed: ${err?.message?.slice(0, 80) || "Unknown error"}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!cardData.name || !cardData.designation) { toast.error("Please enter name and designation first"); return; }
    if (!openRouterKey) { toast.error("Enter your OpenRouter API key at the top to enable AI features."); return; }
    try {
      const taglinePrompt = `Generate 3 creative company taglines for a visiting card for role: ${cardData.designation} at ${cardData.officeName || "a company"}. Return ONLY a JSON array of 3 strings.`;
      const taglinesRaw = await callOpenRouterDirect(taglinePrompt);
      const parseSuggestions = (raw: string): string[] => {
        try {
          const match = raw.match(/\[[\s\S]*?\]/);
          return match ? JSON.parse(match[0]) : [];
        } catch { return []; }
      };
      setTaglineSuggestions(parseSuggestions(taglinesRaw));
      setShowSuggestions(true);
      toast.success("AI suggestions generated!");
    } catch (error: any) {
      console.error("AI Ideas error:", error);
      toast.error(`AI Suggestions failed: ${error?.message?.slice(0, 80) || "Unknown error"}`);
    }
  };

  // ── AI Bio Writer: generates a punchy 30-word professional bio ──────────────
  const handleWriteBio = async () => {
    if (!cardData.name) { toast.error("Enter your name first"); return; }
    if (!openRouterKey) { toast.error("Enter your OpenRouter API key to use AI Bio Writer"); return; }
    setIsWritingBio(true);
    setBioPreview(null);
    try {
      const prompt = `Write a punchy, confident 30-word first-person professional bio for a visiting card.
Person: ${cardData.name}, Role: ${cardData.designation || "Professional"}, Company: ${cardData.officeName || "their company"}.
Requirements: exactly 25-30 words, no hashtags, no emojis, no quotes. Output ONLY the bio text.`;
      const raw = await callOpenRouterDirect(prompt);
      const bio = raw.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      setBioPreview(bio);
    } catch (err: any) {
      toast.error(`Bio writer failed: ${err?.message?.slice(0, 80) || "Unknown error"}`);
    } finally {
      setIsWritingBio(false);
    }
  };

  const handleUseBio = () => {
    if (bioPreview) {
      setCardData(prev => ({ ...prev, bio: bioPreview }));
      setBioPreview(null);
      toast.success("Bio applied to card!");
    }
  };

  // ── Excel AI Data Cleaner: batch-fixes all loaded rows in one shot ──────────
  const handleCleanExcelData = async () => {
    if (dashboardRows.length === 0) { toast.error("Upload a spreadsheet first"); return; }
    if (!openRouterKey) { toast.error("Enter your OpenRouter API key to use AI cleaner"); return; }
    setIsCleaningExcel(true);
    try {
      const sample = dashboardRows.slice(0, 10);
      const prompt = `You are a data cleaning expert. Fix these contact records:
- Name: Title Case (e.g. "john doe" → "John Doe")
- Phone: normalize to digits only with country code if present (e.g. "9876543210" stays, "091234 56789" → "9123456789")
- Email: lowercase always
- Company/Office: Title Case
- Designation: Title Case
- Do NOT change addresses or social URLs

Input JSON array:
${JSON.stringify(sample, null, 2)}

Return ONLY a valid JSON array with the same keys, cleaned values. No explanation.`;
      const raw = await callOpenRouterDirect(prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("AI returned no valid JSON array");
      const cleaned = JSON.parse(match[0]);
      setExcelDiff({ original: sample, cleaned });
      setShowExcelDiff(true);
      toast.success("AI cleaned data ready — review the diff below!");
    } catch (err: any) {
      toast.error(`AI Excel cleaner failed: ${err?.message?.slice(0, 100) || "Unknown error"}`);
    } finally {
      setIsCleaningExcel(false);
    }
  };

  const handleApplyCleanedData = () => {
    if (!excelDiff) return;
    const remaining = dashboardRows.slice(excelDiff.cleaned.length);
    setDashboardRows([...excelDiff.cleaned, ...remaining]);
    setExcelDiff(null);
    setShowExcelDiff(false);
    toast.success(`Applied AI-cleaned data to ${excelDiff.cleaned.length} records!`);
  };

  // ── Text Box tool helpers ───────────────────────────────────────────────────
  const handleAddTextBox = () => {
    const id = `tb-${Date.now()}`;
    const newBox: TextBox = {
      id,
      text: "Add your text here",
      x: 50, y: 50,
      fontSize: 14,
      color: cardData.brandColors?.primary || "#047857",
      bold: false,
      italic: false,
      width: 300,  // default 300 SVG units — wraps at ~35 chars @ 14px
    };
    setTextBoxes(prev => [...prev, newBox]);
    setSelectedTextBoxId(id);
    setShowTextBoxPanel(true);
    toast.success("Text box added — click \"Edit Layout\" then drag it on the card");
  };

  const handleUpdateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes(prev => prev.map(tb => tb.id === id ? { ...tb, ...updates } : tb));
  };

  const handleDeleteTextBox = (id: string) => {
    setTextBoxes(prev => prev.filter(tb => tb.id !== id));
    if (selectedTextBoxId === id) setSelectedTextBoxId(null);
  };

  // Map a row to the card inputs
  const selectCandidateRow = (row: any, index: number) => {
    setSelectedRowIndex(index);
    const headers = Object.keys(row);

    const getColVal = (expectedList: string[]): string => {
      const match = headers.find(h => expectedList.includes(h.toLowerCase()));
      if (match) {
        const val = String(row[match] || "").trim();
        return val === "missing value" || val === "" ? "Data Missing" : val;
      }
      return "Data Missing";
    };

    setCardData((prev) => ({
      ...prev,
      name: getColVal(EXPECTED_HEADERS.name),
      designation: getColVal(EXPECTED_HEADERS.designation),
      phone: getColVal(EXPECTED_HEADERS.phone),
      email: getColVal(EXPECTED_HEADERS.email),
      address: getColVal(EXPECTED_HEADERS.address),
      officeName: getColVal(EXPECTED_HEADERS.officeName),
      officeDetails: getColVal(EXPECTED_HEADERS.officeDetails),
      social: {
        linkedin: getColVal(EXPECTED_HEADERS.linkedin),
        twitter: getColVal(EXPECTED_HEADERS.twitter),
        instagram: getColVal(EXPECTED_HEADERS.instagram),
        facebook: getColVal(EXPECTED_HEADERS.facebook),
        youtube: getColVal(EXPECTED_HEADERS.youtube),
        github: getColVal(EXPECTED_HEADERS.github),
        tiktok: getColVal(EXPECTED_HEADERS.tiktok),
        whatsapp: getColVal(EXPECTED_HEADERS.whatsapp),
        website: getColVal(EXPECTED_HEADERS.website),
      }
    }));
    toast.success(`Loaded candidate: ${row["Candidate Name"] || row["Name"] || "Record " + (index + 1)}`);
  };

  // Excel / CSV Dashboard file uploader
  const handleDashboardExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

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
          
          const rows: any[] = [];
          for (let i = 1; i < Math.min(lines.length, 51); i++) {
            const values = lines[i].split(",").map(v => v.replace(/^["']|["']$/g, "").trim());
            const rowObject: any = {};
            headers.forEach((h, idx) => {
              rowObject[h] = values[idx] || "";
            });
            rows.push(rowObject);
          }

          setAvailableColumns(headers);
          setDashboardRows(rows);
          setCheckedCandidateIndexes(rows.map((_, i) => i).slice(0, 10)); // Default check first 10
          setSelectedRowIndex(null);
          toast.success(`Loaded ${rows.length} candidate rows on dashboard!`);
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse CSV file");
        }
      };
      reader.readAsText(file);
    } else {
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

          const limitedRows = rows.slice(0, 50); // limit to 50
          const headers = Object.keys(limitedRows[0]);

          setAvailableColumns(headers);
          setDashboardRows(limitedRows);
          setCheckedCandidateIndexes(limitedRows.map((_, i) => i).slice(0, 10)); // Default check first 10
          setSelectedRowIndex(null);
          toast.success(`Loaded ${limitedRows.length} candidate rows from Excel!`);
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleMapColumnValue = (columnName: string) => {
    if (selectedRowIndex === null) {
      toast.error("Please select a candidate row first");
      return;
    }
    if (!lastFocusedField) {
      toast.error("Please click inside an input box on the left first to target it");
      return;
    }

    const row = dashboardRows[selectedRowIndex];
    const val = String(row[columnName] || "").trim();
    if (val && val !== "missing value") {
      if (lastFocusedField.includes(".")) {
        const [parent, child] = lastFocusedField.split(".");
        setCardData((prev) => {
          const pVal = prev[parent as keyof CardData] as Record<string, string>;
          const original = pVal[child] || "";
          const separator = original ? " | " : "";
          return {
            ...prev,
            [parent]: {
              ...pVal,
              [child]: original + separator + val,
            }
          };
        });
      } else {
        setCardData((prev) => {
          const original = String(prev[lastFocusedField as keyof CardData] || "");
          const separator = original ? " | " : "";
          return {
            ...prev,
            [lastFocusedField]: original + separator + val,
          };
        });
      }
      toast.success(`Appended ${columnName} data to field`);
    } else {
      toast.warning(`Column ${columnName} is empty for this candidate`);
    }
  };

  const handleToggleCandidate = (idx: number) => {
    setCheckedCandidateIndexes((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      } else {
        if (prev.length >= 10) {
          toast.error("Maximum 10 cards can be selected for batch generation");
          return prev;
        }
        return [...prev, idx];
      }
    });
  };

  // Parse candidate row object into a formatted CardData configuration
  const getRowCandidateData = (idx: number): CardData => {
    const row = dashboardRows[idx];
    const headers = Object.keys(row);
    
    const getColVal = (expectedList: string[]): string => {
      const match = headers.find(h => expectedList.includes(h.toLowerCase()));
      if (match) {
        const val = String(row[match] || "").trim();
        return val === "missing value" || val === "" ? "Data Missing" : val;
      }
      return "Data Missing";
    };

    return {
      name: getColVal(EXPECTED_HEADERS.name),
      designation: getColVal(EXPECTED_HEADERS.designation),
      phone: getColVal(EXPECTED_HEADERS.phone),
      email: getColVal(EXPECTED_HEADERS.email),
      address: getColVal(EXPECTED_HEADERS.address),
      officeName: getColVal(EXPECTED_HEADERS.officeName),
      officeDetails: getColVal(EXPECTED_HEADERS.officeDetails),
      social: {
        linkedin: getColVal(EXPECTED_HEADERS.linkedin),
        twitter: getColVal(EXPECTED_HEADERS.twitter),
        instagram: getColVal(EXPECTED_HEADERS.instagram),
        facebook: getColVal(EXPECTED_HEADERS.facebook),
        youtube: getColVal(EXPECTED_HEADERS.youtube),
        github: getColVal(EXPECTED_HEADERS.github),
        tiktok: getColVal(EXPECTED_HEADERS.tiktok),
        whatsapp: getColVal(EXPECTED_HEADERS.whatsapp),
        website: getColVal(EXPECTED_HEADERS.website),
      },
      brandColors: cardData.brandColors,
      brandLogo: cardData.brandLogo,
      headshot: null,
      telephone: getColVal(EXPECTED_HEADERS.telephone),
    };
  };

  // Download ZIP of reviewed cards using their exact SVGs rendering on the DOM
  const handleBatchDownloadZIP = async () => {
    if (checkedCandidateIndexes.length === 0) {
      toast.error("Please select at least 1 candidate for batch generation");
      return;
    }
    setIsZipping(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();

      for (let i = 0; i < checkedCandidateIndexes.length; i++) {
        const idx = checkedCandidateIndexes[i];
        setZipProgress(Math.round((i / checkedCandidateIndexes.length) * 100));

        // Retrieve the rendered preview SVG directly from the DOM!
        const cardContainer = document.getElementById(`batch-review-card-${idx}`);
        const svgEl = cardContainer?.querySelector("svg") as unknown as SVGSVGElement;

        if (!svgEl) {
          console.warn(`SVG preview element not found for index ${idx}`);
          continue;
        }

        const candidateName = getRowCandidateData(idx).name || `Candidate_${idx + 1}`;
        const filename = candidateName.replace(/\s+/g, "_");

        // 1. Export SVG
        const svgString = new XMLSerializer().serializeToString(svgEl);
        zip.file(`${filename}.svg`, svgString);

        // 2. Export PNG (scale = 3 for high DPI)
        const pngUrl = await convertSvgToPngDataUrl(svgEl, 3);
        const pngBase64 = pngUrl.split(",")[1];
        zip.file(`${filename}.png`, pngBase64, { base64: true });

        // 3. Export PDF with native overlay links!
        const viewBoxWidth = svgEl.viewBox?.baseVal?.width || 800;
        const viewBoxHeight = svgEl.viewBox?.baseVal?.height || 457;
        const pdf = new jsPDF({
          orientation: layoutType.startsWith("vertical") ? "portrait" : "landscape",
          unit: "px",
          format: [viewBoxWidth, viewBoxHeight],
        });
        pdf.addImage(pngUrl, "PNG", 0, 0, viewBoxWidth, viewBoxHeight);

        // Embed clickable links overlays inside the PDF matching the preview offsets!
        const cData = getRowCandidateData(idx);
        const contactsX = offsets.contacts?.x || 0;
        const contactsY = offsets.contacts?.y || 0;
        const socialsX = offsets.socials?.x || 0;
        const socialsY = offsets.socials?.y || 0;
        const qrX = offsets.qr?.x || 0;
        const qrY = offsets.qr?.y || 0;

        const getQRRedirect = () => {
          if (cData.social?.website && cData.social.website !== "Data Missing") {
            let ws = cData.social.website.trim();
            if (!/^https?:\/\//i.test(ws)) ws = `https://${ws}`;
            return ws;
          }
          return "https://www.sorigin.in";
        };

        if (layoutType.startsWith("vertical")) {
          pdf.link(40 + contactsX, 400 + contactsY, 200, 50, { url: `tel:${cData.phone}` });
          pdf.link(300 + contactsX, 400 + contactsY, 200, 50, { url: `https://wa.me/${(cData.phone || "").replace(/[^0-9]/g, "")}` });
          pdf.link(40 + contactsX, 480 + contactsY, 200, 50, { url: `mailto:${cData.email}` });
          pdf.link(300 + contactsX, 480 + contactsY, 200, 50, { url: getQRRedirect() });
          pdf.link(380 + qrX, 590 + qrY, 180, 180, { url: getQRRedirect() });
          
          pdf.link(45 + socialsX, 835 + socialsY, 50, 45, { url: cData.social.linkedin || "#" });
          pdf.link(155 + socialsX, 835 + socialsY, 50, 45, { url: cData.social.instagram || "#" });
          pdf.link(265 + socialsX, 835 + socialsY, 50, 45, { url: cData.social.youtube || "#" });
          pdf.link(375 + socialsX, 835 + socialsY, 50, 45, { url: cData.social.twitter || "#" });
          pdf.link(485 + socialsX, 835 + socialsY, 50, 45, { url: cData.social.facebook || "#" });
        } else {
          pdf.link(50 + contactsX, 260 + contactsY, 200, 45, { url: `tel:${cData.phone}` });
          pdf.link(310 + contactsX, 260 + contactsY, 200, 45, { url: `https://wa.me/${(cData.phone || "").replace(/[^0-9]/g, "")}` });
          pdf.link(50 + contactsX, 325 + contactsY, 200, 45, { url: `mailto:${cData.email}` });
          pdf.link(310 + contactsX, 325 + contactsY, 200, 45, { url: getQRRedirect() });
          pdf.link(635 + qrX, 205 + qrY, 115, 115, { url: getQRRedirect() });
          
          const addX = offsets.address?.x || 0;
          const addY = offsets.address?.y || 0;
          pdf.link(470 + addX, 400 + addY, 20, 20, { url: cData.social.linkedin || "#" });
          pdf.link(525 + addX, 400 + addY, 20, 20, { url: cData.social.instagram || "#" });
          pdf.link(580 + addX, 400 + addY, 20, 20, { url: cData.social.youtube || "#" });
          pdf.link(635 + addX, 400 + addY, 20, 20, { url: cData.social.twitter || "#" });
          pdf.link(690 + addX, 400 + addY, 20, 20, { url: cData.social.facebook || "#" });
        }

        zip.file(`${filename}.pdf`, pdf.output("arraybuffer"));
      }

      setZipProgress(100);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `glasscards_reviewed_batch.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Successfully batch generated ZIP with ${checkedCandidateIndexes.length} cards!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate ZIP bundle of batch cards");
    } finally {
      setIsZipping(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardData.name) {
      toast.error("Please enter a card name first");
      return;
    }
    setIsSaving(true);
    try {
      // ── CRITICAL FIX: Never send base64 images to tRPC (Vercel 4.5MB limit) ──
      // Images stay in localStorage only. Server receives only text metadata.
      const socialLinksData = JSON.stringify({
        social: cardData.social,
        brandColors: cardData.brandColors,
        offsets,
        bio: cardData.bio,
        themeId: cardData.themeId,
        fontPairingId: cardData.fontPairingId,
        customBg: cardData.customBg,
        customTextColor: cardData.customTextColor,
        telephone: cardData.telephone,
        // NOTE: No images here — stored in localStorage below
      });

      const result = await saveMutation.mutateAsync({
        name: cardData.name,
        designation: cardData.designation,
        phone: cardData.phone,
        email: cardData.email,
        address: cardData.address,
        officeName: cardData.officeName,
        officeDetails: cardData.officeDetails,
        socialLinks: socialLinksData,
        aspectRatio: layoutType.startsWith("vertical") ? "3:4" : "16:9"
      });

      if (result.success && result.id) {
        // Store images in localStorage keyed by card ID
        try {
          if (cardData.headshot) {
            localStorage.setItem(`glasscard_headshot_${result.id}`, cardData.headshot);
          }
          if (cardData.brandLogo) {
            localStorage.setItem(`glasscard_logo_${result.id}`, cardData.brandLogo);
          }
        } catch {
          // localStorage may be full — images won't persist but card saves fine
        }
        setSavedCardId(result.id);
        setShareModalOpen(true);
        toast.success("Card saved successfully!");
      } else {
        toast.error("Failed to save card");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save card — check your internet connection");
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

  // ── vCard (.vcf) download ──────────────────────────────────────────────────
  const handleDownloadVCard = () => {
    if (!cardData.name) { toast.error("Please enter a name before downloading the contact"); return; }
    const nameParts = cardData.name.trim().split(" ");
    const lastName = nameParts.pop() || "";
    const firstName = nameParts.join(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${cardData.name}`,
      cardData.officeName ? `ORG:${cardData.officeName}` : "",
      cardData.designation ? `TITLE:${cardData.designation}` : "",
      cardData.phone ? `TEL;TYPE=CELL,VOICE:${cardData.phone}` : "",
      cardData.email ? `EMAIL;TYPE=PREF,INTERNET:${cardData.email}` : "",
      cardData.social?.website ? `URL:${cardData.social.website}` : "",
      cardData.address ? `ADR;TYPE=WORK:;;${cardData.address};;;;` : "",
      cardData.social?.linkedin ? `X-SOCIALPROFILE;type=linkedin:${cardData.social.linkedin}` : "",
      cardData.social?.twitter ? `X-SOCIALPROFILE;type=twitter:${cardData.social.twitter}` : "",
      cardData.social?.whatsapp ? `X-SOCIALPROFILE;type=whatsapp:${cardData.social.whatsapp}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${cardData.name.replace(/\s+/g, "_")}_contact.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Contact card (.vcf) downloaded — open it to save to phone/email!");
  };

  // ── Single card export (PNG / PDF / SVG) ──────────────────────────────────
  const [isExporting, setIsExporting] = useState<"png" | "pdf" | "svg" | null>(null);

  const handleExportSingleCard = async (format: "png" | "pdf" | "svg") => {
    const svgEl = document.querySelector("#digital-card-svg") as SVGSVGElement | null;
    if (!svgEl) { toast.error("Card preview not found — please wait for the card to load"); return; }
    setIsExporting(format);
    const safeName = (cardData.name || "visiting_card").replace(/\s+/g, "_");
    try {
      if (format === "svg") {
        const serializer = new XMLSerializer();
        let svgStr = serializer.serializeToString(svgEl);
        if (!svgStr.startsWith("<?xml")) svgStr = '<?xml version="1.0" standalone="no"?>\r\n' + svgStr;
        const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = `${safeName}.svg`;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        toast.success("SVG exported! Scalable vector — perfect for print.");
      } else if (format === "png") {
        const pngUrl = await convertSvgToPngDataUrl(svgEl, 3);
        const link = document.createElement("a");
        link.href = pngUrl; link.download = `${safeName}_3x.png`;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link);
        toast.success("High-res PNG exported (3× resolution)!");
      } else if (format === "pdf") {
        const pngUrl = await convertSvgToPngDataUrl(svgEl, 2);
        const vb = svgEl.viewBox?.baseVal;
        const w = vb?.width || 800;
        const h = vb?.height || 457;
        const pdf = new jsPDF({
          orientation: layoutType.startsWith("vertical") ? "portrait" : "landscape",
          unit: "px",
          format: [w, h],
        });
        pdf.addImage(pngUrl, "PNG", 0, 0, w, h);
        pdf.save(`${safeName}.pdf`);
        toast.success("PDF exported — print-ready quality!");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Export failed: ${String(err)}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GlassCard AI</h1>
            <p className="text-gray-600">Create beautiful, fully clickable digital visiting cards with AI-assisted layout scaling</p>
          </div>
          
          {/* Universal OpenRouter API Key Input widget */}
          <div className="flex items-center gap-2 bg-white/90 border border-teal-200 p-2 rounded-xl shadow-sm">
            <Key size={16} className="text-teal-600 shrink-0" />
            <Input
              type="password"
              placeholder="Enter OpenRouter API Key..."
              value={openRouterKey}
              onChange={(e) => handleSaveAPIKey(e.target.value)}
              className="h-8 text-xs border-0 bg-transparent w-48 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {openRouterKey ? (
              <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">Active</span>
            ) : (
              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">No Key</span>
            )}
          </div>
        </div>

        {/* Dashboard Excel/CSV file uploader section (up to 50 rows) */}
        <Card className="p-4 border-dashed border-2 border-teal-300 bg-white/70 backdrop-blur-sm shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-teal-600 shrink-0" size={32} />
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Interactive Candidate Spreadsheet Dashboard</h3>
              <p className="text-xs text-gray-500">Upload up to 50 candidate records. Select rows to edit, or checkbox up to 10 for batch ZIP generation.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
              <Upload size={14} />
              Upload spreadsheet
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleDashboardExcelUpload}
                className="hidden"
              />
            </label>
            {dashboardRows.length > 0 && (
              <Button
                onClick={handleCleanExcelData}
                disabled={isCleaningExcel}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 h-9 px-3"
                title="AI fixes name casing, phone format, email and capitalization across all rows"
              >
                {isCleaningExcel ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {isCleaningExcel ? "AI Cleaning…" : "🧹 AI Clean All Records"}
              </Button>
            )}
          </div>
        </Card>

        {/* Column pill mapper section */}
        {dashboardRows.length > 0 && selectedRowIndex !== null && (
          <Card className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <Sparkle size={14} />
                Map Extra spreadsheet columns to card inputs
              </span>
              <span className="text-[10px] text-gray-500">
                Active target input: <strong className="text-amber-800 underline font-mono">{lastFocusedField}</strong> (click any input box below to select target)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableColumns.map((col) => (
                <button
                  key={col}
                  onClick={() => handleMapColumnValue(col)}
                  className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                >
                  + {col}
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Editor Panel */}
          <div className="lg:col-span-1">
            <Card className="glass-card p-4 space-y-4 shadow-md bg-white/80 border border-white/20">
              
              {/* Form Tabs */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="basic" className="text-xs py-1.5">Basic</TabsTrigger>
                  <TabsTrigger value="social" className="text-xs py-1.5">Social</TabsTrigger>
                  <TabsTrigger value="brand" className="text-xs py-1.5">Brand</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-3 mt-3">
                  {/* Headshot photo */}
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
                        className="w-full h-24 object-cover rounded-lg border mt-1"
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={cardData.name}
                      onFocus={() => setLastFocusedField("name")}
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
                      onFocus={() => setLastFocusedField("designation")}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Mobile</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={cardData.phone}
                      onFocus={() => setLastFocusedField("phone")}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>

                  {/* Telephone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Telephone / Phone</label>
                    <Input
                      placeholder="+1 (555) 987-6543"
                      value={cardData.telephone || ""}
                      onFocus={() => setLastFocusedField("telephone")}
                      onChange={(e) => handleInputChange("telephone", e.target.value)}
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
                      onFocus={() => setLastFocusedField("email")}
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
                      onFocus={() => setLastFocusedField("address")}
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
                      onFocus={() => setLastFocusedField("officeName")}
                      onChange={(e) => handleInputChange("officeName", e.target.value)}
                      className="border-gray-200 h-8 text-sm"
                    />
                  </div>


                  {/* Bio field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Short Professional Bio</label>
                    <Textarea
                      placeholder="A 30-word professional intro shown below your designation…"
                      value={cardData.bio}
                      onFocus={() => setLastFocusedField("bio")}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className="border-gray-200 resize-none h-14 text-sm py-1.5"
                    />
                    <Button
                      onClick={handleWriteBio}
                      disabled={isWritingBio}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8 text-xs font-semibold"
                    >
                      {isWritingBio ? <Loader2 size={11} className="animate-spin" /> : <PenLine size={11} />}
                      {isWritingBio ? "AI writing bio…" : "✍️ AI Write 30-Word Bio"}
                    </Button>
                    {bioPreview && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 space-y-2">
                        <p className="text-xs text-gray-700 italic leading-relaxed">{bioPreview}</p>
                        <div className="flex gap-1.5">
                          <Button onClick={handleUseBio} size="sm" className="flex-1 bg-purple-600 text-white h-7 text-[10px] font-bold">Use This</Button>
                          <Button onClick={handleWriteBio} variant="outline" size="sm" className="flex-1 h-7 text-[10px] gap-1"><RefreshCw size={9} />Regenerate</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI clean / Suggestions actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleAICleanData}
                      disabled={isCleaning}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5 h-9 text-xs font-semibold"
                      title="AI fixes name casing, phone format, email and capitalization"
                    >
                      {isCleaning ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      ✨ Fix & Format
                    </Button>
                    <Button
                      onClick={handleGenerateSuggestions}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-xs font-semibold"
                      title="Get 3 AI-generated company tagline alternatives"
                    >
                      <Sparkles size={12} />
                      💡 AI Suggestions
                    </Button>
                  </div>

                  {/* Text Box tool */}
                  <div className="pt-1">
                    <Button
                      onClick={handleAddTextBox}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <Type size={11} /> + Add Custom Text Box
                    </Button>
                  </div>

                  {/* Text Box control panel */}
                  {showTextBoxPanel && textBoxes.length > 0 && (() => {
                    const sel = textBoxes.find(tb => tb.id === selectedTextBoxId) || textBoxes[textBoxes.length - 1];
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Text Box Controls</span>
                          <button onClick={() => setShowTextBoxPanel(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                        </div>
                        <Input
                          value={sel.text}
                          onChange={e => handleUpdateTextBox(sel.id, { text: e.target.value })}
                          className="h-7 text-xs border-gray-200"
                          placeholder="Text content…"
                        />
                        {/* Font Size slider */}
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] text-gray-500 shrink-0 w-10">Size</label>
                          <input
                            type="range" min={8} max={48} value={sel.fontSize}
                            onChange={e => handleUpdateTextBox(sel.id, { fontSize: Number(e.target.value) })}
                            className="flex-1 h-1 accent-teal-600"
                          />
                          <span className="text-[10px] font-mono text-teal-600 w-8 text-right">{sel.fontSize}px</span>
                        </div>
                        {/* Box Width slider — controls word-wrap column */}
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] text-gray-500 shrink-0 w-10">Width</label>
                          <input
                            type="range" min={80} max={500} value={sel.width ?? 300}
                            onChange={e => handleUpdateTextBox(sel.id, { width: Number(e.target.value) })}
                            className="flex-1 h-1 accent-purple-600"
                          />
                          <span className="text-[10px] font-mono text-purple-600 w-8 text-right">{sel.width ?? 300}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] text-gray-500 shrink-0">Color</label>
                          <div className="flex gap-1 flex-wrap">
                            {[cardData.brandColors?.primary || "#047857", cardData.brandColors?.secondary || "#0d9488", "#000000", "#ffffff", "#6b7280"].map(c => (
                              <button key={c} onClick={() => handleUpdateTextBox(sel.id, { color: c })}
                                style={{ background: c, border: sel.color === c ? "2px solid #000" : "1px solid #e5e7eb" }}
                                className="w-5 h-5 rounded-full shrink-0" />
                            ))}
                            <input type="color" value={sel.color}
                              onChange={e => handleUpdateTextBox(sel.id, { color: e.target.value })}
                              className="w-5 h-5 rounded-full cursor-pointer border-0 p-0" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTextBox(sel.id, { bold: !sel.bold })}
                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-bold ${sel.bold ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}
                          ><Bold size={9} /> Bold</button>
                          <button
                            onClick={() => handleUpdateTextBox(sel.id, { italic: !sel.italic })}
                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border italic ${sel.italic ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}
                          ><Italic size={9} /> Italic</button>
                          <button
                            onClick={() => handleDeleteTextBox(sel.id)}
                            className="ml-auto text-[10px] text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 bg-white"
                          >Delete</button>
                        </div>
                        {textBoxes.length > 1 && (
                          <div className="flex gap-1 flex-wrap pt-1">
                            {textBoxes.map((tb, i) => (
                              <button key={tb.id} onClick={() => setSelectedTextBoxId(tb.id)}
                                className={`text-[9px] px-1.5 py-0.5 rounded border ${selectedTextBoxId === tb.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200"}`}
                              >Box {i + 1}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* Social links tab */}
                <TabsContent value="social" className="space-y-3 mt-3 max-h-[45vh] overflow-y-auto pr-1">
                  {Object.entries(cardData.social).map(([platform, value]) => (
                    <div key={platform} className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 capitalize">{platform}</label>
                      <Input
                        placeholder={`Your ${platform} URL or handle`}
                        value={value}
                        onFocus={() => setLastFocusedField(`social.${platform}`)}
                        onChange={(e) => handleInputChange(`social.${platform}`, e.target.value)}
                        className="border-gray-200 h-8 text-sm"
                      />
                    </div>
                  ))}
                </TabsContent>

                {/* Brand Assets */}
                <TabsContent value="brand" className="mt-3 space-y-5">

                  {/* ── Phase 2: Theme + Font Selector ── */}
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                    <ThemeSelector
                      selectedThemeId={cardData.themeId || "classic-white"}
                      selectedFontId={cardData.fontPairingId || "outfit-jakarta"}
                      onThemeChange={(id) => setCardData(prev => ({ ...prev, themeId: id }))}
                      onFontChange={(id) => setCardData(prev => ({ ...prev, fontPairingId: id }))}
                      brandColors={cardData.brandColors}
                    />
                  </div>

                  {/* ── Brand logo + colour picker ── */}
                  <BrandAssets
                    onBrandUpdate={handleBrandUpdate}
                    currentBrandLogo={cardData.brandLogo}
                    currentBrandColors={cardData.brandColors}
                  />

                  {/* ── Custom Card Color Trays ── */}
                  <Card className="p-4 space-y-4 border border-gray-200 bg-white rounded-xl shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-0.5">Custom Card Colors</h3>
                      <p className="text-xs text-gray-500">Fine-tune your card's background and text colors manually</p>
                    </div>

                    <div className="space-y-4">
                      {/* Background Color Tray */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">Card Background</label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Primary Brand */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: cardData.brandColors?.primary || "#047857" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === cardData.brandColors?.primary
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: cardData.brandColors?.primary || "#047857" }} />
                            Primary
                          </button>

                          {/* Secondary Brand */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: cardData.brandColors?.secondary || "#0d9488" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === cardData.brandColors?.secondary
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: cardData.brandColors?.secondary || "#0d9488" }} />
                            Secondary
                          </button>

                          {/* White */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: "#ffffff" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === "#ffffff"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white" />
                            White
                          </button>

                          {/* Black */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: "#000000" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === "#000000"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-black" />
                            Black
                          </button>

                          {/* Slate */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: "#1e293b" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === "#1e293b"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-slate-800" />
                            Slate
                          </button>

                          {/* Cream */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: "#F4F2EC" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customBg === "#F4F2EC"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-[#F4F2EC]" />
                            Cream
                          </button>

                          {/* Custom Color Picker */}
                          <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2.5 py-1 bg-gray-50">
                            <input
                              type="color"
                              value={cardData.customBg || "#ffffff"}
                              onChange={(e) => setCardData(prev => ({ ...prev, customBg: e.target.value }))}
                              className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0"
                            />
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{cardData.customBg || "#FFFFFF"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Text Color Tray */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">Card Text Color</label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Primary Brand */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: cardData.brandColors?.primary || "#047857" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === cardData.brandColors?.primary
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: cardData.brandColors?.primary || "#047857" }} />
                            Primary
                          </button>

                          {/* Secondary Brand */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: cardData.brandColors?.secondary || "#0d9488" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === cardData.brandColors?.secondary
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: cardData.brandColors?.secondary || "#0d9488" }} />
                            Secondary
                          </button>

                          {/* White */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: "#ffffff" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === "#ffffff"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white" />
                            White
                          </button>

                          {/* Black */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: "#000000" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === "#000000"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-black" />
                            Black
                          </button>

                          {/* Slate */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: "#1e293b" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === "#1e293b"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-slate-800" />
                            Slate
                          </button>

                          {/* Cream */}
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customTextColor: "#F4F2EC" }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1.5 transition-all active:scale-95
                              ${cardData.customTextColor === "#F4F2EC"
                                ? "border-teal-500 bg-teal-50 text-teal-900"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                              }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-[#F4F2EC]" />
                            Cream
                          </button>

                          {/* Custom Color Picker */}
                          <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2.5 py-1 bg-gray-50">
                            <input
                              type="color"
                              value={cardData.customTextColor || "#000000"}
                              onChange={(e) => setCardData(prev => ({ ...prev, customTextColor: e.target.value }))}
                              className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0"
                            />
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{cardData.customTextColor || "#000000"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reset custom colors */}
                      {(cardData.customBg || cardData.customTextColor) && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setCardData(prev => ({ ...prev, customBg: "", customTextColor: "" }))}
                            className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            Reset Custom Color Overrides (Back to Theme)
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Layout selections */}
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
                    <SelectItem value="vertical-no-photo">Vertical (No Photo)</SelectItem>
                    <SelectItem value="vertical-with-photo">Vertical (With Photo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save / Share Action */}
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

          {/* Right Preview Column */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 h-fit space-y-4">
            
            {/* AI suggestions container */}
            {showSuggestions && (
              <Card className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-teal-800 flex items-center gap-1">
                    <Sparkles size={16} />
                    AI suggestions
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
                          onClick={() => handleInputChange("officeName", t)}
                          className="bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs px-2.5 py-1 rounded-lg text-left shadow-sm"
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
              textBoxes={textBoxes}
              onTextBoxMove={(id, x, y) => setTextBoxes(prev => prev.map(tb => tb.id === id ? { ...tb, x, y } : tb))}
            />

            {/* ── Export & Download Panel ──────────────────────────────── */}
            <Card className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Download size={13} className="text-teal-600" />
                  <span className="text-xs font-bold text-gray-700">Export &amp; Download</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">PNG, PDF, SVG, vCard &amp; Share</span>
              </div>
              <div className="flex items-center justify-between w-full pt-1">
                {/* SVG */}
                <button
                  onClick={() => handleExportSingleCard("svg")}
                  disabled={isExporting !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#006d4e] hover:bg-[#00583f] text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <Download size={13} className="shrink-0" />
                  <span>SVG</span>
                </button>

                <div className="h-6 w-[1.5px] bg-gray-200 mx-2" />

                {/* PNG */}
                <button
                  onClick={() => handleExportSingleCard("png")}
                  disabled={isExporting !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#007361] hover:bg-[#005e4f] text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <Download size={13} className="shrink-0" />
                  <span>PNG</span>
                </button>

                <div className="h-6 w-[1.5px] bg-gray-200 mx-2" />

                {/* PDF */}
                <button
                  onClick={() => handleExportSingleCard("pdf")}
                  disabled={isExporting !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#006e90] hover:bg-[#005772] text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <Download size={13} className="shrink-0" />
                  <span>PDF</span>
                </button>

                <div className="h-6 w-[1.5px] bg-gray-200 mx-2" />

                {/* vCard */}
                <button
                  onClick={handleDownloadVCard}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#005fa3] hover:bg-[#004c82] text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm"
                >
                  <Contact size={13} className="shrink-0" />
                  <span>vCard</span>
                </button>

                <div className="h-6 w-[1.5px] bg-gray-200 mx-2" />

                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#00a859] hover:bg-[#008f4c] text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm"
                >
                  {/* Official WhatsApp icon SVG */}
                  <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.003 0C7.164 0 .008 7.155.008 15.994c0 2.822.738 5.467 2.026 7.773L0 32l8.44-2.007a15.94 15.94 0 007.563 1.917h.007C24.842 31.91 32 24.754 32 15.915 32 7.077 24.842-.001 16.003-.001zm0 29.226h-.006a13.23 13.23 0 01-6.745-1.843l-.484-.288-5.01 1.193 1.24-4.887-.317-.502A13.205 13.205 0 012.693 15.99C2.693 8.617 8.627 2.684 16 2.684c7.372 0 13.307 5.933 13.307 13.306 0 7.374-5.935 13.236-13.304 13.236zm7.298-9.907c-.4-.2-2.366-1.167-2.732-1.3-.367-.132-.634-.2-.9.2-.267.4-1.033 1.3-1.267 1.566-.233.267-.467.3-.867.1-.4-.2-1.688-.622-3.215-1.984-1.19-1.06-1.993-2.37-2.226-2.77-.233-.4-.025-.616.175-.815.18-.178.4-.467.6-.7.2-.233.267-.4.4-.667.133-.266.067-.5-.033-.7-.1-.2-.9-2.167-1.233-2.967-.324-.779-.654-.673-.9-.686-.233-.012-.5-.015-.767-.015-.267 0-.7.1-1.067.5-.367.4-1.4 1.367-1.4 3.334s1.433 3.867 1.633 4.134c.2.267 2.82 4.306 6.833 6.035.954.413 1.699.66 2.28.845.957.305 1.829.262 2.517.159.768-.115 2.366-.967 2.7-1.9.333-.933.333-1.734.233-1.9-.1-.166-.367-.267-.767-.467z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
              </div>
            </Card>

          </div>
        </div>

        {/* Excel AI cleaner diff preview */}
        {showExcelDiff && excelDiff && (
          <Card className="p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-4 shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5"><Wand2 size={16} /> AI Cleaned Data Preview</h3>
              <button onClick={() => setShowExcelDiff(false)} className="text-amber-700 text-xs hover:underline">Dismiss</button>
            </div>
            <p className="text-xs text-amber-700">Review what AI changed. Click <strong>Apply</strong> to replace your records, or dismiss to keep originals.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="text-left p-1 border border-amber-200 font-bold text-amber-900">#</th>
                    {Object.keys(excelDiff.original[0] || {}).slice(0, 6).map(k => (
                      <th key={k} className="text-left p-1 border border-amber-200 font-bold text-amber-900">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelDiff.cleaned.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-amber-50/40"}>
                      <td className="p-1 border border-amber-100 text-gray-500 font-mono">{i + 1}</td>
                      {Object.keys(excelDiff.original[0] || {}).slice(0, 6).map(k => {
                        const orig = String(excelDiff.original[i]?.[k] || "");
                        const clean = String(row[k] || "");
                        const changed = orig !== clean;
                        return (
                          <td key={k} className={`p-1 border border-amber-100 ${changed ? "bg-green-50" : ""}`}>
                            {changed && <span className="line-through text-red-400 mr-1">{orig}</span>}
                            <span className={changed ? "text-green-700 font-semibold" : "text-gray-700"}>{clean}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyCleanedData} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold h-9 px-5">✅ Apply Cleaned Data</Button>
              <Button variant="outline" onClick={() => setShowExcelDiff(false)} className="text-xs h-9">Keep Originals</Button>
            </div>
          </Card>
        )}

        {/* Dashboard table display of uploaded rows */}
        {dashboardRows.length > 0 && (
          <div className="space-y-6">
            <Card className="p-6 shadow-md bg-white border border-gray-100 rounded-2xl overflow-x-auto space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Candidate Records ({dashboardRows.length})</h2>
                  <p className="text-xs text-gray-500">Check boxes to review cards in the section below, then download your Batch ZIP.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBatchDownloadZIP}
                    disabled={isZipping || checkedCandidateIndexes.length === 0}
                    className="bg-teal-700 hover:bg-teal-850 text-white gap-2 text-xs font-semibold px-4 h-9 shadow-sm"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Zipping {zipProgress}%
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Download Batch ZIP ({checkedCandidateIndexes.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Batch</TableHead>
                    <TableHead>Candidate Name</TableHead>
                    <TableHead>Current Designation</TableHead>
                    <TableHead>Current Company</TableHead>
                    <TableHead>Email ID</TableHead>
                    <TableHead>Mobile No.</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardRows.map((row, idx) => {
                    const nameVal = row["Candidate Name"] || row["Name"] || "Record " + (idx + 1);
                    const desVal = row["Current Designation"] || row["Designation"] || "Data Missing";
                    const compVal = row["Current Company"] || row["Company"] || "Data Missing";
                    const emailVal = row["Email ID"] || row["Email"] || "Data Missing";
                    const phoneVal = row["Mobile No."] || row["Phone"] || "Data Missing";

                    const isSelected = selectedRowIndex === idx;

                    return (
                      <TableRow
                        key={idx}
                        className={`hover:bg-teal-50/50 transition-colors cursor-pointer ${
                          isSelected ? "bg-teal-50/70 border-l-4 border-l-teal-600" : ""
                        }`}
                        onClick={() => selectCandidateRow(row, idx)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checkedCandidateIndexes.includes(idx)}
                            onChange={() => handleToggleCandidate(idx)}
                            className="w-4 h-4 rounded text-teal-600 accent-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className={`font-bold ${nameVal === "Data Missing" ? "text-red-500 italic" : "text-gray-900"}`}>
                          {nameVal}
                        </TableCell>
                        <TableCell className={`font-semibold ${desVal === "Data Missing" ? "text-red-500 italic" : "text-gray-700"}`}>
                          {desVal}
                        </TableCell>
                        <TableCell className={`text-sm ${compVal === "Data Missing" ? "text-red-500 italic" : "text-gray-650"}`}>
                          {compVal}
                        </TableCell>
                        <TableCell className={`text-xs font-mono ${emailVal === "Data Missing" ? "text-red-500 italic" : "text-gray-500"}`}>
                          {emailVal}
                        </TableCell>
                        <TableCell className={`text-xs font-mono ${phoneVal === "Data Missing" ? "text-red-500 italic" : "text-gray-500"}`}>
                          {phoneVal}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`text-[10px] font-bold py-1 h-7 rounded-lg ${
                              isSelected ? "bg-teal-600 text-white" : "border-teal-200 text-teal-700 bg-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <ClipboardCheck size={12} className="mr-1" />
                                Editing
                              </>
                            ) : (
                              "Edit Card"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Batch Preview & Review Section Gallery (Loads up to 10 checked candidates in exact card layouts!) */}
            {checkedCandidateIndexes.length > 0 && (
              <Card className="p-6 bg-white border border-teal-100 rounded-2xl shadow-md space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
                    <Eye className="text-teal-600" size={20} />
                    Verify and Review Checked Batch Cards ({checkedCandidateIndexes.length}/10)
                  </h3>
                  <p className="text-xs text-gray-500">Preview exactly how each batch card will export. These nodes are used directly to package SVG, PNG, and PDF outputs.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {checkedCandidateIndexes.map((idx) => {
                    const cData = getRowCandidateData(idx);
                    return (
                      <div key={idx} className="border border-gray-100 p-4 rounded-xl bg-gray-50/50 shadow-sm space-y-2">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                          <span className="text-xs font-bold text-teal-800">Card #{idx + 1} - {cData.name}</span>
                          <span className="text-[10px] bg-teal-100 text-teal-900 font-mono px-2 py-0.5 rounded-lg font-semibold">{layoutType}</span>
                        </div>
                        <div id={`batch-review-card-${idx}`} className="w-full">
                          <CardPreview
                            cardData={cData}
                            layoutType={layoutType}
                            savedOffsets={offsets} // sharing offsets & sizes across all preview nodes!
                            isPublicView={true}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* AI Settings */}
      {aiSettingsOpen && <AISettings open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />}

      {/* Share dialog modal */}
      {shareModalOpen && (
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="max-w-sm bg-white p-5 rounded-2xl shadow-2xl border border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-teal-600" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Card saved!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <p className="text-xs text-gray-500 leading-relaxed">
                Share this digital card with anyone — they'll see an interactive page with all your contact links.
              </p>

              {/* Shareable link row */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-[11px] font-mono text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                  {getPublicShareURL()}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
                >
                  <Copy size={11} /> Copy
                </button>
              </div>

              {/* WhatsApp share — premium styled */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#17a851] text-white font-bold py-3 rounded-xl shadow-md shadow-green-200 transition-all active:scale-[0.98] text-sm"
              >
                {/* Official WhatsApp icon SVG */}
                <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.003 0C7.164 0 .008 7.155.008 15.994c0 2.822.738 5.467 2.026 7.773L0 32l8.44-2.007a15.94 15.94 0 007.563 1.917h.007C24.842 31.91 32 24.754 32 15.915 32 7.077 24.842-.001 16.003-.001zm0 29.226h-.006a13.23 13.23 0 01-6.745-1.843l-.484-.288-5.01 1.193 1.24-4.887-.317-.502A13.205 13.205 0 012.693 15.99C2.693 8.617 8.627 2.684 16 2.684c7.372 0 13.307 5.933 13.307 13.306 0 7.374-5.935 13.236-13.304 13.236zm7.298-9.907c-.4-.2-2.366-1.167-2.732-1.3-.367-.132-.634-.2-.9.2-.267.4-1.033 1.3-1.267 1.566-.233.267-.467.3-.867.1-.4-.2-1.688-.622-3.215-1.984-1.19-1.06-1.993-2.37-2.226-2.77-.233-.4-.025-.616.175-.815.18-.178.4-.467.6-.7.2-.233.267-.4.4-.667.133-.266.067-.5-.033-.7-.1-.2-.9-2.167-1.233-2.967-.324-.779-.654-.673-.9-.686-.233-.012-.5-.015-.767-.015-.267 0-.7.1-1.067.5-.367.4-1.4 1.367-1.4 3.334s1.433 3.867 1.633 4.134c.2.267 2.82 4.306 6.833 6.035.954.413 1.699.66 2.28.845.957.305 1.829.262 2.517.159.768-.115 2.366-.967 2.7-1.9.333-.933.333-1.734.233-1.9-.1-.166-.367-.267-.767-.467z"/>
                </svg>
                Share on WhatsApp
              </button>

              <button
                onClick={() => setShareModalOpen(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
