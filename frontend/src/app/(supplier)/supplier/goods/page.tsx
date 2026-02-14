"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("supplier");
  const tCommon = useTranslations("common");
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
      toast.error(t("portal.goodNameRequired"));
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
      toast.success(t("portal.goodCreated"));
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
    if (!confirm(t("portal.goodDeleteConfirm"))) return;
    const result = await deleteSupplierGood(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(t("portal.goodDeleted"));
      reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("portal.goodsTitle")}</h1>
          <p className="text-muted-foreground">
            {t("portal.goodsSubtitle")}
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("portal.newGood")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("portal.newGoodDialog")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("portal.goodName")} *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("portal.goodNamePlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("portal.code")}</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t("portal.codePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("portal.cnCode")}</Label>
                  <Input
                    value={cnCode}
                    onChange={(e) => setCnCode(e.target.value)}
                    placeholder={t("portal.cnCodePlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tCommon("description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder={t("portal.descriptionPlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? tCommon("creating") : tCommon("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("portal.goodsList")}
          </CardTitle>
          <CardDescription>{t("portal.goodsTotal", { count: goods.length })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("portal.goodName")}</TableHead>
                <TableHead>{t("portal.code")}</TableHead>
                <TableHead>{t("portal.cnCode")}</TableHead>
                <TableHead>{t("portal.category")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("portal.noGoods")}
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
