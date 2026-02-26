"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  value: number;
  positive?: boolean;
  className?: string;
}

export function TrendBadge({
  value,
  positive = true,
  className,
}: TrendBadgeProps) {
  const isUp = value >= 0;
  // When positive=true, going up is good (green). When positive=false (e.g. emissions), going up is bad (red).
  const isGood = positive ? isUp : !isUp;

  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isGood
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </span>
  );
}
