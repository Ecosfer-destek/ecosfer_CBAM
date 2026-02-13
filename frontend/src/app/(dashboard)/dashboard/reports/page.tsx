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

const REPORT_TYPES = [
  { value: "installation-summary", label: "Tesis Özet Raporu" },
  { value: "declaration", label: "CBAM Beyanname Raporu" },
  { value: "emission-detail", label: "Emisyon Detay Raporu" },
  { value: "supplier-survey", label: "Tedarikçi Anket Raporu" },
  { value: "custom", label: "Özel Rapor" },
];

export default function ReportsPage() {
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
      toast.success("Rapor oluşturuldu");
      setShowCreate(false);
      setCoverTitle("");
      setCoverContent("");
      loadReports();
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu raporu silmek istediğinizden emin misiniz?")) return;
    const result = await deleteReport(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Rapor silindi");
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
      sectionTitle: "Yeni Bölüm",
      sectionLevel: "HEADING",
      orderNo: (selectedReport.reportSections?.length || 0) + 1,
      reportId: selectedReport.id,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Bölüm eklendi");
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
        toast.error(err.error || "PDF oluşturulamadı");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CBAM_Report_${pdfType}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF indirildi");
    } catch {
      toast.error("PDF oluşturulurken bir hata oluştu");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CBAM Raporları</h1>
          <p className="text-muted-foreground">
            Raporları oluşturun ve yönetin
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Rapor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Rapor Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rapor Başlığı</Label>
                <Input
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="CBAM Raporu 2026 Q1"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={coverContent}
                  onChange={(e) => setCoverContent(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Oluşturuluyor..." : "Oluştur"}
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
            PDF Rapor Oluştur
          </CardTitle>
          <CardDescription>
            Seçili rapor tipine göre PDF oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>Rapor Tipi</Label>
              <Select value={pdfType} onValueChange={setPdfType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dil</Label>
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
              {isGeneratingPdf ? "Oluşturuluyor..." : "PDF İndir"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Raporlar
          </CardTitle>
          <CardDescription>Toplam {reports.length} rapor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Bölüm Sayısı</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Henüz rapor bulunmuyor
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
                      {r.coverTitle || "İsimsiz Rapor"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.reportSections?.length || 0} bölüm
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
              {selectedReport?.coverTitle || "Rapor Detayı"}
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
                <span className="font-medium">Oluşturma: </span>
                {new Date(selectedReport.createdAt).toLocaleDateString("tr-TR")}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    Bölümleri ({selectedReport.reportSections?.length || 0})
                  </h4>
                  <Button size="sm" variant="outline" onClick={handleAddSection}>
                    <Plus className="mr-1 h-3 w-3" />
                    Bölüm Ekle
                  </Button>
                </div>
                {selectedReport.reportSections?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Henüz bölüm eklenmemiş
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
                                içerik
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
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
