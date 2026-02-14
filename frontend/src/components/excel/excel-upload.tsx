"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface SheetResult {
  imported: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  warnings: string[];
  errors: string[];
}

interface ImportResult {
  success: boolean;
  error?: string;
  installationDataId: string;
  sheetA: SheetResult;
  sheetB: SheetResult;
  sheetC: SheetResult;
  sheetD: SheetResult;
  sheetE: SheetResult;
}

type ImportStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface ExcelUploadProps {
  installationDataId: string;
  onImportComplete?: () => void;
}

export function ExcelUpload({ installationDataId, onImportComplete }: ExcelUploadProps) {
  const t = useTranslations("excel");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error(t("invalidFile"));
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("installationDataId", installationDataId);

      setStatus("processing");
      const response = await fetch("/api/documents/excel/import", {
        method: "POST",
        body: formData,
      });

      const importResult: ImportResult = await response.json();
      setResult(importResult);

      if (importResult.success) {
        setStatus("success");
        const totalCreated =
          (importResult.sheetA?.recordsCreated || 0) +
          (importResult.sheetB?.recordsCreated || 0) +
          (importResult.sheetC?.recordsCreated || 0) +
          (importResult.sheetD?.recordsCreated || 0) +
          (importResult.sheetE?.recordsCreated || 0);
        const totalUpdated =
          (importResult.sheetA?.recordsUpdated || 0) +
          (importResult.sheetB?.recordsUpdated || 0) +
          (importResult.sheetC?.recordsUpdated || 0) +
          (importResult.sheetD?.recordsUpdated || 0) +
          (importResult.sheetE?.recordsUpdated || 0);
        toast.success(
          t("importSuccess", { created: totalCreated, updated: totalUpdated })
        );
        onImportComplete?.();
      } else {
        setStatus("error");
        toast.error(importResult.error || t("importError"));
      }
    } catch (error) {
      setStatus("error");
      toast.error(t("importGeneralError"));
      console.error("Import error:", error);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function getSheetStatusIcon(sheet: SheetResult | undefined) {
    if (!sheet) return <Badge variant="secondary">-</Badge>;
    if (sheet.errors.length > 0) return <XCircle className="h-4 w-4 text-destructive" />;
    if (sheet.imported) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    return <Badge variant="secondary">-</Badge>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t("importTitle")}
        </CardTitle>
        <CardDescription>
          {t("importDesc")} {t("sheetsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <Button
            variant={status === "idle" || status === "error" ? "default" : "outline"}
            disabled={status === "uploading" || status === "processing"}
            onClick={() => fileInputRef.current?.click()}
          >
            {status === "uploading" || status === "processing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === "uploading" ? t("uploading") : t("processing")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("selectFile")}
              </>
            )}
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          )}
          {status === "success" && (
            <Badge className="bg-green-100 text-green-800">{t("successBadge")}</Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive">{t("errorBadge")}</Badge>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">{t("results")}</h4>
            <div className="grid grid-cols-5 gap-3 text-sm">
              {[
                { name: t("sheetA"), sheet: result.sheetA },
                { name: t("sheetB"), sheet: result.sheetB },
                { name: t("sheetC"), sheet: result.sheetC },
                { name: t("sheetD"), sheet: result.sheetD },
                { name: t("sheetE"), sheet: result.sheetE },
              ].map(({ name, sheet }) => (
                <div key={name} className="border rounded p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    {getSheetStatusIcon(sheet)}
                    <span className="font-medium text-xs">{name}</span>
                  </div>
                  {sheet && (
                    <div className="text-xs text-muted-foreground">
                      {sheet.recordsCreated > 0 && (
                        <div>{t("newRecords", { count: sheet.recordsCreated })}</div>
                      )}
                      {sheet.recordsUpdated > 0 && (
                        <div>{t("updatedRecords", { count: sheet.recordsUpdated })}</div>
                      )}
                      {sheet.warnings.length > 0 && (
                        <div className="text-amber-600">
                          {t("warningCount", { count: sheet.warnings.length })}
                        </div>
                      )}
                      {sheet.errors.length > 0 && (
                        <div className="text-destructive">
                          {sheet.errors.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t("supportedFormat")}
        </p>
      </CardContent>
    </Card>
  );
}
