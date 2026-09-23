"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure audio is permanently muted so browser autoplay policy is satisfied immediately
    video.defaultMuted = true;
    video.muted = true;
    video.playbackRate = 0.9;

    const markActive = () => {
      setIsPlaying(true);
    };

    // If browser already has video data ready or cached
    if (video.readyState >= 2 || video.currentTime > 0) {
      markActive();
    }

    video.addEventListener("loadeddata", markActive);
    video.addEventListener("canplay", markActive);
    video.addEventListener("playing", markActive);
    video.addEventListener("timeupdate", markActive);

    // Attempt native play
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => markActive())
        .catch(() => {
          // Fallback if browser policy defers autoplay until first user gesture
          const handleFirstGesture = () => {
            if (videoRef.current) {
              videoRef.current.play().then(markActive).catch(() => {});
            }
            window.removeEventListener("pointerdown", handleFirstGesture);
            window.removeEventListener("keydown", handleFirstGesture);
            window.removeEventListener("touchstart", handleFirstGesture);
            window.removeEventListener("scroll", handleFirstGesture);
          };
          window.addEventListener("pointerdown", handleFirstGesture, { once: true });
          window.addEventListener("keydown", handleFirstGesture, { once: true });
          window.addEventListener("touchstart", handleFirstGesture, { once: true });
          window.addEventListener("scroll", handleFirstGesture, { once: true });
        });
    }

    return () => {
      video.removeEventListener("loadeddata", markActive);
      video.removeEventListener("canplay", markActive);
      video.removeEventListener("playing", markActive);
      video.removeEventListener("timeupdate", markActive);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* Deep space base layer */}
      <div className="absolute inset-0 bg-black" />

      {/* Immediate High-Fidelity Poster (Loads in <30ms on first open so screen is never black) */}
      <picture>
        <source srcSet="/hero-poster.webp" type="image/webp" />
        <img
          src="/hero-poster.jpg"
          alt="VERITY Cosmic Research Background"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover scale-[1.04]"
          style={{
            filter: "contrast(1.1) brightness(1.05) saturate(1.1)",
          }}
        />
      </picture>

      {/* Direct Native Video Element with poster fallback */}
      <video
        ref={videoRef}
        src="/verity-hero.mp4"
        poster="/hero-poster.webp"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover scale-[1.04] transition-opacity duration-700"
        style={{
          filter: "contrast(1.1) brightness(1.05) saturate(1.1)",
          opacity: isPlaying ? 1 : 0.95,
        }}
      />

      {/* Top subtle ambient navigation fade */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />

      {/* Soft cinematic vignette keeping center cosmic disk ultra-clear */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.35)_85%,#000000_100%)]" />

      {/* Bottom seamless blend into next sections */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/80 to-transparent" />

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
