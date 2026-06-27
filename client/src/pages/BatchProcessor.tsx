import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2, Download, Eye, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import CardPreview from "@/components/CardPreview";
import { convertSvgToPngDataUrl } from "@/lib/export-utils";

interface BatchCandidate {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  address: string;
  officeName: string;
  officeDetails: string;
  headshot?: string;
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

export default function BatchProcessor() {
  const [, navigate] = useLocation();
  const [candidates, setCandidates] = useState<BatchCandidate[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [layoutType, setLayoutType] = useState<"horizontal-no-photo" | "horizontal-with-photo" | "vertical">("horizontal-no-photo");
  const [previewCandidate, setPreviewCandidate] = useState<BatchCandidate | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Common parser helper mapping case-insensitive headers and warning if missing
  const parseRowData = (headers: string[], row: any, idIndex: number): BatchCandidate => {
    const getColumnValue = (fieldsList: string[]): string => {
      // Find matching header case-insensitively
      const matchedHeader = headers.find(h => fieldsList.includes(h.toLowerCase()));
      if (matchedHeader) {
        return String(row[matchedHeader] || "").trim();
      }
      return "Data Missing";
    };

    return {
      id: `candidate-${idIndex}`,
      name: getColumnValue(EXPECTED_HEADERS.name),
      designation: getColumnValue(EXPECTED_HEADERS.designation),
      phone: getColumnValue(EXPECTED_HEADERS.phone),
      email: getColumnValue(EXPECTED_HEADERS.email),
      address: getColumnValue(EXPECTED_HEADERS.address),
      officeName: getColumnValue(EXPECTED_HEADERS.officeName),
      officeDetails: getColumnValue(EXPECTED_HEADERS.officeDetails),
      social: {
        linkedin: getColumnValue(EXPECTED_HEADERS.linkedin),
        twitter: getColumnValue(EXPECTED_HEADERS.twitter),
        instagram: getColumnValue(EXPECTED_HEADERS.instagram),
        facebook: getColumnValue(EXPECTED_HEADERS.facebook),
        youtube: getColumnValue(EXPECTED_HEADERS.youtube),
        github: getColumnValue(EXPECTED_HEADERS.github),
        tiktok: getColumnValue(EXPECTED_HEADERS.tiktok),
        whatsapp: getColumnValue(EXPECTED_HEADERS.whatsapp),
        website: getColumnValue(EXPECTED_HEADERS.website),
      }
    };
  };

  // Handle CSV/Excel parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const reader = new FileReader();

    if (file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split("\n").map(line => line.trim()).filter(Boolean);
          if (lines.length < 2) {
            toast.error("CSV file is empty or missing headers");
            return;
          }

          // Parse headers
          const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());

          const newCandidates: BatchCandidate[] = [];
          for (let i = 1; i < Math.min(lines.length, 11); i++) {
            const line = lines[i];
            const values = line.split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
            
            const rowObject: any = {};
            headers.forEach((h, idx) => {
              rowObject[h] = values[idx] || "";
            });

            const candidate = parseRowData(headers, rowObject, i);
            newCandidates.push(candidate);
          }

          setCandidates(newCandidates);
          toast.success(`Loaded ${newCandidates.length} candidates from CSV`);
        } catch (error) {
          toast.error("Failed to parse CSV file");
          console.error(error);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          if (jsonData.length === 0) {
            toast.error("Excel file has no data rows");
            return;
          }

          const headers = Object.keys(jsonData[0]);

          const newCandidates: BatchCandidate[] = jsonData.slice(0, 10).map((row, idx) => {
            return parseRowData(headers, row, idx + 1);
          });

          setCandidates(newCandidates);
          toast.success(`Loaded ${newCandidates.length} candidates from Excel`);
        } catch (error) {
          toast.error("Failed to parse Excel file");
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Unsupported file format. Please upload CSV or Excel");
    }
  };

