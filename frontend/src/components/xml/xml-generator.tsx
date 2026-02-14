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
import { Badge } from "@/components/ui/badge";
import {
  FileCode2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface XmlGenerationResult {
  success: boolean;
  error?: string;
  xmlContent?: string;
  sha256Hash?: string;
  validationErrors: string[];
  warnings: string[];
  declarationId: string;
  generatedAt: string;
}

type GenerationStatus = "idle" | "generating" | "success" | "error";

interface XmlGeneratorProps {
  declarationId: string;
}

export function XmlGenerator({ declarationId }: XmlGeneratorProps) {
  const t = useTranslations("xml");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [result, setResult] = useState<XmlGenerationResult | null>(null);

  async function handleGenerate() {
    setStatus("generating");
    setResult(null);

    try {
      const response = await fetch(
        `/api/documents/xml/generate/${declarationId}`,
        { method: "POST" }
      );

      const data: XmlGenerationResult = await response.json();
      setResult(data);

      if (data.success) {
        setStatus("success");
        toast.success(t("generateSuccess"));
      } else {
        setStatus("error");
        toast.error(data.error || t("generateError"));
      }
    } catch (error) {
      setStatus("error");
      toast.error(t("generateGeneralError"));
      console.error("XML generation error:", error);
    }
  }

  async function handleDownload() {
    try {
      const response = await fetch(
        `/api/documents/xml/download/${declarationId}`
      );

      if (!response.ok) {
        toast.error(t("downloadError"));
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CBAM_Declaration_${declarationId}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("downloadSuccess"));
    } catch (error) {
      toast.error(t("downloadError"));
      console.error("XML download error:", error);
    }
  }

  function handleCopyHash() {
    if (result?.sha256Hash) {
      navigator.clipboard.writeText(result.sha256Hash);
      toast.success(t("hashCopied"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5" />
          {t("generateTitle")}
        </CardTitle>
        <CardDescription>
          {t("xmlDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={status === "generating"}
          >
            {status === "generating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <FileCode2 className="mr-2 h-4 w-4" />
                {t("generate")}
              </>
            )}
          </Button>

          {status === "success" && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t("download")}
            </Button>
          )}

          {status === "success" && (
            <Badge className="bg-green-100 text-green-800">{tc("success")}</Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive">{tc("error")}</Badge>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="border rounded-lg p-4 space-y-3">
            {/* Hash */}
            {result.sha256Hash && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-mono">
                  SHA-256: {result.sha256Hash}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyHash}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Validation Errors */}
            {result.validationErrors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {t("validationWarnings")} ({result.validationErrors.length})
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 ml-5 list-disc">
                  {result.validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {result.warnings.join(", ")}
                </div>
              </div>
            )}

            {/* Success info */}
            {result.success && result.validationErrors.length === 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {t("validationNoErrors")}
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {result.error}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t("xmlOutputDesc")}
        </p>
      </CardContent>
    </Card>
  );
}
