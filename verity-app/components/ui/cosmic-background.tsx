"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const TOTAL_FRAMES = 10;
const FRAME_DURATION = 180; // ms per frame

export function CosmicBackground({ className }: { className?: string }) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % TOTAL_FRAMES) + 1);
    }, FRAME_DURATION);
    return () => clearInterval(interval);
  }, []);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Preload all frames */}
      {Array.from({ length: TOTAL_FRAMES }, (_, i) => {
        const frameNum = String(i + 1).padStart(4, "0");
        const isActive = i + 1 === currentFrame;
        return (
          <Image
            key={i}
            src={`/video-frames/frame-${frameNum}.png`}
            alt=""
            fill
            priority={i < 3}
            className={cn(
              "object-cover transition-opacity duration-150",
              isActive ? "opacity-100" : "opacity-0"
            )}
            onLoad={i === 0 ? handleLoad : undefined}
            sizes="100vw"
          />
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
    </div>
  );
}
