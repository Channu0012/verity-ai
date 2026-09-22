"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FloatingPathsBackground({
  position = 1,
  children,
  className,
}: {
  position?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const gradientId = useId();

  // 16 refined, elegant paths (instead of 36 thick lines) for a clean, futuristic particle beam feel
  const paths = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    d: `M-${280 - i * 8 * position} -${120 + i * 8}C-${
      280 - i * 8 * position
    } -${120 + i * 8} -${220 - i * 8 * position} ${180 - i * 6} ${
      120 - i * 8 * position
    } ${280 - i * 6}C${480 - i * 8 * position} ${400 - i * 6} ${
      560 - i * 8 * position
    } ${750 - i * 6} ${560 - i * 8 * position} ${750 - i * 6}`,
    width: 0.75 + i * 0.05,
    opacity: 0.04 + (i * 0.008),
  }));

  return (
    <div className={cn("w-full relative overflow-hidden", className)}>
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 696 316"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke={`url(#${gradientId})`}
              strokeWidth={path.width}
              strokeOpacity={path.opacity}
              initial={{ pathLength: 0.2, opacity: 0.3 }}
              animate={{
                pathLength: [0.2, 0.9, 0.2],
                opacity: [0.15, 0.35, 0.15],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: 18 + (path.id * 1.5),
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </svg>
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
