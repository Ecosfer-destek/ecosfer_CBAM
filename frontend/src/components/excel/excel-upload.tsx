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
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Lutfen bir Excel dosyasi (.xlsx) secin");
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
          `Import basarili! ${totalCreated} kayit olusturuldu, ${totalUpdated} guncellendi`
        );
        onImportComplete?.();
      } else {
        setStatus("error");
        toast.error(importResult.error || "Import sirasinda bir hata olustu");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Excel import sirasinda bir hata olustu");
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
          CBAM Excel Import
        </CardTitle>
        <CardDescription>
          CBAM Excel dosyasini yukleyerek 5 sayfadaki verileri iceri aktarin
          (A: Tesis, B: Emisyon, C: Denge, D: Prosesler, E: Prekursorler)
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
                {status === "uploading" ? "Yukleniyor..." : "Isleniyor..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Excel Dosyasi Sec
              </>
            )}
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          )}
          {status === "success" && (
            <Badge className="bg-green-100 text-green-800">Basarili</Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive">Hata</Badge>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Import Sonuclari</h4>
            <div className="grid grid-cols-5 gap-3 text-sm">
              {[
                { name: "A: Tesis", sheet: result.sheetA },
                { name: "B: Emisyon", sheet: result.sheetB },
                { name: "C: Denge", sheet: result.sheetC },
                { name: "D: Prosesler", sheet: result.sheetD },
                { name: "E: Prekursor", sheet: result.sheetE },
              ].map(({ name, sheet }) => (
                <div key={name} className="border rounded p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    {getSheetStatusIcon(sheet)}
                    <span className="font-medium text-xs">{name}</span>
                  </div>
                  {sheet && (
                    <div className="text-xs text-muted-foreground">
                      {sheet.recordsCreated > 0 && (
                        <div>+{sheet.recordsCreated} yeni</div>
                      )}
                      {sheet.recordsUpdated > 0 && (
                        <div>~{sheet.recordsUpdated} guncellendi</div>
                      )}
                      {sheet.warnings.length > 0 && (
                        <div className="text-amber-600">
                          {sheet.warnings.length} uyari
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
          Desteklenen format: .xlsx (CBAM Communication Template).
          5 sayfa otomatik import edilir: A_InstData, B_EmInst,
          C_Emissions&amp;Energy, D_Processes, E_PurchPrec
        </p>
      </CardContent>
    </Card>
  );
}
