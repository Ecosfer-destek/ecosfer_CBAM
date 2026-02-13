"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
// Switch component not installed yet - use a simple checkbox-like toggle

import { Shield, Key, Clock, Monitor } from "lucide-react";
import { changePassword } from "@/actions/auth";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Yeni sifreler eslesmemektedir");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Sifre en az 8 karakter olmalidir");
      return;
    }
    setIsChanging(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Sifre basariyla degistirildi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setIsChanging(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Guvenlik</h1>
        <p className="text-muted-foreground">
          Guvenlik ayarlari ve erisim kontrolu
        </p>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sifre Degistir
          </CardTitle>
          <CardDescription>Hesap sifrenizi guncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Sifre</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Sifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Yeni Sifre Tekrar</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <Button type="submit" disabled={isChanging}>
              {isChanging ? "Degistiriliyor..." : "Sifre Degistir"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Aktif Oturum
          </CardTitle>
          <CardDescription>Mevcut oturum bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">
                  {user?.name || "Kullanici"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="default">Aktif</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Rol: {user?.role || "-"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Guvenlik Tercihleri
          </CardTitle>
          <CardDescription>
            Ek guvenlik yapilandirmalari
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Oturum Zaman Asimi
              </p>
              <p className="text-xs text-muted-foreground">
                Belirli sure sonra otomatik cikis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">30 dakika</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Giris Bildirimleri
              </p>
              <p className="text-xs text-muted-foreground">
                Yeni giris yapildiginda e-posta bildirim
              </p>
            </div>
            <Badge variant="secondary">Kapali</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Iki Faktorlu Dogrulama (2FA)
              </p>
              <p className="text-xs text-muted-foreground">
                Ek guvenlik katmani (yakin zamanda)
              </p>
            </div>
            <Badge variant="secondary">Yakin Zamanda</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
