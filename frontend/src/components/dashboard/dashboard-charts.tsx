"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ═══════════════════════════════════════════
   ScopeDonutChart
   ═══════════════════════════════════════════ */

interface ScopeDonutChartProps {
  data: { scope1: number; scope2: number; scope3: number };
  className?: string;
}

const SCOPE_COLORS = ["#1B5E20", "#0097A7", "#2196F3"] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function ScopeTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{entry.name}</p>
      <p className="text-muted-foreground">
        {entry.value.toLocaleString()} tCO2e
      </p>
    </div>
  );
}

export function ScopeDonutChart({ data, className }: ScopeDonutChartProps) {
  const chartData = useMemo(
    () => [
      { name: "Scope 1", value: data.scope1 },
      { name: "Scope 2", value: data.scope2 },
      { name: "Scope 3", value: data.scope3 },
    ],
    [data]
  );

  const total = data.scope1 + data.scope2 + data.scope3;

  return (
    <div className={cn("relative", className)}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={SCOPE_COLORS[index]} />
            ))}
          </Pie>
          <Tooltip content={<ScopeTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">tCO2e</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MonthlyBarChart
   ═══════════════════════════════════════════ */

interface MonthlyBarChartProps {
  data: { month: string; value: number }[];
  className?: string;
}

export function MonthlyBarChart({ data, className }: MonthlyBarChartProps) {
  const gradientId = "bar-gradient";

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B5E20" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1B5E20" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const item = payload[0];
              return (
                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
                  <p className="font-medium">{item.payload.month}</p>
                  <p className="text-muted-foreground">
                    {Number(item.value).toLocaleString()} tCO2e
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            fill={`url(#${gradientId})`}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ComplianceGauge
   ═══════════════════════════════════════════ */

interface ComplianceGaugeProps {
  value: number;
  className?: string;
}

export function ComplianceGauge({ value, className }: ComplianceGaugeProps) {
  const t = useTranslations("dashboard");
  const clampedValue = Math.max(0, Math.min(100, value));

  // SVG arc params for a semi-circle
  const cx = 100;
  const cy = 100;
  const radius = 80;
  const strokeWidth = 16;

  // Calculate the circumference of the semi-circle
  const semiCircumference = Math.PI * radius;

  // Fill amount
  const fillLength = (clampedValue / 100) * semiCircumference;
  const dashOffset = semiCircumference - fillLength;

  // Determine color based on value zones
  let gaugeColor: string;
  if (clampedValue < 40) {
    gaugeColor = "#F44336";
  } else if (clampedValue < 70) {
    gaugeColor = "#FF9800";
  } else {
    gaugeColor = "#4CAF50";
  }

  // Arc path (semi-circle, top half)
  const arcStartX = cx - radius;
  const arcStartY = cy;
  const arcEndX = cx + radius;
  const arcEndY = cy;

  const bgArcPath = `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 0 1 ${arcEndX} ${arcEndY}`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width="200"
        height="120"
        viewBox="0 0 200 120"
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/40"
        />
        {/* Filled arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${semiCircumference}`}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out, stroke 0.5s ease",
          }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="fill-foreground text-3xl font-bold"
          fontSize="32"
        >
          {clampedValue}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="12"
        >
          {t("complianceLabel")}
        </text>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CircularProgress
   ═══════════════════════════════════════════ */

interface CircularProgressProps {
  value: number;
  label?: string;
  color?: string;
  className?: string;
}

export function CircularProgress({
  value,
  label,
  color = "#1B5E20",
  className,
}: CircularProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out",
          }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          className="fill-foreground font-bold"
          fontSize="22"
        >
          {clampedValue}%
        </text>
      </svg>
      {label && (
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      )}
    </div>
  );
}
