import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Users, Building2, Shield, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  const settingsItems = [
    {
      title: t("profile"),
      description: t("profileDesc"),
      href: "/dashboard/settings/profile",
      icon: User,
    },
    {
      title: t("userManagement"),
      description: t("userManagementDesc"),
      href: "/dashboard/settings/users",
      icon: Users,
    },
    {
      title: t("tenant"),
      description: t("tenantDesc"),
      href: "/dashboard/settings/tenant",
      icon: Globe,
    },
    {
      title: t("companySettings"),
      description: t("companySettingsDesc"),
      href: "/dashboard/companies",
      icon: Building2,
    },
    {
      title: t("security"),
      description: t("securityDesc"),
      href: "/dashboard/settings/security",
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
