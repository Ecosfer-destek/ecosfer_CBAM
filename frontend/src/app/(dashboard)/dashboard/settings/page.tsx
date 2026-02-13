import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Users, Building2, Shield, Globe } from "lucide-react";

const settingsItems = [
  {
    title: "Profil",
    description: "Hesap bilgilerinizi goruntuleyin ve sifrenizi degistirin",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    title: "Kullanici Yonetimi",
    description: "Sirketinizdeki kullanicilari yonetin",
    href: "/dashboard/settings/users",
    icon: Users,
  },
  {
    title: "Tenant Ayarlari",
    description: "Organizasyon bilgileri, dil ve bolgesel ayarlar",
    href: "/dashboard/settings/tenant",
    icon: Globe,
  },
  {
    title: "Sirket Ayarlari",
    description: "Sirket bilgilerini guncelleyin",
    href: "/dashboard/companies",
    icon: Building2,
  },
  {
    title: "Guvenlik",
    description: "Sifre degisikligi, oturum yonetimi ve erisim kontrolleri",
    href: "/dashboard/settings/security",
    icon: Shield,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Platform ayarlarini yonetin
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
