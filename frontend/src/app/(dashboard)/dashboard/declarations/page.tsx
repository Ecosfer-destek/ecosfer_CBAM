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
import { useTranslations } from "next-intl";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SUBMITTED: "outline",
  UNDER_REVIEW: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  AMENDED: "secondary",
};

export default function DeclarationsPage() {
  const t = useTranslations("declaration");
  const tc = useTranslations("common");

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
      toast.success(t("created"));
      setShowCreate(false);
      setNotes("");
      getDeclarations().then(setDeclarations);
    }
    setIsCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const result = await deleteDeclaration(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("deleted"));
      getDeclarations().then(setDeclarations);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/declarations/wizard">
              <Wand2 className="mr-2 h-4 w-4" />
              {t("wizardCreate")}
            </Link>
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("quickCreate")}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createDialog")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("year")} *</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2023}
                  max={2030}
                />
              </div>
              <div className="space-y-2">
                <Label>{tc("notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                {tc("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? tc("creating") : tc("create")}
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
            {t("declarationList")}
          </CardTitle>
          <CardDescription>
            {t("total", { count: declarations.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("year")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("totalEmissions")}</TableHead>
                <TableHead>{t("certificates")}</TableHead>
                <TableHead>{t("submissionDate")}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {declarations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("noDeclarations")}
                  </TableCell>
                </TableRow>
              ) : (
                declarations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.year}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[d.status] || "secondary"}>
                        {t(`statuses.${d.status}` as Parameters<typeof t>[0])}
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
