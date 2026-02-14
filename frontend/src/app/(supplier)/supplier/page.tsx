"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Package, FileCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSupplierSurveys, getSupplierGoods } from "@/actions/supplier";

export default function SupplierDashboardPage() {
  const t = useTranslations("supplier");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [surveys, setSurveys] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [goods, setGoods] = useState<any[]>([]);

  useEffect(() => {
    getSupplierSurveys().then(setSurveys);
    getSupplierGoods().then(setGoods);
  }, []);

  const pendingSurveys = surveys.filter((s) => s.status === "DRAFT").length;
  const submittedSurveys = surveys.filter((s) => s.status === "SUBMITTED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("portal.title")}</h1>
        <p className="text-muted-foreground">
          {t("portal.subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("portal.totalSurveys")}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{surveys.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("portal.pending")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("portal.submitted")}</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{submittedSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("portal.myGoods")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{goods.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Surveys */}
      <Card>
        <CardHeader>
          <CardTitle>{t("portal.recentSurveys")}</CardTitle>
          <CardDescription>
            {t("portal.recentSurveysDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {t("portal.noSurveys")}
            </p>
          ) : (
            <div className="space-y-3">
              {surveys.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {s.supplierGood?.name || t("portal.generalSurvey")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <Badge
                    variant={s.status === "APPROVED" ? "default" : "secondary"}
                  >
                    {t(`survey.statuses.${s.status}` as any) || s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link
              href="/supplier/surveys"
              className="text-sm text-primary hover:underline"
            >
              {t("portal.viewAll")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
