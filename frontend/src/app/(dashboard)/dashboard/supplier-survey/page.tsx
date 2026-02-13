"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  CheckCircle2,
  Eye,
  Loader2,
  Flame,
  Zap,
  Factory,
  FileText,
  Calendar,
  User,
  Package,
} from "lucide-react";
import {
  getSupplierSurveysForAdmin,
  approveSupplierSurvey,
} from "@/actions/supplier";
import { toast } from "sonner";

type StatusFilter = "ALL" | "DRAFT" | "SUBMITTED" | "APPROVED";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  SUBMITTED: "Gönderildi",
  APPROVED: "Onaylandı",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "outline",
};

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

function formatNumber(
  value: number | string | null | undefined,
  decimals = 4
): string {
  if (value === null || value === undefined) return "-";
  return Number(value).toFixed(decimals);
}

export default function SupplierSurveyPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [surveys, setSurveys] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSupplierSurveysForAdmin();
      setSurveys(data);
    } catch {
      toast.error("Anketler yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredSurveys =
    statusFilter === "ALL"
      ? surveys
      : surveys.filter((s) => s.status === statusFilter);

  const statusCounts = {
    ALL: surveys.length,
    DRAFT: surveys.filter((s) => s.status === "DRAFT").length,
    SUBMITTED: surveys.filter((s) => s.status === "SUBMITTED").length,
    APPROVED: surveys.filter((s) => s.status === "APPROVED").length,
  };

  async function handleApprove(surveyId: string) {
    setIsApproving(true);
    const result = await approveSupplierSurvey(surveyId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Anket onaylandı");
      // Update local state
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, status: "APPROVED" } : s))
      );
      // If the detail dialog is open for this survey, update it too
      if (selectedSurvey?.id === surveyId) {
        setSelectedSurvey((prev: typeof selectedSurvey) =>
          prev ? { ...prev, status: "APPROVED" } : null
        );
      }
    }
    setIsApproving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tedarikçi Anketi</h1>
        <p className="text-muted-foreground">
          CBAM kapsamında tedarikçi emisyon anketlerini inceleyin ve onaylayın
        </p>
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="ALL">
            Tümü ({statusCounts.ALL})
          </TabsTrigger>
          <TabsTrigger value="DRAFT">
            Taslak ({statusCounts.DRAFT})
          </TabsTrigger>
          <TabsTrigger value="SUBMITTED">
            Gönderildi ({statusCounts.SUBMITTED})
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            Onaylandı ({statusCounts.APPROVED})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Survey Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Anket Listesi
          </CardTitle>
          <CardDescription>
            Toplam {filteredSurveys.length} anket
            {statusFilter !== "ALL" && ` (${STATUS_LABELS[statusFilter]})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Yükleniyor...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Mal (CN Kodu)</TableHead>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Emisyonlar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      {statusFilter === "ALL"
                        ? "Henüz anket bulunmuyor"
                        : `${STATUS_LABELS[statusFilter]} durumunda anket bulunmuyor`}
                    </TableCell>
                  </TableRow>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  filteredSurveys.map((survey: any) => (
                    <TableRow
                      key={survey.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {survey.supplier?.name || "-"}
                          </p>
                          {survey.supplier?.email && (
                            <p className="text-xs text-muted-foreground">
                              {survey.supplier.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {survey.supplierGood?.name || "Genel"}
                          </p>
                          {survey.supplierGood?.cnCode && (
                            <p className="text-xs text-muted-foreground">
                              {survey.supplierGood.cnCode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(survey.reportingPeriodStart)} -{" "}
                        {formatDate(survey.reportingPeriodEnd)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANTS[survey.status] || "secondary"}
                          className={
                            survey.status === "APPROVED"
                              ? "border-green-500 text-green-700 dark:text-green-400"
                              : ""
                          }
                        >
                          {STATUS_LABELS[survey.status] || survey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {survey.specificEmbeddedEmissions ? (
                          <span className="text-sm font-medium">
                            {formatNumber(survey.specificEmbeddedEmissions)}{" "}
                            <span className="text-xs text-muted-foreground">
                              tCO2e/t
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedSurvey(survey)}
                            title="Detay"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {survey.status === "SUBMITTED" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(survey.id)}
                              disabled={isApproving}
                            >
                              {isApproving ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Onayla
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Survey Detail Dialog */}
      <Dialog
        open={!!selectedSurvey}
        onOpenChange={(open) => !open && setSelectedSurvey(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Anket Detayı
            </DialogTitle>
            <DialogDescription>
              {selectedSurvey?.supplier?.name} -{" "}
              {selectedSurvey?.supplierGood?.name || "Genel"}
            </DialogDescription>
          </DialogHeader>
          {selectedSurvey && (
            <div className="space-y-6">
              {/* Status & Info Header */}
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    STATUS_VARIANTS[selectedSurvey.status] || "secondary"
                  }
                  className={
                    selectedSurvey.status === "APPROVED"
                      ? "border-green-500 text-green-700 dark:text-green-400"
                      : ""
                  }
                >
                  {STATUS_LABELS[selectedSurvey.status] ||
                    selectedSurvey.status}
                </Badge>
                {selectedSurvey.status === "SUBMITTED" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(selectedSurvey.id)}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    Onayla
                  </Button>
                )}
              </div>

              {/* Supplier Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tedarikçi Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tedarikçi</p>
                      <p className="font-medium">
                        {selectedSurvey.supplier?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">E-posta</p>
                      <p className="font-medium">
                        {selectedSurvey.supplier?.email || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Good Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Mal Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mal</p>
                      <p className="font-medium">
                        {selectedSurvey.supplierGood?.name || "Genel"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CN Kodu</p>
                      <p className="font-medium">
                        {selectedSurvey.supplierGood?.cnCode || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reporting Period */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Raporlama Dönemi
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Başlangıç</p>
                      <p className="font-medium">
                        {formatDate(selectedSurvey.reportingPeriodStart)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bitiş</p>
                      <p className="font-medium">
                        {formatDate(selectedSurvey.reportingPeriodEnd)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emissions Data */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Emisyon Verileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Spesifik Gömülü Emisyonlar
                      </p>
                      <p className="font-medium">
                        {formatNumber(
                          selectedSurvey.specificEmbeddedEmissions
                        )}{" "}
                        {selectedSurvey.specificEmbeddedEmissions
                          ? "tCO2e/t"
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Doğrudan Emisyonlar
                      </p>
                      <p className="font-medium">
                        {formatNumber(selectedSurvey.directEmissions)}{" "}
                        {selectedSurvey.directEmissions ? "tCO2e" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Dolaylı Emisyonlar
                      </p>
                      <p className="font-medium">
                        {formatNumber(selectedSurvey.indirectEmissions)}{" "}
                        {selectedSurvey.indirectEmissions ? "tCO2e" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Üretim Hacmi</p>
                      <p className="font-medium">
                        {formatNumber(selectedSurvey.productionVolume, 2)}{" "}
                        {selectedSurvey.productionVolume ? "t" : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Energy Consumption */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Enerji Tüketimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Elektrik Tüketimi
                      </p>
                      <p className="font-medium">
                        {formatNumber(
                          selectedSurvey.electricityConsumption,
                          2
                        )}{" "}
                        {selectedSurvey.electricityConsumption ? "MWh" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Isı Tüketimi</p>
                      <p className="font-medium">
                        {formatNumber(selectedSurvey.heatConsumption, 2)}{" "}
                        {selectedSurvey.heatConsumption ? "MWh" : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Methodology */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Metodoloji
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Emisyon Faktörü Kaynağı
                      </p>
                      <p className="font-medium">
                        {selectedSurvey.emissionFactorSource || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        İzleme Metodolojisi
                      </p>
                      <p className="font-medium">
                        {selectedSurvey.monitoringMethodology || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedSurvey.notes && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSurvey.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="flex gap-4 text-xs text-muted-foreground border-t pt-3">
                <span>
                  Oluşturulma: {formatDate(selectedSurvey.createdAt)}
                </span>
                {selectedSurvey.submittedAt && (
                  <span>
                    Gönderilme: {formatDate(selectedSurvey.submittedAt)}
                  </span>
                )}
                <span>
                  Güncelleme: {formatDate(selectedSurvey.updatedAt)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedSurvey?.status === "SUBMITTED" && (
              <Button
                variant="default"
                onClick={() => handleApprove(selectedSurvey.id)}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Onayla
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setSelectedSurvey(null)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
