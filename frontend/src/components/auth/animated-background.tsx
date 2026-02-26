"use client";

import { useTranslations } from "next-intl";

const floatingCircles = [
  { size: 200, top: "10%", left: "10%", opacity: 0.08, delay: "0s" },
  { size: 120, top: "60%", left: "75%", opacity: 0.06, delay: "1s" },
  { size: 80, top: "30%", left: "60%", opacity: 0.1, delay: "2s" },
  { size: 150, top: "75%", left: "20%", opacity: 0.05, delay: "3s" },
  { size: 60, top: "15%", left: "80%", opacity: 0.12, delay: "4s" },
  { size: 40, top: "50%", left: "40%", opacity: 0.15, delay: "5s" },
];

export function AnimatedBackground() {
  const t = useTranslations("auth");

  return (
    <div className="hidden lg:flex relative bg-gradient-ocean animate-gradient-shift flex-col items-center justify-center overflow-hidden">
      {/* Floating circles */}
      {floatingCircles.map((circle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-float"
          style={{
            width: circle.size,
            height: circle.size,
            top: circle.top,
            left: circle.left,
            opacity: circle.opacity,
            animationDelay: circle.delay,
          }}
        />
      ))}

      {/* Centered branding content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-500 shadow-lg mb-6">
          <span className="text-3xl font-extrabold text-white leading-none">E</span>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Ecosfer
        </h1>

        <p className="text-lg text-white/80 font-medium mb-2">
          {t("brandTagline")}
        </p>

        <p className="text-sm text-white/60 max-w-xs">
          {t("brandDescription")}
        </p>
      </div>

      {/* Wave SVG at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z"
            fill="white"
            fillOpacity="0.08"
          />
          <path
            d="M0 80C240 40 480 120 720 80C960 40 1200 120 1440 80V120H0V80Z"
            fill="white"
            fillOpacity="0.05"
          />
        </svg>
      </div>
    </div>
  );
}
