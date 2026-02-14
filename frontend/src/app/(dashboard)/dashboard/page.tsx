import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Factory,
  Flame,
  FileText,
  ScrollText,
  Leaf,
  ArrowRight,
} from "lucide-react";
import { getDashboardStats, getRecentActivity } from "@/actions/dashboard";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const statStyles = [
  { border: "border-l-forest", icon: "bg-forest-subtle" },
  { border: "border-l-teal", icon: "bg-teal-subtle" },
  { border: "border-l-amber", icon: "bg-amber-subtle" },
  { border: "border-l-sky", icon: "bg-sky-subtle" },
  { border: "border-l-sage", icon: "bg-sage-subtle" },
];

function getStatusBadge(status: string | null) {
  const s = status || "DRAFT";
  switch (s) {
    case "SUBMITTED":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{s}</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-700 border-green-200">{s}</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-100 text-red-700 border-red-200">{s}</Badge>;
    default:
      return <Badge variant="outline">{s}</Badge>;
  }
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  const statCards = [
    {
      title: t("companies"),
      value: stats.companies,
      description: t("companiesDesc"),
      icon: Building2,
    },
    {
      title: t("installations"),
      value: stats.installations,
      description: t("installationsDesc"),
      icon: Factory,
    },
    {
      title: t("emissions"),
      value: stats.emissions,
      description: t("emissionsDesc"),
      icon: Flame,
    },
    {
      title: t("reports"),
      value: stats.reports,
      description: t("reportsDesc"),
      icon: FileText,
    },
    {
      title: t("declarations"),
      value: stats.declarations,
      description: t("declarationsDesc"),
      icon: ScrollText,
    },
  ];

  const quickLinks = [
    { title: t("installationDataTitle"), desc: t("installationDataDesc"), href: "/dashboard/installation-data" },
    { title: t("createReportTitle"), desc: t("createReportDesc"), href: "/dashboard/reports" },
    { title: t("aiAnalysisTitle"), desc: t("aiAnalysisDesc"), href: "/dashboard/ai-analysis" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-hero-gradient rounded-xl px-6 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Leaf className="h-7 w-7 opacity-80" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-white/80 max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <Card key={stat.title} className={`${statStyles[i].border} card-hover shadow-green`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statStyles[i].icon}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentDeclarations")}</CardTitle>
            <CardDescription>{t("recentDeclarationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentDeclarations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noDeclarations")}</p>
            ) : (
              <div className="space-y-3">
                {activity.recentDeclarations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {t("declarationYear", { year: d.year })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    {getStatusBadge(d.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentReports")}</CardTitle>
            <CardDescription>{t("recentReportsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noReports")}</p>
            ) : (
              <div className="space-y-3">
                {activity.recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.coverTitle || t("untitledReport")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quickAccess")}</CardTitle>
          <CardDescription>
            {t("quickAccessDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="group rounded-lg border p-4 card-hover cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{link.title}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {link.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
