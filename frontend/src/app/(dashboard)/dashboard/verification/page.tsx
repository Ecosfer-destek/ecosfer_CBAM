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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import {
  getMonitoringPlans,
  createMonitoringPlan,
  deleteMonitoringPlan,
  getAuthorisations,
  createAuthorisation,
  deleteAuthorisation,
} from "@/actions/declaration";
import { toast } from "sonner";

export default function VerificationPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auths, setAuths] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planVersion, setPlanVersion] = useState("");
  const [authName, setAuthName] = useState("");
  const [authType, setAuthType] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    getMonitoringPlans().then(setPlans);
    getAuthorisations().then(setAuths);
  }, []);

  async function handleCreatePlan() {
    setIsCreating(true);
    const result = await createMonitoringPlan({
      name: planName,
      version: planVersion || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("İzleme planı oluşturuldu");
      setShowPlanDialog(false);
      setPlanName("");
      setPlanVersion("");
      getMonitoringPlans().then(setPlans);
    }
    setIsCreating(false);
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Bu izleme planını silmek istediğinizden emin misiniz?")) return;
    const result = await deleteMonitoringPlan(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("İzleme planı silindi");
      getMonitoringPlans().then(setPlans);
    }
  }

  async function handleCreateAuth() {
    setIsCreating(true);
    const result = await createAuthorisation({
      applicantName: authName,
      applicantType: authType || null,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Yetkilendirme başvurusu oluşturuldu");
      setShowAuthDialog(false);
      setAuthName("");
      setAuthType("");
      getAuthorisations().then(setAuths);
    }
    setIsCreating(false);
  }

  async function handleDeleteAuth(id: string) {
    if (!confirm("Bu başvuruyu silmek istediğinizden emin misiniz?")) return;
    const result = await deleteAuthorisation(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Başvuru silindi");
      getAuthorisations().then(setAuths);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doğrulama</h1>
        <p className="text-muted-foreground">
          İzleme planları ve yetkilendirme başvuruları
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">İzleme Planları</TabsTrigger>
          <TabsTrigger value="authorisations">Yetkilendirme</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  İzleme Planları
                </CardTitle>
                <CardDescription>{plans.length} plan</CardDescription>
              </div>
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni İzleme Planı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Plan Adı *</Label>
                      <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Versiyon</Label>
                      <Input value={planVersion} onChange={(e) => setPlanVersion(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPlanDialog(false)}>İptal</Button>
                    <Button onClick={handleCreatePlan} disabled={isCreating || !planName}>
                      {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Versiyon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturma</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Henüz izleme planı yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.version || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => handleDeletePlan(p.id)}>
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
        </TabsContent>

        <TabsContent value="authorisations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Yetkilendirme Başvuruları</CardTitle>
                <CardDescription>{auths.length} başvuru</CardDescription>
              </div>
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Başvuru
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Yetkilendirme Başvurusu</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Başvuran Adı *</Label>
                      <Input value={authName} onChange={(e) => setAuthName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Basvuran Tipi</Label>
                      <Input value={authType} onChange={(e) => setAuthType(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAuthDialog(false)}>İptal</Button>
                    <Button onClick={handleCreateAuth} disabled={isCreating || !authName}>
                      {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başvuran</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Başvuru No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auths.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Henüz başvuru yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    auths.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.applicantName}</TableCell>
                        <TableCell>{a.applicantType || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{a.status}</Badge>
                        </TableCell>
                        <TableCell>{a.applicationNo || "-"}</TableCell>
                        <TableCell>{new Date(a.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => handleDeleteAuth(a.id)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
