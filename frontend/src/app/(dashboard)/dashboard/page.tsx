import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Factory, Flame, FileText, ScrollText } from "lucide-react";
import { getDashboardStats, getRecentActivity } from "@/actions/dashboard";

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  const statCards = [
    {
      title: "Şirketler",
      value: stats.companies,
      description: "Toplam şirket",
      icon: Building2,
    },
    {
      title: "Tesisler",
      value: stats.installations,
      description: "Toplam tesis",
      icon: Factory,
    },
    {
      title: "Emisyonlar",
      value: stats.emissions,
      description: "Toplam emisyon kaydı",
      icon: Flame,
    },
    {
      title: "Raporlar",
      value: stats.reports,
      description: "Toplam rapor",
      icon: FileText,
    },
    {
      title: "Beyannameler",
      value: stats.declarations,
      description: "Toplam beyanname",
      icon: ScrollText,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ecosfer SKDM Platform - Sürdürülebilirlik Veri Yönetimi
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Beyannameler</CardTitle>
            <CardDescription>En son oluşturulan beyannameler</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentDeclarations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz beyanname yok</p>
            ) : (
              <div className="space-y-3">
                {activity.recentDeclarations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Beyanname {d.year}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <Badge variant="outline">{d.status || "DRAFT"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Raporlar</CardTitle>
            <CardDescription>En son oluşturulan raporlar</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz rapor yok</p>
            ) : (
              <div className="space-y-3">
                {activity.recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.coverTitle || "İsimsiz Rapor"}
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

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Erişim</CardTitle>
          <CardDescription>
            CBAM Sürdürülebilirlik Veri Yönetim Platformu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-1">Tesis Verileri</h3>
              <p className="text-sm text-muted-foreground">
                Excel dosyalarınızı yükleyin veya tesis verilerini giriş yapın.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-1">Rapor Oluştur</h3>
              <p className="text-sm text-muted-foreground">
                CBAM beyannameleri ve PDF raporları oluşturun.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-1">AI Analiz</h3>
              <p className="text-sm text-muted-foreground">
                Yapay zeka destekli emisyon analizi ve tahminleri görün.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
