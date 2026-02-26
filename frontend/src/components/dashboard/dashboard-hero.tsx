import { Leaf, CalendarDays, ShieldCheck } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";

interface DashboardHeroProps {
  complianceScore?: number;
}

export async function DashboardHero({ complianceScore }: DashboardHeroProps) {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const now = new Date();
  const formattedDate = now.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative overflow-hidden bg-hero-gradient animate-gradient-shift rounded-xl px-6 py-8 text-white">
      {/* Decorative floating circles */}
      <div
        className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 animate-float"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-1/2 right-1/4 h-16 w-16 rounded-full bg-white/5 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute -bottom-4 left-1/3 h-20 w-20 rounded-full bg-white/8 animate-float"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="h-7 w-7 opacity-80" />
              <h1 className="text-3xl font-bold">{t("title")}</h1>
            </div>
            <p className="text-white/80 max-w-2xl">{t("subtitle")}</p>
          </div>

          <div className="flex items-center gap-4">
            {complianceScore !== undefined && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1.5 text-sm gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {complianceScore}%
              </Badge>
            )}
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CalendarDays className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
