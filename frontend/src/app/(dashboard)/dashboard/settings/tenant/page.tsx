"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, Database, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function TenantSettingsPage() {
  const [tenantName, setTenantName] = useState("");
  const [domain, setDomain] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("tr");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    // Load tenant info from API
    async function load() {
      try {
        const res = await fetch("/api/settings/tenant");
        if (res.ok) {
          const data = await res.json();
          setTenantInfo(data);
          setTenantName(data.name || "");
          setDomain(data.domain || "");
          setDefaultLanguage(data.defaultLanguage || "tr");
          setTimezone(data.timezone || "Europe/Istanbul");
        }
      } catch {
        // Will use defaults
      }
    }
    load();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tenantName,
          domain,
          defaultLanguage,
          timezone,
        }),
      });
      if (res.ok) {
        toast.success("Tenant ayarları güncellendi");
      } else {
        toast.error("Ayarlar güncellenirken hata oluştu");
      }
    } catch {
      toast.error("Ayarlar güncellenirken hata oluştu");
    }
    setIsSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Tenant Ayarları</h1>
        <p className="text-muted-foreground">
          Organizasyon ayarlarını yönetin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizasyon Bilgileri
          </CardTitle>
          <CardDescription>
            Tenant ve organizasyon yapılandırması
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organizasyon Adı</Label>
              <Input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Şirket adı"
              />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="örneğin: ecosfer.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Bölgesel Ayarlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Varsayılan Dil</Label>
              <Select
                value={defaultLanguage}
                onValueChange={setDefaultLanguage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saat Dilimi</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Istanbul">
                    Europe/Istanbul (UTC+3)
                  </SelectItem>
                  <SelectItem value="Europe/Berlin">
                    Europe/Berlin (UTC+1/+2)
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    Europe/London (UTC+0/+1)
                  </SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sistem Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Tenant ID</Label>
                <p className="font-mono text-xs mt-1">
                  {tenantInfo.id || "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Durum</Label>
                <div className="mt-1">
                  <Badge variant="default">Aktif</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Oluşturulma Tarihi
                </Label>
                <p className="mt-1">
                  {tenantInfo.createdAt
                    ? new Date(tenantInfo.createdAt).toLocaleDateString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Platform</Label>
                <p className="mt-1">Ecosfer SKDM v2.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
