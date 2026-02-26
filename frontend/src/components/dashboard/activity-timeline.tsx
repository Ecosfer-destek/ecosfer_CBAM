"use client";

import { FileText, ScrollText, Flame, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export interface ActivityItem {
  id: string;
  type: "declaration" | "report" | "emission" | "company";
  title: string;
  date: Date;
  status?: string;
}

interface ActivityTimelineProps {
  items: ActivityItem[];
  className?: string;
}

const typeConfig: Record<
  ActivityItem["type"],
  { icon: typeof FileText; dotColor: string }
> = {
  declaration: {
    icon: ScrollText,
    dotColor: "bg-[#1B5E20]",
  },
  report: {
    icon: FileText,
    dotColor: "bg-[#0EA5E9]",
  },
  emission: {
    icon: Flame,
    dotColor: "bg-[#F59E0B]",
  },
  company: {
    icon: Building2,
    dotColor: "bg-[#0097A7]",
  },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          {status}
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          {status}
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          {status}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t("timeJustNow");
    if (diffMinutes < 60) return t("timeMinutesAgo", { count: diffMinutes });
    if (diffHours < 24) return t("timeHoursAgo", { count: diffHours });
    if (diffDays < 7) return t("timeDaysAgo", { count: diffDays });
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t("noActivities")}
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {items.map((item, index) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="relative flex gap-4 pl-8 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Dot */}
              <div
                className={cn(
                  "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-background",
                  config.dotColor
                )}
              >
                <Icon className="h-3 w-3 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.status && getStatusBadge(item.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeDate(item.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
