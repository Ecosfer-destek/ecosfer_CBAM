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
import { useTranslations } from "next-intl";

const REPORT_TYPE_KEYS = [
  "installation-summary",
  "declaration",
  "emission-detail",
  "supplier-survey",
  "custom",
] as const;

const LANGUAGES = [
  { value: "tr", label: "Turkce" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

interface PdfReportGeneratorProps {
  installationDataId: string;
}

export function PdfReportGenerator({ installationDataId }: PdfReportGeneratorProps) {
  const t = useTranslations("pdf");
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
        const errorData = await response.json().catch(() => ({ error: t("generateError") }));
        toast.error(errorData.error || t("generateError"));
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

      toast.success(t("downloadSuccess"));
    } catch (error) {
      toast.error(t("generateGeneralError"));
      console.error("PDF generation error:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedReportDesc = t(`reportTypeDescriptions.${reportType}` as
    "reportTypeDescriptions.installation-summary" |
    "reportTypeDescriptions.declaration" |
    "reportTypeDescriptions.emission-detail" |
    "reportTypeDescriptions.supplier-survey" |
    "reportTypeDescriptions.custom"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("generateTitle")}
        </CardTitle>
        <CardDescription>
          {t("pdfDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("reportType")}</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`reportTypes.${key}` as
                      "reportTypes.installation-summary" |
                      "reportTypes.declaration" |
                      "reportTypes.emission-detail" |
                      "reportTypes.supplier-survey" |
                      "reportTypes.custom"
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("language")}</label>
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
                  {t("generating")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("download")}
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedReportDesc && (
          <p className="text-xs text-muted-foreground">
            {selectedReportDesc}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
