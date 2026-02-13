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
        <h1 className="text-3xl font-bold">Uretim Surecleri</h1>
        <p className="text-muted-foreground">
          CBAM kapsamindaki uretim sureclerini goruntuleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Uretim Sureci Yonetimi
          </CardTitle>
          <CardDescription>
            Uretim surecleri Tesis Verileri (InstallationData) altindaki
            &quot;D: Prosesler&quot; sekmesinden yonetilir. Ilgili tesis verisini
            secip oradaki RelevantProductionProcess tablolarini kullanin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tesis Verileri sayfasina giderek ilgili doneme ait uretim
            sureclerini goruntuleyin ve duzenleyin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
