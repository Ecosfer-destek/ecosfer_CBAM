"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Landmark,
  Hammer,
  Layers,
  Sprout,
  Atom,
  Zap,
  Upload,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  CBAM_SAMPLE_SECTORS,
  type CbamSampleSector,
} from "@/data/cbam-sample-data";
import {
  loadSampleDataIntoTenant,
  deleteSampleDataFromTenant,
  checkSampleDataLoaded,
} from "@/actions/cbam-reference";

const SECTOR_ICONS: Record<string, LucideIcon> = {
  Landmark,
  Hammer,
  Layers,
  Sprout,
  Atom,
  Zap,
};

export function CbamReferenceClient() {
  const t = useTranslations("cbamReference");
  const [activeTab, setActiveTab] = useState(CBAM_SAMPLE_SECTORS[0].code);
  const [loadedSectors, setLoadedSectors] = useState<Record<string, boolean>>(
    {}
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "load" | "delete";
    sectorCode: string;
    companyName: string;
  }>({ open: false, type: "load", sectorCode: "", companyName: "" });

  const checkAllSectors = useCallback(async () => {
    const results: Record<string, boolean> = {};
    for (const sector of CBAM_SAMPLE_SECTORS) {
      try {
        const { loaded } = await checkSampleDataLoaded(sector.code);
        results[sector.code] = loaded;
      } catch {
        results[sector.code] = false;
      }
    }
    setLoadedSectors(results);
  }, []);

  useEffect(() => {
    checkAllSectors();
  }, [checkAllSectors]);

  async function handleLoad(sectorCode: string) {
    setLoadingAction(sectorCode);
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const result = await loadSampleDataIntoTenant(sectorCode);

    if (result.success) {
      toast.success(t("loadSuccess"));
      setLoadedSectors((prev) => ({ ...prev, [sectorCode]: true }));
    } else {
      toast.error(result.error || t("loadError"));
    }
    setLoadingAction(null);
  }

  async function handleDelete(sectorCode: string) {
    setLoadingAction(sectorCode);
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const result = await deleteSampleDataFromTenant(sectorCode);

    if (result.success) {
      toast.success(t("deleteSuccess"));
      setLoadedSectors((prev) => ({ ...prev, [sectorCode]: false }));
    } else {
      toast.error(result.error || t("deleteError"));
    }
    setLoadingAction(null);
  }

  function formatNumber(n: number | null | undefined): string {
    if (n == null) return "-";
    return n.toLocaleString("tr-TR");
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          {CBAM_SAMPLE_SECTORS.map((sector) => {
            const Icon = SECTOR_ICONS[sector.icon] || Info;
            return (
              <TabsTrigger
                key={sector.code}
                value={sector.code}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4 hidden sm:block" />
                {t(sector.nameKey)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CBAM_SAMPLE_SECTORS.map((sector) => (
          <TabsContent
            key={sector.code}
            value={sector.code}
            className="space-y-4"
          >
            <SectorContent
              sector={sector}
              t={t}
              isLoaded={loadedSectors[sector.code] || false}
              isLoading={loadingAction === sector.code}
              formatNumber={formatNumber}
              onLoad={() =>
                setConfirmDialog({
                  open: true,
                  type: "load",
                  sectorCode: sector.code,
                  companyName: sector.company.name,
                })
              }
              onDelete={() =>
                setConfirmDialog({
                  open: true,
                  type: "delete",
                  sectorCode: sector.code,
                  companyName: sector.company.name,
                })
              }
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "load"
                ? t("loadConfirmTitle")
                : t("deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "load"
                ? t("loadConfirmDesc", {
                    company: confirmDialog.companyName,
                  })
                : t("deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              variant={
                confirmDialog.type === "delete" ? "destructive" : "default"
              }
              onClick={() => {
                if (confirmDialog.type === "load") {
                  handleLoad(confirmDialog.sectorCode);
                } else {
                  handleDelete(confirmDialog.sectorCode);
                }
              }}
              disabled={loadingAction !== null}
            >
              {loadingAction ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {confirmDialog.type === "load"
                ? t("loadToMyData")
                : t("deleteSampleData")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectorContent({
  sector,
  t,
  isLoaded,
  isLoading,
  formatNumber,
  onLoad,
  onDelete,
}: {
  sector: CbamSampleSector;
  t: (key: string, values?: Record<string, string>) => string;
  isLoaded: boolean;
  isLoading: boolean;
  formatNumber: (n: number | null | undefined) => string;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const Icon = SECTOR_ICONS[sector.icon] || Info;
  const inst = sector.installation;

  return (
    <div className="space-y-4">
      {/* Sector Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {t("sectorInfo")} - {t(sector.nameKey)}
          </CardTitle>
          <CardDescription>{t(sector.descriptionKey)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("typicalEF")}</span>
              <p className="font-medium">{sector.typicalEF}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("productionRoutes")}
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sector.productionRoutes.map((r) => (
                  <Badge key={r} variant="outline" className="text-xs">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">{t("ghgTypes")}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sector.ghgTypes.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("euRegulation")}
              </span>
              <p className="font-medium text-xs">{sector.euRegulationRef}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company & Installation Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("companyInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("companyInfo")}</span>
              <span className="font-medium">{sector.company.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("country")}</span>
              <Badge variant="outline">{sector.company.countryCode}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("address")}</span>
              <span className="text-right text-xs max-w-[200px]">
                {sector.company.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("economicActivity")}
              </span>
              <span className="text-right text-xs max-w-[200px]">
                {sector.company.economicActivity}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("installationInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("installationInfo")}
              </span>
              <span className="font-medium text-xs text-right max-w-[200px]">
                {inst.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("coordinates")}</span>
              <span className="text-xs">
                {inst.latitude}, {inst.longitude}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("reportingPeriod")}
              </span>
              <span className="text-xs">
                {inst.startDate} - {inst.endDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("goodsCategories")}
              </span>
              <div className="flex gap-1">
                {inst.goodsCategoryCodes.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("emissionsTable")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("source")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead>{t("ghg")}</TableHead>
                  <TableHead className="text-right">
                    {t("activityData")}
                  </TableHead>
                  <TableHead>{t("unit")}</TableHead>
                  <TableHead className="text-right">{t("ef")}</TableHead>
                  <TableHead className="text-right">{t("oxf")}</TableHead>
                  <TableHead className="text-right">
                    {t("co2eFossil")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inst.emissions.map((em, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs max-w-[200px]">
                      {em.sourceStreamName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          em.emissionTypeCode === "PFC"
                            ? "destructive"
                            : em.emissionTypeCode === "ES"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {em.emissionTypeCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">
                      {em.emissionMethodCode}
                    </TableCell>
                    <TableCell className="text-xs">
                      {em.typeOfGhgCode}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatNumber(em.adActivityData)}
                    </TableCell>
                    <TableCell className="text-xs">{em.adUnitCode}</TableCell>
                    <TableCell className="text-right text-xs">
                      {em.efEmissionFactor}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {em.oxfOxidationFactor ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      {formatNumber(em.co2eFossil)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Balance & GHG Balance */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("fuelBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fuelName")}</TableHead>
                  <TableHead className="text-right">
                    {t("totalInput")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("directCbam")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("forElectricity")}
                  </TableHead>
                  <TableHead className="text-right">{t("rest")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inst.fuelBalances.map((fb, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{fb.name}</TableCell>
                    <TableCell className="text-right text-xs">
                      {formatNumber(fb.totalFuelInput)} {fb.unitCode}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatNumber(fb.directFuelForCbamGoods)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatNumber(fb.fuelForElectricity)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatNumber(fb.rest)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("ghgBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {inst.ghgBalances.map((ghg, i) => (
              <div key={i} className="space-y-2 text-sm">
                <p className="font-medium">{ghg.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("totalCo2")}
                    </span>
                    <span className="text-xs">
                      {formatNumber(ghg.totalCo2Emissions)} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("biomass")}
                    </span>
                    <span className="text-xs">
                      {formatNumber(ghg.biomassEmissions)} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("n2o")}</span>
                    <span className="text-xs">
                      {formatNumber(ghg.totalN2oEmissions)} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pfc")}</span>
                    <span className="text-xs">
                      {formatNumber(ghg.totalPfcEmissions)} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("directEmissions")}
                    </span>
                    <span className="text-xs font-medium">
                      {formatNumber(ghg.totalDirectEmissions)} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("indirectEmissions")}
                    </span>
                    <span className="text-xs">
                      {formatNumber(ghg.totalIndirectEmissions)} t
                    </span>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">{t("totalEmissions")}</span>
                  <span className="font-bold">
                    {formatNumber(ghg.totalEmissions)} tCO2e
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Production Process */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("productionProcess")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("processName")}</TableHead>
                <TableHead className="text-right">
                  {t("totalProduction")}
                </TableHead>
                <TableHead className="text-right">
                  {t("marketProduction")}
                </TableHead>
                <TableHead className="text-right">
                  {t("directlyAttributable")}
                </TableHead>
                <TableHead className="text-right">
                  {t("emissionIntensity")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inst.productionProcesses.map((pp, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{pp.name}</TableCell>
                  <TableCell className="text-right text-xs">
                    {formatNumber(pp.totalProduction)}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatNumber(pp.producedForMarket)}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatNumber(pp.directlyAttributable)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs">
                    {pp.emissionIntensity.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Education Note */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("educationNote")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isLoaded ? (
          <Button onClick={onLoad} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isLoading ? t("loading") : t("loadToMyData")}
          </Button>
        ) : (
          <>
            <Badge
              variant="secondary"
              className="h-9 px-4 flex items-center text-sm"
            >
              {t("alreadyLoaded")}
            </Badge>
            <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isLoading ? t("loading") : t("deleteSampleData")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
