"use client";

import { useEffect, useState } from "react";
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
  Plus,
  Trash2,
  Users,
  Eye,
  Mail,
  ClipboardList,
  Package,
} from "lucide-react";
import {
  getSuppliers,
  createSupplier,
  deleteSupplier,
  inviteSupplier,
  getSupplierSurveys,
} from "@/actions/supplier";
import { getCountries } from "@/actions/reference-data";
import { getCompanies } from "@/actions/company";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const INVITATION_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  INVITED: "Davet Edildi",
  REGISTERED: "Kayit Oldu",
  ACTIVE: "Aktif",
};

const INVITATION_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  INVITED: "outline",
  REGISTERED: "default",
  ACTIVE: "default",
};

export default function SuppliersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countries, setCountries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [supplierSurveys, setSupplierSurveys] = useState<any[]>([]);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [countryId, setCountryId] = useState("");
  const [companyId, setCompanyId] = useState("");

  function reload() {
    getSuppliers().then(setSuppliers);
  }

  useEffect(() => {
    reload();
    getCountries().then(setCountries);
    getCompanies().then(setCompanies);
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Tedarikci adi zorunludur");
      return;
    }
    setIsCreating(true);
    const result = await createSupplier({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
      contactPerson: contactPerson || null,
      taxNumber: taxNumber || null,
      taxOffice: taxOffice || null,
      countryId: countryId || null,
      companyId: companyId || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tedarikci olusturuldu");
      setShowCreate(false);
      resetForm();
      reload();
    }
    setIsCreating(false);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setContactPerson("");
    setTaxNumber("");
    setTaxOffice("");
    setCountryId("");
    setCompanyId("");
  }

  async function handleInvite(id: string) {
    const result = await inviteSupplier(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Davet gonderildi");
      reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu tedarikciyi silmek istediginizden emin misiniz?")) return;
    const result = await deleteSupplier(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Tedarikci silindi");
      reload();
    }
  }

  async function handleViewDetail(supplierId: string) {
    const surveys = await getSupplierSurveys(supplierId);
    setSupplierSurveys(surveys);
    const sup = suppliers.find((s) => s.id === supplierId);
    setSelectedSupplier(sup);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tedarikciler</h1>
          <p className="text-muted-foreground">
            Tedarikci yonetimi ve CBAM emisyon anketleri
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tedarikci
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Tedarikci</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Tedarikci Adi *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sirket adi"
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="iletisim@firma.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 xxx xxx xx xx"
                />
              </div>
              <div className="space-y-2">
                <Label>Yetkili Kisi</Label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="space-y-2">
                <Label>Vergi Numarasi</Label>
                <Input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vergi Dairesi</Label>
                <Input
                  value={taxOffice}
                  onChange={(e) => setTaxOffice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ulke</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ulke secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {countries.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sirket</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sirket secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Adres</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Iptal
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Olusturuluyor..." : "Olustur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Supplier List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tedarikci Listesi
          </CardTitle>
          <CardDescription>Toplam {suppliers.length} tedarikci</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tedarikci</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Ulke</TableHead>
                <TableHead>Anket</TableHead>
                <TableHead>Mal</TableHead>
                <TableHead>Davet Durumu</TableHead>
                <TableHead className="text-right">Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Henuz tedarikci bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                suppliers.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.contactPerson && (
                          <p className="text-xs text-muted-foreground">
                            {s.contactPerson}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.email || "-"}
                    </TableCell>
                    <TableCell>{s.country?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <ClipboardList className="h-3 w-3" />
                        {s._count?.supplierSurveys || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Package className="h-3 w-3" />
                        {s._count?.supplierGoods || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          INVITATION_VARIANTS[s.invitationStatus] || "secondary"
                        }
                      >
                        {INVITATION_LABELS[s.invitationStatus] ||
                          s.invitationStatus ||
                          "Bekliyor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetail(s.id)}
                          title="Detay"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {s.email &&
                          (!s.invitationStatus ||
                            s.invitationStatus === "PENDING") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInvite(s.id)}
                              title="Davet Gonder"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Davet
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          title="Sil"
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

      {/* Supplier Detail Dialog */}
      <Dialog
        open={!!selectedSupplier}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier?.name} - Detay
            </DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              {/* Supplier Info */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">E-posta</p>
                  <p className="font-medium">
                    {selectedSupplier.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">
                    {selectedSupplier.phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ulke</p>
                  <p className="font-medium">
                    {selectedSupplier.country?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Yetkili</p>
                  <p className="font-medium">
                    {selectedSupplier.contactPerson || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vergi No</p>
                  <p className="font-medium">
                    {selectedSupplier.taxNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Davet Durumu</p>
                  <Badge
                    variant={
                      INVITATION_VARIANTS[
                        selectedSupplier.invitationStatus
                      ] || "secondary"
                    }
                  >
                    {INVITATION_LABELS[
                      selectedSupplier.invitationStatus
                    ] || "Bekliyor"}
                  </Badge>
                </div>
              </div>

              {/* Surveys */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Emisyon Anketleri ({supplierSurveys.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  {supplierSurveys.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Henuz anket yok
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {supplierSurveys.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (survey: any) => (
                          <div
                            key={survey.id}
                            className="flex items-center justify-between border rounded p-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {survey.supplierGood?.name || "Genel"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {survey.reportingPeriodStart
                                  ? new Date(
                                      survey.reportingPeriodStart
                                    ).toLocaleDateString("tr-TR")
                                  : "-"}{" "}
                                -{" "}
                                {survey.reportingPeriodEnd
                                  ? new Date(
                                      survey.reportingPeriodEnd
                                    ).toLocaleDateString("tr-TR")
                                  : "-"}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  survey.status === "APPROVED"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {survey.status === "DRAFT"
                                  ? "Taslak"
                                  : survey.status === "SUBMITTED"
                                    ? "Gonderildi"
                                    : survey.status === "APPROVED"
                                      ? "Onaylandi"
                                      : survey.status}
                              </Badge>
                              {survey.specificEmbeddedEmissions && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Number(
                                    survey.specificEmbeddedEmissions
                                  ).toFixed(4)}{" "}
                                  tCO2e/t
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSupplier(null)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
