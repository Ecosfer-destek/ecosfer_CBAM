"use client";

import { useEffect, useState, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Trash2, Eye, FileDown } from "lucide-react";
import {
  getReports,
  getReport,
  createReport,
  deleteReport,
  createReportSection,
} from "@/actions/report";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const REPORT_TYPE_KEYS = [
  "installation-summary",
  "declaration",
  "emission-detail",
  "supplier-survey",
  "custom",
] as const;

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [coverTitle, setCoverTitle] = useState("");
  const [coverContent, setCoverContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pdfType, setPdfType] = useState("installation-summary");
  const [pdfLang, setPdfLang] = useState("tr");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const loadReports = useCallback(() => {
    getReports().then(setReports);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleCreate() {
    setIsCreating(true);
    const result = await createReport({ coverTitle, coverContent });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("created"));
      setShowCreate(false);
      setCoverTitle("");
      setCoverContent("");
      loadReports();
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(tc("confirmDelete"))) return;
    const result = await deleteReport(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("deleted"));
      loadReports();
    }
  }

  async function handleViewDetail(id: string) {
    const report = await getReport(id);
    if (report) {
      setSelectedReport(report);
      setShowDetail(true);
    }
  }

  async function handleAddSection() {
    if (!selectedReport) return;
    const result = await createReportSection({
      part: "PART1",
      sectionTitle: t("newSection"),
      sectionLevel: "HEADING",
      orderNo: (selectedReport.reportSections?.length || 0) + 1,
      reportId: selectedReport.id,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("sectionAdded"));
      const updated = await getReport(selectedReport.id);
      setSelectedReport(updated);
    }
  }

  async function handleGeneratePdf() {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: pdfType,
          language: pdfLang,
          tenantId: "default",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.error || t("pdfError"));
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CBAM_Report_${pdfType}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("pdfDownloaded"));
    } catch {
      toast.error(t("pdfGenerateError"));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("createNew")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createNewDialog")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("reportTitle")}</Label>
                <Input
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="CBAM Raporu 2026 Q1"
                />
              </div>
              <div className="space-y-2">
                <Label>{tc("description")}</Label>
                <Textarea
                  value={coverContent}
                  onChange={(e) => setCoverContent(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {tc("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? tc("creating") : tc("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* PDF Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            {t("createPdf")}
          </CardTitle>
          <CardDescription>
            {t("createNewDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>{t("reportType")}</Label>
              <Select value={pdfType} onValueChange={setPdfType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`reportTypes.${key}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("language")}</Label>
              <Select value={pdfLang} onValueChange={setPdfLang}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">TR</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="de">DE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              {isGeneratingPdf ? tc("creating") : t("downloadPdf")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("reportList")}
          </CardTitle>
          <CardDescription>{t("total", { count: reports.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reportTitle")}</TableHead>
                <TableHead>{t("sections")}</TableHead>
                <TableHead>{tc("createdAt")}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("noReports")}
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => handleViewDetail(r.id)}
                  >
                    <TableCell className="font-medium">
                      {r.coverTitle || t("untitledReport")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.reportSections?.length || 0} {t("sectionCount")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(r.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.coverTitle || t("detail")}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {selectedReport.coverContent && (
                <p className="text-sm text-muted-foreground">
                  {selectedReport.coverContent}
                </p>
              )}
              <div className="text-sm">
                <span className="font-medium">{t("createdAtLabel")}</span>
                {new Date(selectedReport.createdAt).toLocaleDateString("tr-TR")}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {t("sectionsLabel")} ({selectedReport.reportSections?.length || 0})
                  </h4>
                  <Button size="sm" variant="outline" onClick={handleAddSection}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("addSection")}
                  </Button>
                </div>
                {selectedReport.reportSections?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {t("noSections")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedReport.reportSections?.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (section: any, idx: number) => (
                        <div
                          key={section.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {idx + 1}. {section.sectionTitle}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant="outline">{section.part}</Badge>
                              <Badge variant="secondary">
                                {section.reportSectionContents?.length || 0}{" "}
                                {t("content")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              {tc("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
