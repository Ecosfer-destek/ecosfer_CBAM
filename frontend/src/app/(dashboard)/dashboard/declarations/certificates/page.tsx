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
import { useTranslations } from "next-intl";

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const tc = useTranslations("common");

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
      toast.success(t("created"));
      setShowCreate(false);
      setCertNo("");
      setPrice("");
      setQuantity(1);
      getCertificates().then(setCertificates);
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const result = await deleteCertificate(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(t("deleted"));
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
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("newCertificate")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("newCertificateDialog")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("certificateNo")} *</Label>
                <Input value={certNo} onChange={(e) => setCertNo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("issueDate")} *</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("expiryDate")}</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("price")}</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("quantity")}</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} min={1} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>{tc("cancel")}</Button>
              <Button onClick={handleCreate} disabled={isCreating || !certNo}>
                {isCreating ? tc("creating") : tc("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("total", { count: certificates.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("certificateNo")}</TableHead>
                <TableHead>{t("issueDate")}</TableHead>
                <TableHead>{t("expiryDate")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead>{t("surrender")}</TableHead>
                <TableHead className="text-right">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {t("noCertificates")}
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
                        {c.status === "ACTIVE" ? t("statusActive") : c.status === "SURRENDERED" ? t("statusSurrendered") : c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{t("surrenderCount", { count: c.surrenders?.length || 0 })}</TableCell>
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
