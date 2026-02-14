"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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

export default function ProfilePage() {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: tAuth("roles.SUPER_ADMIN"),
    COMPANY_ADMIN: tAuth("roles.COMPANY_ADMIN"),
    OPERATOR: tAuth("roles.OPERATOR"),
    SUPPLIER: tAuth("roles.SUPPLIER"),
    CBAM_DECLARANT: tAuth("roles.CBAM_DECLARANT"),
    VERIFIER: tAuth("roles.VERIFIER"),
  };

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
      toast.success(t("profilePage.passwordChanged"));
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
        <h1 className="text-3xl font-bold">{t("profilePage.title")}</h1>
        <p className="text-muted-foreground">{t("profilePage.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profilePage.accountInfo")}</CardTitle>
          <CardDescription>{t("profilePage.accountInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t("profilePage.fullName")}</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("profilePage.email")}</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("profilePage.role")}</Label>
              <p className="font-medium">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("profilePage.company")}</Label>
              <p className="font-medium">{user?.tenantName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t("profilePage.changePassword")}</CardTitle>
          <CardDescription>
            {t("profilePage.changePasswordDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("profilePage.currentPassword")}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("profilePage.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t("profilePage.confirmNewPassword")}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isChanging}>
              {isChanging ? t("profilePage.changingPassword") : t("profilePage.changePasswordBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
