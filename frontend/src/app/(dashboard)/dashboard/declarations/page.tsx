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
import { Plus, Eye, Trash2, Globe, Wand2 } from "lucide-react";
import Link from "next/link";
import {
  getDeclarations,
  createDeclaration,
  deleteDeclaration,
} from "@/actions/declaration";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  SUBMITTED: "Gönderildi",
  UNDER_REVIEW: "İncelemede",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  AMENDED: "Düzeltildi",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SUBMITTED: "outline",
  UNDER_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  AMENDED: "secondary",
};

export default function DeclarationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getDeclarations().then(setDeclarations);
  }, []);

  async function handleCreate() {
    setIsCreating(true);
    const result = await createDeclaration({ year, notes: notes || null });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Beyanname oluşturuldu");
      setShowCreate(false);
      setNotes("");
      getDeclarations().then(setDeclarations);
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu beyannameyi silmek istediğinizden emin misiniz?")) return;
    const result = await deleteDeclaration(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Beyanname silindi");
      getDeclarations().then(setDeclarations);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yıllık Beyannameler</h1>
          <p className="text-muted-foreground">
            CBAM yıllık beyannamelerini yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/declarations/wizard">
              <Wand2 className="mr-2 h-4 w-4" />
              Sihirbaz ile Oluştur
            </Link>
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Hızlı Oluştur
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Yıllık Beyanname</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Yıl *</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2023}
                  max={2030}
                />
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Beyannameler
          </CardTitle>
          <CardDescription>
            Toplam {declarations.length} beyanname
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Yıl</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Toplam Emisyon</TableHead>
                <TableHead>Sertifika</TableHead>
                <TableHead>Gönderim Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {declarations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Henüz beyanname bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                declarations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.year}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[d.status] || "secondary"}>
                        {STATUS_LABELS[d.status] || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.totalEmissions
                        ? Number(d.totalEmissions).toLocaleString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>{d.totalCertificates || "-"}</TableCell>
                    <TableCell>
                      {d.submissionDate
                        ? new Date(d.submissionDate).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/dashboard/declarations/${d.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(d.id)}
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
    </div>
  );
}
