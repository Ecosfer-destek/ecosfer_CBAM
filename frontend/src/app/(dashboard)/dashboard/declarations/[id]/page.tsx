"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, FileCheck, Scale, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { XmlGenerator } from "@/components/xml/xml-generator";
import {
  getDeclaration,
  updateDeclaration,
  getCertificates,
  createCertificateSurrender,
  deleteCertificateSurrender,
  createFreeAllocationAdjustment,
  deleteFreeAllocationAdjustment,
} from "@/actions/declaration";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Taslak" },
  { value: "SUBMITTED", label: "Gonderildi" },
  { value: "UNDER_REVIEW", label: "Incelemede" },
  { value: "APPROVED", label: "Onaylandi" },
  { value: "REJECTED", label: "Reddedildi" },
  { value: "AMENDED", label: "Duzeltildi" },
];

export default function DeclarationDetailPage() {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decl, setDecl] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [certificates, setCertificates] = useState<any[]>([]);

  // Surrender dialog
  const [showSurrenderDialog, setShowSurrenderDialog] = useState(false);
  const [surrenderCertId, setSurrenderCertId] = useState("");
  const [surrenderQty, setSurrenderQty] = useState(1);
  const [surrenderDate, setSurrenderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Adjustment dialog
  const [showAdjDialog, setShowAdjDialog] = useState(false);
  const [adjType, setAdjType] = useState("");
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjDesc, setAdjDesc] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  function reload() {
    if (params.id) {
      getDeclaration(params.id as string).then(setDecl);
    }
  }

  useEffect(() => {
    reload();
    getCertificates().then(setCertificates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusChange(status: string) {
    if (!decl) return;
    const result = await updateDeclaration(decl.id, { status });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Durum guncellendi");
      reload();
    }
  }

  async function handleCreateSurrender() {
    if (!decl) return;
    setIsCreating(true);
    const result = await createCertificateSurrender({
      certificateId: surrenderCertId,
      declarationId: decl.id,
      quantity: surrenderQty,
      surrenderDate,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Sertifika teslimi eklendi");
      setShowSurrenderDialog(false);
      setSurrenderCertId("");
      setSurrenderQty(1);
      reload();
    }
    setIsCreating(false);
  }

  async function handleDeleteSurrender(id: string) {
    if (!confirm("Bu sertifika teslimini silmek istediginizden emin misiniz?"))
      return;
    const result = await deleteCertificateSurrender(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Sertifika teslimi silindi");
      reload();
    }
  }

  async function handleCreateAdj() {
    if (!decl) return;
    setIsCreating(true);
    const result = await createFreeAllocationAdjustment({
      declarationId: decl.id,
      adjustmentType: adjType,
      amount: adjAmount,
      description: adjDesc || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Ucretsiz tahsis duzeltmesi eklendi");
      setShowAdjDialog(false);
      setAdjType("");
      setAdjAmount(0);
      setAdjDesc("");
      reload();
    }
    setIsCreating(false);
  }

  async function handleDeleteAdj(id: string) {
    if (!confirm("Bu duzeltmeyi silmek istediginizden emin misiniz?")) return;
    const result = await deleteFreeAllocationAdjustment(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Duzeltme silindi");
      reload();
    }
  }

  if (!decl) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/declarations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Beyanname {decl.year}</h1>
            <p className="text-muted-foreground">Yillik CBAM Beyannamesi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={decl.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* XML Generator */}
      <XmlGenerator declarationId={decl.id} />

      {/* Summary Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ozet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Yil</p>
              <p className="text-2xl font-bold">{decl.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Durum</p>
              <Badge>
                {STATUS_OPTIONS.find((s) => s.value === decl.status)?.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Emisyon</p>
              <p className="font-medium">
                {decl.totalEmissions
                  ? Number(decl.totalEmissions).toLocaleString("tr-TR") +
                    " tCO2e"
                  : "-"}
              </p>
            </div>
            {decl.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notlar</p>
                <p className="text-sm">{decl.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificate Surrenders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Sertifika Teslimleri
              </CardTitle>
              <CardDescription>
                {decl.certificateSurrenders?.length || 0} teslim
              </CardDescription>
            </div>
            <Dialog
              open={showSurrenderDialog}
              onOpenChange={setShowSurrenderDialog}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sertifika Teslimi Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Sertifika *</Label>
                    <Select
                      value={surrenderCertId}
                      onValueChange={setSurrenderCertId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sertifika secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificates.map(
                          (c: { id: string; certificateNo: string }) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.certificateNo}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Adet *</Label>
                    <Input
                      type="number"
                      value={surrenderQty}
                      onChange={(e) => setSurrenderQty(parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teslim Tarihi *</Label>
                    <Input
                      type="date"
                      value={surrenderDate}
                      onChange={(e) => setSurrenderDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowSurrenderDialog(false)}
                  >
                    Iptal
                  </Button>
                  <Button
                    onClick={handleCreateSurrender}
                    disabled={isCreating || !surrenderCertId}
                  >
                    {isCreating ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {decl.certificateSurrenders?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Teslim yok</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sertifika</TableHead>
                    <TableHead>Adet</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Islem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decl.certificateSurrenders?.map(
                    (cs: {
                      id: string;
                      quantity: number;
                      surrenderDate: Date;
                      certificate?: { certificateNo: string };
                    }) => (
                      <TableRow key={cs.id}>
                        <TableCell>
                          {cs.certificate?.certificateNo || "-"}
                        </TableCell>
                        <TableCell>{cs.quantity}</TableCell>
                        <TableCell>
                          {new Date(cs.surrenderDate).toLocaleDateString(
                            "tr-TR"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteSurrender(cs.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Free Allocation Adjustments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Tahsis Duzeltmeleri
              </CardTitle>
              <CardDescription>
                {decl.freeAllocationAdjustments?.length || 0} duzeltme
              </CardDescription>
            </div>
            <Dialog open={showAdjDialog} onOpenChange={setShowAdjDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ucretsiz Tahsis Duzeltmesi Ekle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Duzeltme Tipi *</Label>
                    <Select value={adjType} onValueChange={setAdjType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tip secin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEDUCTION">
                          Dusurme (Deduction)
                        </SelectItem>
                        <SelectItem value="CREDIT">
                          Kredi (Credit)
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          Duzeltme (Adjustment)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tutar (tCO2e) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aciklama</Label>
                    <Input
                      value={adjDesc}
                      onChange={(e) => setAdjDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdjDialog(false)}
                  >
                    Iptal
                  </Button>
                  <Button
                    onClick={handleCreateAdj}
                    disabled={isCreating || !adjType || !adjAmount}
                  >
                    {isCreating ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {decl.freeAllocationAdjustments?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Duzeltme yok</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Aciklama</TableHead>
                    <TableHead className="text-right">Islem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decl.freeAllocationAdjustments?.map(
                    (fa: {
                      id: string;
                      adjustmentType: string;
                      amount: unknown;
                      description: string | null;
                    }) => (
                      <TableRow key={fa.id}>
                        <TableCell className="font-medium">
                          {fa.adjustmentType}
                        </TableCell>
                        <TableCell>
                          {fa.amount
                            ? Number(fa.amount).toLocaleString("tr-TR")
                            : "-"}
                        </TableCell>
                        <TableCell>{fa.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteAdj(fa.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
