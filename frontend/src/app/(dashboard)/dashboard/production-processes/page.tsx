import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";

export default function ProductionProcessesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Üretim Süreçleri</h1>
        <p className="text-muted-foreground">
          CBAM kapsamındaki üretim süreçlerini görüntüleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Üretim Süreci Yönetimi
          </CardTitle>
          <CardDescription>
            Üretim süreçleri Tesis Verileri (InstallationData) altındaki
            &quot;D: Prosesler&quot; sekmesinden yönetilir. İlgili tesis verisini
            seçip oradaki RelevantProductionProcess tablolarını kullanın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tesis Verileri sayfasına giderek ilgili döneme ait üretim
            süreçlerini görüntüleyin ve düzenleyin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
