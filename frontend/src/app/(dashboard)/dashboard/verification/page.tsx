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
import { useTranslations } from "next-intl";

export default function VerificationPage() {
  const t = useTranslations("verification");
  const tc = useTranslations("common");

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
      toast.success(t("planCreated"));
      setShowPlanDialog(false);
      setPlanName("");
      setPlanVersion("");
      getMonitoringPlans().then(setPlans);
    }
    setIsCreating(false);
  }

  async function handleDeletePlan(id: string) {
    if (!confirm(t("confirmDeletePlan"))) return;
    const result = await deleteMonitoringPlan(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(t("planDeleted"));
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
      toast.success(t("applicationCreated"));
      setShowAuthDialog(false);
      setAuthName("");
      setAuthType("");
      getAuthorisations().then(setAuths);
    }
    setIsCreating(false);
  }

  async function handleDeleteAuth(id: string) {
    if (!confirm(t("confirmDeleteApplication"))) return;
    const result = await deleteAuthorisation(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(t("applicationDeleted"));
      getAuthorisations().then(setAuths);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">{t("monitoringPlans")}</TabsTrigger>
          <TabsTrigger value="authorisations">{t("authorisation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {t("monitoringPlansCard")}
                </CardTitle>
                <CardDescription>{t("planCount", { count: plans.length })}</CardDescription>
              </div>
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("newPlan")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("newPlanDialog")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("planName")} *</Label>
                      <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{tc("version")}</Label>
                      <Input value={planVersion} onChange={(e) => setPlanVersion(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPlanDialog(false)}>{tc("cancel")}</Button>
                    <Button onClick={handleCreatePlan} disabled={isCreating || !planName}>
                      {isCreating ? tc("creating") : tc("create")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tc("name")}</TableHead>
                    <TableHead>{tc("version")}</TableHead>
                    <TableHead>{tc("status")}</TableHead>
                    <TableHead>{tc("createdAt")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t("noPlans")}
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
                <CardTitle>{t("authorisationCard")}</CardTitle>
                <CardDescription>{t("applicationCount", { count: auths.length })}</CardDescription>
              </div>
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("newApplication")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("newApplicationDialog")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("applicantName")} *</Label>
                      <Input value={authName} onChange={(e) => setAuthName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("applicantType")}</Label>
                      <Input value={authType} onChange={(e) => setAuthType(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAuthDialog(false)}>{tc("cancel")}</Button>
                    <Button onClick={handleCreateAuth} disabled={isCreating || !authName}>
                      {isCreating ? tc("creating") : tc("create")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("applicantName")}</TableHead>
                    <TableHead>{tc("type")}</TableHead>
                    <TableHead>{tc("status")}</TableHead>
                    <TableHead>{t("applicationNo")}</TableHead>
                    <TableHead>{tc("date")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auths.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("noApplications")}
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
