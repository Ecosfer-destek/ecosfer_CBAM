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
import { Badge } from "@/components/ui/badge";
// Switch component not installed yet - use a simple checkbox-like toggle

import { Shield, Key, Clock, Monitor } from "lucide-react";
import { changePassword } from "@/actions/auth";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const t = useTranslations("settings");
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
      toast.error(t("securityPage.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("securityPage.passwordMinLength"));
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
      toast.success(t("securityPage.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setIsChanging(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">{t("securityPage.title")}</h1>
        <p className="text-muted-foreground">
          {t("securityPage.subtitle")}
        </p>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("securityPage.changePassword")}
          </CardTitle>
          <CardDescription>{t("securityPage.changePasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("securityPage.currentPassword")}</Label>
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
                <Label htmlFor="newPassword">{t("securityPage.newPassword")}</Label>
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
                <Label htmlFor="confirmNewPassword">{t("securityPage.confirmNewPassword")}</Label>
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
              {isChanging ? t("securityPage.changingPassword") : t("securityPage.changePasswordBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t("securityPage.activeSession")}
          </CardTitle>
          <CardDescription>{t("securityPage.activeSessionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">
                  {user?.name || t("securityPage.user")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="default">{t("securityPage.active")}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("securityPage.roleLabel", { role: user?.role || "-" })}
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
            {t("securityPage.securityPreferences")}
          </CardTitle>
          <CardDescription>
            {t("securityPage.securityPreferencesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t("securityPage.sessionTimeout")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("securityPage.sessionTimeoutDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{t("securityPage.sessionTimeoutValue")}</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t("securityPage.loginNotifications")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("securityPage.loginNotificationsDesc")}
              </p>
            </div>
            <Badge variant="secondary">{t("securityPage.loginNotificationsStatus")}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t("securityPage.twoFactor")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("securityPage.twoFactorDesc")}
              </p>
            </div>
            <Badge variant="secondary">{t("securityPage.twoFactorStatus")}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
