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
    description: "Hesap bilgilerinizi görüntüleyin ve şifrenizi değiştirin",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    title: "Kullanıcı Yönetimi",
    description: "Şirketinizdeki kullanıcıları yönetin",
    href: "/dashboard/settings/users",
    icon: Users,
  },
  {
    title: "Tenant Ayarları",
    description: "Organizasyon bilgileri, dil ve bölgesel ayarlar",
    href: "/dashboard/settings/tenant",
    icon: Globe,
  },
  {
    title: "Şirket Ayarları",
    description: "Şirket bilgilerini güncelleyin",
    href: "/dashboard/companies",
    icon: Building2,
  },
  {
    title: "Güvenlik",
    description: "Şifre değişikliği, oturum yönetimi ve erişim kontrolleri",
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
          Platform ayarlarını yönetin
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
