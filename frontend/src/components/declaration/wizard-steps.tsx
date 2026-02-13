"use client";

import { useCallback, useEffect, useState } from "react";
import { useDeclarationWizardStore } from "@/stores/declaration-wizard-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  Package,
  Flame,
  FileCheck,
  Scale,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInstallations,
} from "@/actions/installation";
import {
  getInstallationDataList,
} from "@/actions/installation-data";
import {
  getCertificates,
  createDeclaration,
  createCertificateSurrender,
  createFreeAllocationAdjustment,
  updateDeclaration,
} from "@/actions/declaration";

// ============================================================================
// Step 1: Select Installation & Year
// ============================================================================
export function StepSelectInstallation() {
  const { year, setYear, installation, setInstallation, nextStep } =
    useDeclarationWizardStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installations, setInstallations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installationDatas, setInstallationDatas] = useState<any[]>([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [selectedDataId, setSelectedDataId] = useState("");

  useEffect(() => {
    getInstallations().then(setInstallations);
  }, []);

  useEffect(() => {
    if (selectedInstId) {
      getInstallationDataList(selectedInstId).then(setInstallationDatas);
    }
  }, [selectedInstId]);

  function handleNext() {
    if (!selectedInstId || !selectedDataId) {
      toast.error("Tesis ve veri dönemi seçin");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inst = installations.find((i: any) => i.id === selectedInstId);
    setInstallation({
      installationId: selectedInstId,
      installationName: inst?.name || "",
      installationDataId: selectedDataId,
      companyName: inst?.company?.name || "",
    });
    nextStep();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Adım 1: Tesis ve Raporlama Yılı Seç
        </CardTitle>
        <CardDescription>
          Beyanname için tesis, veri dönemi ve raporlama yılını seçin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Raporlama Yılı *</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2023}
              max={2035}
            />
          </div>

          <div className="space-y-2">
            <Label>Tesis *</Label>
            <Select value={selectedInstId} onValueChange={setSelectedInstId}>
              <SelectTrigger>
                <SelectValue placeholder="Tesis seçin" />
              </SelectTrigger>
              <SelectContent>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {installations.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name} - {inst.company?.name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Veri Dönemi *</Label>
            <Select value={selectedDataId} onValueChange={setSelectedDataId}>
              <SelectTrigger>
                <SelectValue placeholder="Dönem seçin" />
              </SelectTrigger>
              <SelectContent>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {installationDatas.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.startDate
                      ? new Date(d.startDate).toLocaleDateString("tr-TR")
                      : "?"}{" "}
                    -{" "}
                    {d.endDate
                      ? new Date(d.endDate).toLocaleDateString("tr-TR")
                      : "?"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {installation && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <p className="text-sm">
              <span className="font-medium">Seçili:</span>{" "}
              {installation.companyName} / {installation.installationName}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={!selectedInstId || !selectedDataId}>
            Devam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 2: Review Imported Goods
// ============================================================================
export function StepReviewGoods() {
  const { installation, goods, setGoods, nextStep, prevStep } =
    useDeclarationWizardStore();
  const [loading, setLoading] = useState(true);

  const loadGoods = useCallback(async (installationDataId: string) => {
    try {
      const response = await fetch(
        `/api/installation-data/${installationDataId}/goods`
      );
      if (response.ok) {
        const data = await response.json();
        setGoods(data);
      }
    } catch {
      setGoods([]);
    }
    setLoading(false);
  }, [setGoods]);

  useEffect(() => {
    if (installation?.installationDataId) {
      loadGoods(installation.installationDataId);
    }
  }, [installation?.installationDataId, loadGoods]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Adım 2: İthal Malları Gözden Geçir
        </CardTitle>
        <CardDescription>
          Tesis verisinden elde edilen ithal mal kategorileri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
          </div>
        ) : goods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            İthal mal verisi bulunamadı. Excel import ile veri yükleyin.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead>CN Kodu</TableHead>
                <TableHead>Rota Tipi</TableHead>
                <TableHead>Rotalar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goods.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.categoryName}</TableCell>
                  <TableCell>{g.cnCode || "-"}</TableCell>
                  <TableCell>{g.routeType || "-"}</TableCell>
                  <TableCell>{g.routes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>Geri</Button>
          <Button onClick={nextStep}>Devam</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 3: Review Embedded Emissions
// ============================================================================
export function StepReviewEmissions() {
  const { installation, emissions, setEmissions, nextStep, prevStep } =
    useDeclarationWizardStore();
  const [loading, setLoading] = useState(true);

  const loadEmissions = useCallback(async (installationDataId: string) => {
    try {
      const response = await fetch(
        `/api/installation-data/${installationDataId}/emissions`
      );
      if (response.ok) {
        const data = await response.json();
        setEmissions(data);
      }
    } catch {
      setEmissions([]);
    }
    setLoading(false);
  }, [setEmissions]);

  useEffect(() => {
    if (installation?.installationDataId) {
      loadEmissions(installation.installationDataId);
    }
  }, [installation?.installationDataId, loadEmissions]);

  const totalCo2eFossil = emissions.reduce((s, e) => s + (e.co2eFossil || 0), 0);
  const totalCo2eBio = emissions.reduce((s, e) => s + (e.co2eBio || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Adım 3: Gömülü Emisyonları Gözden Geçir
        </CardTitle>
        <CardDescription>
          Tesis verisindeki emisyon kaynakları
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
          </div>
        ) : emissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Emisyon verisi bulunamadı.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead className="text-right">CO2e Fosil</TableHead>
                  <TableHead className="text-right">CO2e Bio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emissions.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.sourceStream || "-"}</TableCell>
                    <TableCell>{e.type || "-"}</TableCell>
                    <TableCell>{e.method || "-"}</TableCell>
                    <TableCell className="text-right">{e.co2eFossil?.toFixed(4) || "-"}</TableCell>
                    <TableCell className="text-right">{e.co2eBio?.toFixed(4) || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-4 text-sm">
              <span><strong>Toplam CO2e Fosil:</strong> {totalCo2eFossil.toFixed(4)} tCO2e</span>
              <span><strong>Toplam CO2e Bio:</strong> {totalCo2eBio.toFixed(4)} tCO2e</span>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>Geri</Button>
          <Button onClick={nextStep}>Devam</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 4: Certificate Surrender
// ============================================================================
export function StepCertificateSurrender() {
  const {
    certificateSurrenders,
    addCertificateSurrender,
    removeCertificateSurrender,
    nextStep,
    prevStep,
  } = useDeclarationWizardStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certId, setCertId] = useState("");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    getCertificates().then(setCertificates);
  }, []);

  function handleAdd() {
    if (!certId) {
      toast.error("Sertifika seçin");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cert = certificates.find((c: any) => c.id === certId);
    addCertificateSurrender({
      certificateId: certId,
      certificateNo: cert?.certificateNo || "",
      quantity: qty,
      surrenderDate: date,
    });
    setCertId("");
    setQty(1);
  }

  const totalSurrendered = certificateSurrenders.reduce((s, c) => s + c.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Adım 4: Sertifika Teslimi Tahsisi
        </CardTitle>
        <CardDescription>
          CBAM sertifikalarını beyanname ile ilişkilendirin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add surrender form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Sertifika</Label>
            <Select value={certId} onValueChange={setCertId}>
              <SelectTrigger>
                <SelectValue placeholder="Seç" />
              </SelectTrigger>
              <SelectContent>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {certificates.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.certificateNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Adet</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tarih</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Ekle
          </Button>
        </div>

        {/* List */}
        {certificateSurrenders.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sertifika No</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Sil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificateSurrenders.map((cs, i) => (
                  <TableRow key={i}>
                    <TableCell>{cs.certificateNo}</TableCell>
                    <TableCell>{cs.quantity}</TableCell>
                    <TableCell>{new Date(cs.surrenderDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertificateSurrender(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm"><strong>Toplam teslim:</strong> {totalSurrendered} sertifika</p>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>Geri</Button>
          <Button onClick={nextStep}>Devam</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 5: Free Allocation Adjustment
// ============================================================================
export function StepFreeAllocation() {
  const {
    freeAllocations,
    addFreeAllocation,
    removeFreeAllocation,
    nextStep,
    prevStep,
  } = useDeclarationWizardStore();

  const [adjType, setAdjType] = useState("");
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjDesc, setAdjDesc] = useState("");

  function handleAdd() {
    if (!adjType || !adjAmount) {
      toast.error("Tip ve tutar zorunludur");
      return;
    }
    addFreeAllocation({
      adjustmentType: adjType,
      amount: adjAmount,
      description: adjDesc,
    });
    setAdjType("");
    setAdjAmount(0);
    setAdjDesc("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Adım 5: Ücretsiz Tahsis Düzeltmesi
        </CardTitle>
        <CardDescription>
          AB ücretsiz tahsis düzeltmelerini ekleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Tip</Label>
            <Select value={adjType} onValueChange={setAdjType}>
              <SelectTrigger>
                <SelectValue placeholder="Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEDUCTION">Düşürme</SelectItem>
                <SelectItem value="CREDIT">Kredi</SelectItem>
                <SelectItem value="ADJUSTMENT">Düzeltme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tutar (tCO2e)</Label>
            <Input
              type="number"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Açıklama</Label>
            <Input value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} />
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Ekle
          </Button>
        </div>

        {freeAllocations.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tip</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Sil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freeAllocations.map((fa, i) => (
                <TableRow key={i}>
                  <TableCell>{fa.adjustmentType}</TableCell>
                  <TableCell>{fa.amount.toLocaleString("tr-TR")}</TableCell>
                  <TableCell>{fa.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFreeAllocation(i)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>Geri</Button>
          <Button onClick={nextStep}>Devam</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 6: Verification Statement
// ============================================================================
export function StepVerification() {
  const { verification, setVerification, nextStep, prevStep } =
    useDeclarationWizardStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Adım 6: Doğrulama Beyanı
        </CardTitle>
        <CardDescription>
          Akredite doğrulayıcı bilgilerini girin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Doğrulayıcı Adı</Label>
            <Input
              value={verification.verifierName}
              onChange={(e) => setVerification({ verifierName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Akreditasyon No</Label>
            <Input
              value={verification.accreditationNo}
              onChange={(e) => setVerification({ accreditationNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Görüş</Label>
            <Select
              value={verification.opinion}
              onValueChange={(v) => setVerification({ opinion: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNQUALIFIED">Sınırsız (Unqualified)</SelectItem>
                <SelectItem value="QUALIFIED">Sınırlı (Qualified)</SelectItem>
                <SelectItem value="ADVERSE">Olumsuz (Adverse)</SelectItem>
                <SelectItem value="DISCLAIMER">Görüş Bildirmeme (Disclaimer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Doğrulama Dönemi</Label>
            <Input
              value={verification.period}
              onChange={(e) => setVerification({ period: e.target.value })}
              placeholder="örneğin: 2025-Q1 - 2025-Q4"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notlar</Label>
          <Textarea
            value={verification.notes}
            onChange={(e) => setVerification({ notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>Geri</Button>
          <Button onClick={nextStep}>Devam</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 7: Review & Submit
// ============================================================================
export function StepReviewSubmit() {
  const store = useDeclarationWizardStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalEmissions = store.emissions.reduce(
    (s, e) => s + (e.co2eFossil || 0) + (e.co2eBio || 0),
    0
  );
  const totalCerts = store.certificateSurrenders.reduce(
    (s, c) => s + c.quantity,
    0
  );

  async function handleSubmit() {
    if (!store.installation) {
      toast.error("Tesis seçilmedi");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create declaration
      const declResult = await createDeclaration({
        year: store.year,
        notes: store.notes || null,
      });

      if (declResult.error || !declResult.id) {
        toast.error(declResult.error || "Beyanname oluşturulamadı");
        setSubmitting(false);
        return;
      }

      const declarationId = declResult.id;
      store.setDeclarationId(declarationId);

      // 2. Create certificate surrenders
      for (const cs of store.certificateSurrenders) {
        await createCertificateSurrender({
          certificateId: cs.certificateId,
          declarationId,
          quantity: cs.quantity,
          surrenderDate: cs.surrenderDate,
        });
      }

      // 3. Create free allocation adjustments
      for (const fa of store.freeAllocations) {
        await createFreeAllocationAdjustment({
          declarationId,
          adjustmentType: fa.adjustmentType,
          amount: fa.amount,
          description: fa.description || null,
        });
      }

      // 4. Update status to SUBMITTED with totals
      await updateDeclaration(declarationId, {
        status: "SUBMITTED",
        submissionDate: new Date().toISOString(),
      });

      setSubmitted(true);
      toast.success("Beyanname başarıyla gönderildi!");
    } catch (error) {
      toast.error("Gönderim sırasında hata oluştu");
      console.error("Submit error:", error);
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Adım 7: İnceleme ve Gönder
        </CardTitle>
        <CardDescription>
          Tüm bilgileri son kez gözden geçirin ve beyannameyi gönderin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold text-green-700">
              Beyanname Başarıyla Gönderildi!
            </h3>
            <p className="text-muted-foreground">
              Beyanname ID: {store.declarationId}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  store.reset();
                  setSubmitted(false);
                }}
              >
                Yeni Beyanname
              </Button>
              <Button asChild>
                <a href={`/dashboard/declarations/${store.declarationId}`}>
                  Beyanname Detay
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Yıl</p>
                <p className="text-2xl font-bold">{store.year}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">İthal Mal</p>
                <p className="text-2xl font-bold">{store.goods.length}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Emisyon</p>
                <p className="text-2xl font-bold">{store.emissions.length}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Sertifika</p>
                <p className="text-2xl font-bold">{totalCerts}</p>
              </div>
            </div>

            {/* Detail */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tesis:</span>
                <span className="font-medium">{store.installation?.installationName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Şirket:</span>
                <span className="font-medium">{store.installation?.companyName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Emisyon:</span>
                <span className="font-medium">{totalEmissions.toFixed(4)} tCO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sertifika Teslimleri:</span>
                <span className="font-medium">{store.certificateSurrenders.length} işlem ({totalCerts} adet)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tahsis Düzeltmeleri:</span>
                <span className="font-medium">{store.freeAllocations.length} işlem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğrulayıcı:</span>
                <span className="font-medium">
                  {store.verification.verifierName || "-"}
                  {store.verification.opinion && (
                    <Badge variant="outline" className="ml-2">{store.verification.opinion}</Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ek Notlar</Label>
              <Textarea
                value={store.notes}
                onChange={(e) => store.setNotes(e.target.value)}
                rows={2}
                placeholder="Beyanname ile ilgili notlar..."
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={store.prevStep}>Geri</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Beyannameyi Gönder
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