  // Upload individual headshot
  const handleHeadshotUpload = (candidateId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, headshot: event.target?.result as string }
            : c
        )
      );
      toast.success("Photo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const removeCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    toast.success("Candidate removed");
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Babu Chakraborty",
        designation: "Head of Marketing",
        phone: "+91 98220 12345",
        email: "babu.chakraborty@sorigin.in",
        address: "7th Floor, Tower A, Cybercity Commerzone, Mundhwa, Pune - 411089, Maharashtra, India",
        officeName: "Sorigin Group",
        officeDetails: "Pune, Maharashtra, India",
        website: "https://www.sorigin.in",
        linkedin: "https://linkedin.com/in/babu",
        twitter: "https://twitter.com/babu",
        instagram: "https://instagram.com/babu",
        facebook: "https://facebook.com/babu",
        youtube: "https://youtube.com/@babu",
        github: "",
        tiktok: "",
        whatsapp: "+91 98220 12345",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "glasscard-batch-template.xlsx");
    toast.success("Template downloaded");
  };

  // Generate & Download ZIP of all cards client-side
  const handleGenerateCardsZip = async () => {
    if (candidates.length === 0) {
      toast.error("Please add candidates first");
      return;
    }
    setIsGeneratingZip(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        setZipProgress(Math.round(((i) / candidates.length) * 100));

        // Locate hidden SVG element on the DOM and cast as SVGSVGElement
        const hiddenDiv = document.getElementById(`hidden-card-container-${c.id}`);
        const svgEl = hiddenDiv?.querySelector("svg") as unknown as SVGSVGElement;

        if (!svgEl) {
          console.warn(`SVG not found for candidate ${c.name}`);
          continue;
        }

        const filename = c.name.replace(/\s+/g, "_");

        // 1. Add SVG file
        const svgString = new XMLSerializer().serializeToString(svgEl);
        zip.file(`${filename}.svg`, svgString);

        // 2. Add PNG file (scale = 3 for high res 300 DPI)
        const pngUrl = await convertSvgToPngDataUrl(svgEl, 3);
        const pngBase64 = pngUrl.split(",")[1];
        zip.file(`${filename}.png`, pngBase64, { base64: true });

        // 3. Add PDF file (using jsPDF)
        const viewBoxWidth = svgEl.viewBox?.baseVal?.width || 800;
        const viewBoxHeight = svgEl.viewBox?.baseVal?.height || 450;
        const pdf = new jsPDF({
          orientation: layoutType === "vertical" ? "portrait" : "landscape",
          unit: "px",
          format: [viewBoxWidth, viewBoxHeight],
        });
        pdf.addImage(pngUrl, "PNG", 0, 0, viewBoxWidth, viewBoxHeight);
        const pdfBuffer = pdf.output("arraybuffer");
        zip.file(`${filename}.pdf`, pdfBuffer);
      }

      setZipProgress(100);
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `visiting_cards_batch.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Successfully generated and zipped ${candidates.length} cards!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate ZIP archive of cards");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Batch Card Generator</h1>
          <p className="text-gray-600">Upload CSV or Excel file with up to 10 candidates, upload photos, and generate ZIP packages</p>
        </div>

        {/* Configuration panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upload card config */}
          <Card className="glass-card p-6 col-span-2">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-[250px]">
                  <label className="text-sm font-medium block mb-2 text-gray-700">Upload CSV / Excel File</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadTemplate} variant="outline" className="bg-white">
                    <Download size={18} className="mr-2" />
                    Template
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Layout type selector */}
          <Card className="glass-card p-6">
            <label className="text-sm font-medium block mb-2 text-gray-700">Batch Layout Template</label>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => setLayoutType("horizontal-no-photo")}
                variant={layoutType === "horizontal-no-photo" ? "default" : "outline"}
                className={layoutType === "horizontal-no-photo" ? "bg-teal-700 hover:bg-teal-800" : "bg-white"}
              >
                Horizontal (No Photo)
              </Button>
              <Button
                size="sm"
                onClick={() => setLayoutType("horizontal-with-photo")}
                variant={layoutType === "horizontal-with-photo" ? "default" : "outline"}
                className={layoutType === "horizontal-with-photo" ? "bg-teal-700 hover:bg-teal-800" : "bg-white"}
              >
                Horizontal (With Photo)
              </Button>
              <Button
                size="sm"
                onClick={() => setLayoutType("vertical")}
                variant={layoutType === "vertical" ? "default" : "outline"}
                className={layoutType === "vertical" ? "bg-teal-700 hover:bg-teal-800" : "bg-white"}
              >
                Vertical (3:4)
              </Button>
            </div>
          </Card>
        </div>

        {/* Hidden card templates rendering for DOM capture */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", visibility: "hidden" }}>
          {candidates.map((c) => (
            <div key={c.id} id={`hidden-card-container-${c.id}`}>
              <CardPreview
                cardData={{
                  headshot: c.headshot || null,
                  name: c.name,
                  designation: c.designation,
                  phone: c.phone,
                  email: c.email,
                  address: c.address,
                  officeName: c.officeName,
                  officeDetails: c.officeDetails,
                  social: c.social,
                  brandColors: {
                    primary: "#047857",
                    secondary: "#0d9488",
                  },
                }}
                layoutType={layoutType}
              />
            </div>
          ))}
        </div>

        {/* Candidates Table */}
        {candidates.length > 0 && (
          <Card className="glass-card p-6 overflow-x-auto shadow-md bg-white/70 backdrop-blur-sm border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Uploaded Candidates ({candidates.length}/10)</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.headshot ? (
                          <img
                            src={c.headshot}
                            alt={c.name}
                            className="w-12 h-12 rounded-full object-cover border border-teal-200"
                          />
                        ) : (
                          <label className="cursor-pointer relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleHeadshotUpload(c.id, file);
                              }}
                              className="hidden"
                            />
                            <div className="w-12 h-12 bg-teal-50 border border-dashed border-teal-300 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors">
                              <Upload size={16} />
                            </div>
                          </label>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`font-bold ${c.name === "Data Missing" ? "text-red-500 italic" : "text-gray-900"}`}>{c.name}</TableCell>
                    <TableCell className={`font-semibold ${c.designation === "Data Missing" ? "text-red-500 italic" : "text-gray-700"}`}>{c.designation}</TableCell>
                    <TableCell className={`text-sm font-mono ${c.email === "Data Missing" ? "text-red-500 italic" : "text-gray-600"}`}>{c.email}</TableCell>
                    <TableCell className={`text-sm font-mono ${c.phone === "Data Missing" ? "text-red-500 italic" : "text-gray-600"}`}>{c.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewCandidate(c)}
                          className="text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                        >
                          <Eye size={16} className="mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCandidate(c.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Batch Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => navigate("/card-builder")}
                className="flex-1 bg-white hover:bg-teal-50 border-teal-200 text-teal-800"
              >
                Back to Single Card
              </Button>
              <Button
                onClick={handleGenerateCardsZip}
                disabled={isGeneratingZip}
                className="flex-1 bg-teal-700 hover:bg-teal-850 text-white font-semibold gap-2 py-6 shadow-md"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Zipping Cards ({zipProgress}%)
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Batch ZIP (PNG, PDF, SVG)
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {candidates.length === 0 && (
          <Card className="glass-card p-12 text-center shadow-md border border-white/20 bg-white/50">
            <div className="space-y-4 max-w-sm mx-auto">
              <Upload size={48} className="mx-auto text-teal-400" />
              <h3 className="text-lg font-bold text-gray-800">No Candidate Data Yet</h3>
              <p className="text-gray-600 text-sm">
                Upload your employee Excel sheet or CSV file to parse the records and generate cards in bulk.
              </p>
              <Button onClick={downloadTemplate} variant="outline" className="w-full bg-white">
                Download Excel Template
              </Button>
            </div>
          </Card>
        )}

        {/* Preview Dialog Modal */}
        {previewCandidate && (
          <Dialog open={!!previewCandidate} onOpenChange={(open) => !open && setPreviewCandidate(null)}>
            <DialogContent className="max-w-3xl bg-white p-6 rounded-2xl shadow-2xl border border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                  Visiting Card Preview - {previewCandidate.name}
                </DialogTitle>
              </DialogHeader>
              <div className="p-2 bg-gray-50 rounded-xl border">
                <CardPreview
                  cardData={{
                    headshot: previewCandidate.headshot || null,
                    name: previewCandidate.name,
                    designation: previewCandidate.designation,
                    phone: previewCandidate.phone,
                    email: previewCandidate.email,
                    address: previewCandidate.address,
                    officeName: previewCandidate.officeName,
                    officeDetails: previewCandidate.officeDetails,
                    social: previewCandidate.social,
                    brandColors: {
                      primary: "#047857",
                      secondary: "#0d9488",
                    },
                  }}
                  layoutType={layoutType}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
