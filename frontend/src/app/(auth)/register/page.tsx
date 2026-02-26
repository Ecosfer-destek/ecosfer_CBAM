"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AnimatedBackground } from "@/components/auth/animated-background";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => setTenants(data))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUser({ name, email, password, confirmPassword, tenantId });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(tc("generalError"));
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left panel: animated background (hidden on mobile) */}
        <AnimatedBackground />

        {/* Right panel: success message */}
        <div className="relative flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <Card className="w-full max-w-md glass shadow-green animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              {/* Logo icon */}
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-500 shadow-md">
                  <span className="text-xl font-extrabold text-white leading-none">E</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">{t("registerSuccess")}</CardTitle>
              <CardDescription>
                {t("registerSuccessDesc")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Left panel: animated background (hidden on mobile) */}
      <AnimatedBackground />

      {/* Right panel: register form */}
      <div className="relative flex items-center justify-center p-6 sm:p-8 lg:p-12">
        {/* Language switcher */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSwitcher />
        </div>

        <Card className="w-full max-w-md glass shadow-green animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            {/* Logo icon */}
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-500 shadow-md">
                <span className="text-xl font-extrabold text-white leading-none">E</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t("registerTitle")}</CardTitle>
            <CardDescription>
              {t("registerSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus-lift"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus-lift"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant">{t("company")}</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("companyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus-lift"
                />
                <p className="text-xs text-muted-foreground">
                  {t("passwordHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus-lift"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("registering") : t("registerTitle")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t("login")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
