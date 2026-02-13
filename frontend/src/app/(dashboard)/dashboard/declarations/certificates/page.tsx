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
import { ArrowLeft, Plus, Trash2, Award } from "lucide-react";
import Link from "next/link";
import { getCertificates, createCertificate, deleteCertificate } from "@/actions/declaration";
import { toast } from "sonner";

export default function CertificatesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [certificates, setCertificates] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [certNo, setCertNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getCertificates().then(setCertificates);
  }, []);

  async function handleCreate() {
    setIsCreating(true);
    const result = await createCertificate({
      certificateNo: certNo,
      issueDate,
      expiryDate: expiryDate || null,
      pricePerTonne: price ? parseFloat(price) : null,
      quantity,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Sertifika oluşturuldu");
      setShowCreate(false);
      setCertNo("");
      setPrice("");
      setQuantity(1);
      getCertificates().then(setCertificates);
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu sertifikayı silmek istediğinizden emin misiniz?")) return;
    const result = await deleteCertificate(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Sertifika silindi");
      getCertificates().then(setCertificates);
    }
  }

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
            <h1 className="text-3xl font-bold">CBAM Sertifikaları</h1>
            <p className="text-muted-foreground">
              CBAM sertifikalarını yönetin
            </p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Sertifika
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni CBAM Sertifikası</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sertifika No *</Label>
                <Input value={certNo} onChange={(e) => setCertNo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Verilme Tarihi *</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Son Geçerlilik</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fiyat (EUR/tCO2)</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Adet</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} min={1} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>İptal</Button>
              <Button onClick={handleCreate} disabled={isCreating || !certNo}>
                {isCreating ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Sertifikalar
          </CardTitle>
          <CardDescription>Toplam {certificates.length} sertifika</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sertifika No</TableHead>
                <TableHead>Verilme Tarihi</TableHead>
                <TableHead>Son Geçerlilik</TableHead>
                <TableHead>Fiyat (EUR/tCO2)</TableHead>
                <TableHead>Adet</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Teslimat</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Henüz sertifika bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.certificateNo}</TableCell>
                    <TableCell>{new Date(c.issueDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("tr-TR") : "-"}
                    </TableCell>
                    <TableCell>
                      {c.pricePerTonne ? Number(c.pricePerTonne).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                    </TableCell>
                    <TableCell>{c.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                        {c.status === "ACTIVE" ? "Aktif" : c.status === "SURRENDERED" ? "Teslim Edildi" : c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.surrenders?.length || 0} teslim</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
