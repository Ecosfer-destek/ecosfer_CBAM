import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Factory,
  Flame,
  FileText,
  ScrollText,
  ArrowRight,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  getDashboardStats,
  getRecentActivity,
  getDashboardChartData,
} from "@/actions/dashboard";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";

import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { AnimatedCounter } from "@/components/dashboard/animated-counter";
import { Sparkline } from "@/components/dashboard/sparkline";
import { TrendBadge } from "@/components/dashboard/trend-badge";
import {
  ScopeDonutChart,
  MonthlyBarChart,
  ComplianceGauge,
  CircularProgress,
} from "@/components/dashboard/dashboard-charts";
import {
  ActivityTimeline,
  type ActivityItem,
} from "@/components/dashboard/activity-timeline";

const statStyles = [
  {
    border: "border-l-forest",
    icon: "bg-forest-subtle",
    sparkColor: "#1B5E20",
  },
  { border: "border-l-teal", icon: "bg-teal-subtle", sparkColor: "#0097A7" },
  { border: "border-l-amber", icon: "bg-amber-subtle", sparkColor: "#F59E0B" },
  { border: "border-l-sky", icon: "bg-sky-subtle", sparkColor: "#0EA5E9" },
  { border: "border-l-sage", icon: "bg-sage-subtle", sparkColor: "#6B8F71" },
];

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const [stats, activity, chartData] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getDashboardChartData(),
  ]);

  const statCards = [
    {
      title: t("companies"),
      value: stats.companies,
      description: t("companiesDesc"),
      icon: Building2,
      sparkline: chartData.sparklines.companies,
      trend: chartData.trends.companies,
      positive: true,
    },
    {
      title: t("installations"),
      value: stats.installations,
      description: t("installationsDesc"),
      icon: Factory,
      sparkline: chartData.sparklines.installations,
      trend: chartData.trends.installations,
      positive: true,
    },
    {
      title: t("emissions"),
      value: stats.emissions,
      description: t("emissionsDesc"),
      icon: Flame,
      sparkline: chartData.sparklines.emissions,
      trend: chartData.trends.emissions,
      positive: false,
    },
    {
      title: t("reports"),
      value: stats.reports,
      description: t("reportsDesc"),
      icon: FileText,
      sparkline: chartData.sparklines.reports,
      trend: chartData.trends.reports,
      positive: true,
    },
    {
      title: t("declarations"),
      value: stats.declarations,
      description: t("declarationsDesc"),
      icon: ScrollText,
      sparkline: chartData.sparklines.declarations,
      trend: chartData.trends.declarations,
      positive: true,
    },
  ];

  // Build activity timeline items from both declarations and reports
  const timelineItems: ActivityItem[] = [
    ...activity.recentDeclarations.map((d) => ({
      id: `decl-${d.id}`,
      type: "declaration" as const,
      title: t("declarationYear", { year: d.year }),
      date: new Date(d.createdAt),
      status: d.status ?? undefined,
    })),
    ...activity.recentReports.map((r) => ({
      id: `report-${r.id}`,
      type: "report" as const,
      title: r.coverTitle || t("untitledReport"),
      date: new Date(r.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const quickLinks = [
    {
      title: t("installationDataTitle"),
      desc: t("installationDataDesc"),
      href: "/dashboard/installation-data",
      color: "#1B5E20",
    },
    {
      title: t("createReportTitle"),
      desc: t("createReportDesc"),
      href: "/dashboard/reports",
      color: "#0097A7",
    },
    {
      title: t("aiAnalysisTitle"),
      desc: t("aiAnalysisDesc"),
      href: "/dashboard/ai-analysis",
      color: "#2196F3",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <DashboardHero complianceScore={chartData.complianceScore} />

      {/* Stat cards with animated counters, trends, and sparklines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <Card
            key={stat.title}
            className={`${statStyles[i].border} card-hover shadow-green`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${statStyles[i].icon}`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <AnimatedCounter
                  value={stat.value}
                  className="text-2xl font-bold"
                />
                <TrendBadge value={stat.trend} positive={stat.positive} />
              </div>
              <CardDescription>{stat.description}</CardDescription>
              <Sparkline
                data={stat.sparkline}
                color={statStyles[i].sparkColor}
                height={36}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row: Scope Donut + Monthly Bar | Compliance Gauge + Circular Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column: Charts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t("scopeDistributionTitle")}</CardTitle>
              </div>
              <CardDescription>
                {t("scopeDistributionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScopeDonutChart data={chartData.scopeDistribution} />
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#1B5E20]" />
                  <span className="text-xs text-muted-foreground">Scope 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#0097A7]" />
                  <span className="text-xs text-muted-foreground">Scope 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#2196F3]" />
                  <span className="text-xs text-muted-foreground">Scope 3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t("monthlyEmissionsTitle")}</CardTitle>
              </div>
              <CardDescription>
                {t("monthlyEmissionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={chartData.monthlyEmissions.map(item => ({ ...item, month: new Date(2024, item.month - 1, 1).toLocaleDateString(locale, { month: "short" }) }))} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Gauges */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t("complianceScoreTitle")}</CardTitle>
              </div>
              <CardDescription>{t("complianceScoreDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-4">
              <ComplianceGauge value={chartData.complianceScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t("targetProgressTitle")}</CardTitle>
              </div>
              <CardDescription>
                {t("targetProgressDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-4">
              <CircularProgress
                value={chartData.targetProgress}
                label={t("targetCompletionLabel")}
                color="#0097A7"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline + Quick Access */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("recentActivitiesTitle")}</CardTitle>
            </div>
            <CardDescription>
              {t("recentActivitiesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={timelineItems} />
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickAccess")}</CardTitle>
            <CardDescription>{t("quickAccessDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="group relative overflow-hidden rounded-lg border p-4 card-gradient-hover cursor-pointer">
                    {/* Colored corner triangle decoration */}
                    <div
                      className="absolute top-0 right-0 h-12 w-12 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{
                        background: `linear-gradient(225deg, ${link.color} 50%, transparent 50%)`,
                      }}
                    />
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{link.title}</h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
