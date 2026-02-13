"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  {
    value: "installation-summary",
    label: "Tesis Ozet Raporu",
    description: "Tesis, emisyon, denge ve uretim verilerinin ozeti",
  },
  {
    value: "declaration",
    label: "CBAM Beyanname Raporu",
    description: "Yillik beyanname ozeti ve sertifika bilgileri",
  },
  {
    value: "emission-detail",
    label: "Emisyon Detay Raporu",
    description: "Tum emisyon kaynaklarinin detayli listesi (yatay format)",
  },
  {
    value: "supplier-survey",
    label: "Tedarikci Anket Raporu",
    description: "Tedarikci bilgileri ve anket durumu",
  },
  {
    value: "custom",
    label: "Ozel Rapor",
    description: "Rapor sablonu ve bolumlerinden olusturulan rapor",
  },
];

const LANGUAGES = [
  { value: "tr", label: "Turkce" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

interface PdfReportGeneratorProps {
  installationDataId: string;
}

export function PdfReportGenerator({ installationDataId }: PdfReportGeneratorProps) {
  const [reportType, setReportType] = useState("installation-summary");
  const [language, setLanguage] = useState("tr");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);

    try {
      const response = await fetch(`/api/reports/pdf/${reportType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationDataId,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "PDF olusturma hatasi" }));
        toast.error(errorData.error || "PDF olusturma hatasi");
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileName = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1]
        || `CBAM_${reportType}_report.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF rapor indirildi");
    } catch (error) {
      toast.error("PDF olusturma sirasinda hata olustu");
      console.error("PDF generation error:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedReport = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Rapor Uretimi
        </CardTitle>
        <CardDescription>
          5 farkli rapor tipinde PDF dosyasi olusturun
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Rapor Tipi</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Dil</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div className="space-y-1">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Olusturuluyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  PDF Indir
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedReport && (
          <p className="text-xs text-muted-foreground">
            {selectedReport.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
