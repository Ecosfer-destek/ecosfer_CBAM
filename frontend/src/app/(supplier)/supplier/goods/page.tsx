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
import { Plus, Trash2, Package } from "lucide-react";
import {
  getSupplierGoods,
  createSupplierGood,
  deleteSupplierGood,
} from "@/actions/supplier";
import { toast } from "sonner";

export default function SupplierGoodsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [goods, setGoods] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [cnCode, setCnCode] = useState("");
  const [description, setDescription] = useState("");

  function reload() {
    getSupplierGoods().then(setGoods);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Mal adı zorunludur");
      return;
    }
    setIsCreating(true);
    const result = await createSupplierGood({
      name: name.trim(),
      code: code || null,
      cnCode: cnCode || null,
      description: description || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Mal oluşturuldu");
      setShowCreate(false);
      setName("");
      setCode("");
      setCnCode("");
      setDescription("");
      reload();
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu malı silmek istediğinizden emin misiniz?")) return;
    const result = await deleteSupplierGood(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Mal silindi");
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mallarım</h1>
          <p className="text-muted-foreground">
            CBAM kapsamındaki mallarınızı yönetin
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Mal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Mal Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mal Adı *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örneğin: Çelik Levha"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kod</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="örneğin: STL-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CN Kodu</Label>
                  <Input
                    value={cnCode}
                    onChange={(e) => setCnCode(e.target.value)}
                    placeholder="örneğin: 7208 10 00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Mal hakkında açıklama"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mal Listem
          </CardTitle>
          <CardDescription>Toplam {goods.length} mal</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mal Adı</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>CN Kodu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Henüz malınız bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                goods.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.code || "-"}</TableCell>
                    <TableCell>{g.cnCode || "-"}</TableCell>
                    <TableCell>
                      {g.goodsCategory?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(g.id)}
                      >
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
