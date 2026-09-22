"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.9; // Smooth, cinematic cadence
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: muted video will play on first interaction
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* Deep space base layer */}
      <div className="absolute inset-0 bg-black" />

      {/* Direct Native Video Element */}
      <video
        ref={videoRef}
        src="/verity-hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover scale-[1.08] transition-opacity duration-1000 ${
          isLoaded ? "opacity-90" : "opacity-0"
        }`}
        style={{
          filter: "contrast(1.1) brightness(0.95)",
        }}
      />

      {/* Top ambient navigation fade */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent" />

      {/* Radial center glow focusing eye on the accretion disk */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.65)_85%,#000000_100%)]" />

      {/* Bottom seamless blend into next sections */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent" />

      {/* Bottom-right watermark eraser gradient (erases any AI watermark seamlessly) */}
      <div className="absolute bottom-0 right-0 w-44 h-24 bg-gradient-to-tl from-black via-black/95 to-transparent z-10" />
      {/* Bottom-left corner clean blend */}
      <div className="absolute bottom-0 left-0 w-44 h-24 bg-gradient-to-tr from-black via-black/95 to-transparent z-10" />

      {/* Subtle digital grid lines for high-tech precision research aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
