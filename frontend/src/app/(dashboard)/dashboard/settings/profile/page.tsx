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
import { Separator } from "@/components/ui/separator";
import { changePassword } from "@/actions/auth";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Sistem Yoneticisi",
  COMPANY_ADMIN: "Sirket Yoneticisi",
  OPERATOR: "Operator",
  SUPPLIER: "Tedarikci",
  CBAM_DECLARANT: "CBAM Beyancisi",
  VERIFIER: "Dogrulayici",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
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

  if (!session) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">Hesap bilgilerinizi goruntuleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hesap Bilgileri</CardTitle>
          <CardDescription>Kisisel bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Ad Soyad</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">E-posta</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Rol</Label>
              <p className="font-medium">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Sirket</Label>
              <p className="font-medium">{user?.tenantName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Sifre Degistir</CardTitle>
          <CardDescription>
            Hesap sifrenizi guncelleyin
          </CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Sifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
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
              />
            </div>
            <Button type="submit" disabled={isChanging}>
              {isChanging ? "Degistiriliyor..." : "Sifre Degistir"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
