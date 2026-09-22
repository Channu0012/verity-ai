"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TOTAL_FRAMES = 10;
const FRAME_DURATION = 150; // ms per frame (~6.6 fps animated cinematic sequence)

export function CosmicBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let isVisible = true;
    let lastTime = performance.now();
    let currentFrame = 0;
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Preload all 10 video frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(4, "0");
      img.src = `/video-frames/frame-${numStr}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };
      images.push(img);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Resize canvas with devicePixelRatio for crisp rendering
    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Pause animation when scrolled out of viewport to guarantee 60fps buttery scrolling
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const render = (time: number) => {
      if (isVisible && images.length > 0) {
        if (time - lastTime >= FRAME_DURATION) {
          currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
          lastTime = time;

          const activeImg = images[currentFrame];
          if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
            const cw = canvas.width;
            const ch = canvas.height;
            const iw = activeImg.naturalWidth;
            const ih = activeImg.naturalHeight;

            // Object-cover aspect ratio scaling
            const scale = Math.max(cw / iw, ch / ih);
            const sw = iw * scale;
            const sh = ih * scale;
            const sx = (cw - sw) / 2;
            const sy = (ch - sh) / 2;

            ctx.drawImage(activeImg, sx, sy, sw, sh);
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none select-none", className)}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Atmospheric depth gradients: keeps text readable while letting cosmic energy beams glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_center_transparent_0%,rgba(0,0,0,0.8)_90%] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_70%)] pointer-events-none" />
    </div>
  );
}
