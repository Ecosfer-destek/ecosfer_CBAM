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
import { useTranslations } from "next-intl";

// ============================================================================
// Step 1: Select Installation & Year
// ============================================================================
export function StepSelectInstallation() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
      toast.error(t("selectInstallationAndPeriod"));
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
          {t("step1Title")}
        </CardTitle>
        <CardDescription>
          {t("step1Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t("reportingYear")}</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2023}
              max={2035}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("installation")}</Label>
            <Select value={selectedInstId} onValueChange={setSelectedInstId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectInstallation")} />
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
            <Label>{t("dataPeriod")}</Label>
            <Select value={selectedDataId} onValueChange={setSelectedDataId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPeriod")} />
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
              <span className="font-medium">{t("selected")}</span>{" "}
              {installation.companyName} / {installation.installationName}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={!selectedInstId || !selectedDataId}>
            {tc("next")}
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
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
          {t("step2Title")}
        </CardTitle>
        <CardDescription>
          {t("step2Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {tc("loading")}
          </div>
        ) : goods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noGoodsData")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("cnCode")}</TableHead>
                <TableHead>{t("routeType")}</TableHead>
                <TableHead>{t("routes")}</TableHead>
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
          <Button variant="outline" onClick={prevStep}>{tc("back")}</Button>
          <Button onClick={nextStep}>{tc("next")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 3: Review Embedded Emissions
// ============================================================================
export function StepReviewEmissions() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
          {t("step3Title")}
        </CardTitle>
        <CardDescription>
          {t("step3Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {tc("loading")}
          </div>
        ) : emissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noEmissionsData")}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("source")}</TableHead>
                  <TableHead>{t("emissionType")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead className="text-right">{t("co2eFossil")}</TableHead>
                  <TableHead className="text-right">{t("co2eBio")}</TableHead>
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
              <span><strong>{t("totalCo2eFossil")}</strong> {totalCo2eFossil.toFixed(4)} tCO2e</span>
              <span><strong>{t("totalCo2eBio")}</strong> {totalCo2eBio.toFixed(4)} tCO2e</span>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>{tc("back")}</Button>
          <Button onClick={nextStep}>{tc("next")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 4: Certificate Surrender
// ============================================================================
export function StepCertificateSurrender() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
      toast.error(t("selectCertificateError"));
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
          {t("step4Title")}
        </CardTitle>
        <CardDescription>
          {t("step4Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add surrender form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">{t("certificate")}</Label>
            <Select value={certId} onValueChange={setCertId}>
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
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
            <Label className="text-xs">{t("quantity")}</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{tc("date")}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {tc("add")}
          </Button>
        </div>

        {/* List */}
        {certificateSurrenders.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("certificateNo")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{tc("date")}</TableHead>
                  <TableHead className="text-right">{tc("delete")}</TableHead>
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
            <p className="text-sm"><strong>{t("totalSurrender")}</strong> {totalSurrendered} {t("certificateUnit")}</p>
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>{tc("back")}</Button>
          <Button onClick={nextStep}>{tc("next")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 5: Free Allocation Adjustment
// ============================================================================
export function StepFreeAllocation() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
      toast.error(t("typeAndAmountRequired"));
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
          {t("step5Title")}
        </CardTitle>
        <CardDescription>
          {t("step5Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">{t("adjustmentType")}</Label>
            <Select value={adjType} onValueChange={setAdjType}>
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEDUCTION">{t("deduction")}</SelectItem>
                <SelectItem value="CREDIT">{t("credit")}</SelectItem>
                <SelectItem value="ADJUSTMENT">{t("adjustment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("amount")}</Label>
            <Input
              type="number"
              step="0.01"
              value={adjAmount}
              onChange={(e) => setAdjAmount(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{tc("description")}</Label>
            <Input value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} />
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {tc("add")}
          </Button>
        </div>

        {freeAllocations.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adjustmentType")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{tc("description")}</TableHead>
                <TableHead className="text-right">{tc("delete")}</TableHead>
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
          <Button variant="outline" onClick={prevStep}>{tc("back")}</Button>
          <Button onClick={nextStep}>{tc("next")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 6: Verification Statement
// ============================================================================
export function StepVerification() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const { verification, setVerification, nextStep, prevStep } =
    useDeclarationWizardStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {t("step6Title")}
        </CardTitle>
        <CardDescription>
          {t("step6Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("verifierName")}</Label>
            <Input
              value={verification.verifierName}
              onChange={(e) => setVerification({ verifierName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("accreditationNo")}</Label>
            <Input
              value={verification.accreditationNo}
              onChange={(e) => setVerification({ accreditationNo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("opinion")}</Label>
            <Select
              value={verification.opinion}
              onValueChange={(v) => setVerification({ opinion: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNQUALIFIED">{t("opinionUnqualified")}</SelectItem>
                <SelectItem value="QUALIFIED">{t("opinionQualified")}</SelectItem>
                <SelectItem value="ADVERSE">{t("opinionAdverse")}</SelectItem>
                <SelectItem value="DISCLAIMER">{t("opinionDisclaimer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("verificationPeriod")}</Label>
            <Input
              value={verification.period}
              onChange={(e) => setVerification({ period: e.target.value })}
              placeholder={t("verificationPeriodPlaceholder")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{tc("notes")}</Label>
          <Textarea
            value={verification.notes}
            onChange={(e) => setVerification({ notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>{tc("back")}</Button>
          <Button onClick={nextStep}>{tc("next")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Step 7: Review & Submit
// ============================================================================
export function StepReviewSubmit() {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
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
      toast.error(t("installationNotSelected"));
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
        toast.error(declResult.error || t("declarationCreateError"));
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
      toast.success(t("submitSuccess"));
    } catch (error) {
      toast.error(t("submitError"));
      console.error("Submit error:", error);
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {t("step7Title")}
        </CardTitle>
        <CardDescription>
          {t("step7Desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold text-green-700">
              {t("submittedTitle")}
            </h3>
            <p className="text-muted-foreground">
              {t("declarationId")} {store.declarationId}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  store.reset();
                  setSubmitted(false);
                }}
              >
                {t("newDeclaration")}
              </Button>
              <Button asChild>
                <a href={`/dashboard/declarations/${store.declarationId}`}>
                  {t("declarationDetail")}
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("yearLabel")}</p>
                <p className="text-2xl font-bold">{store.year}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("importedGoods")}</p>
                <p className="text-2xl font-bold">{store.goods.length}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("emissionLabel")}</p>
                <p className="text-2xl font-bold">{store.emissions.length}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{t("certificateLabel")}</p>
                <p className="text-2xl font-bold">{totalCerts}</p>
              </div>
            </div>

            {/* Detail */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("installationLabel")}</span>
                <span className="font-medium">{store.installation?.installationName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("companyLabel")}</span>
                <span className="font-medium">{store.installation?.companyName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("totalEmission")}</span>
                <span className="font-medium">{totalEmissions.toFixed(4)} tCO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("certificateSurrenders")}</span>
                <span className="font-medium">{t("transactionCount", { count: store.certificateSurrenders.length, total: totalCerts })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("allocationAdjustments")}</span>
                <span className="font-medium">{t("transactionLabel", { count: store.freeAllocations.length })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("verifier")}</span>
                <span className="font-medium">
                  {store.verification.verifierName || "-"}
                  {store.verification.opinion && (
                    <Badge variant="outline" className="ml-2">{store.verification.opinion}</Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("additionalNotes")}</Label>
              <Textarea
                value={store.notes}
                onChange={(e) => store.setNotes(e.target.value)}
                rows={2}
                placeholder={t("notesPlaceholder")}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={store.prevStep}>{tc("back")}</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("submitDeclaration")}
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
