"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, Sparkles, FastForward } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

interface AudioBriefingPlayerProps {
  script: string;
  title?: string;
  sourcesCount?: number;
}

export function AudioBriefingPlayer({
  script,
  title = "Executive Briefing",
  sourcesCount = 3,
}: AudioBriefingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [supported, setSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Update playback rate when user toggles speed
  useEffect(() => {
    if (isPlaying && synthRef.current) {
      // Re-trigger with new speed
      synthRef.current.cancel();
      startPlayback(speed);
    }
  }, [speed]);

  const getBestVoice = (): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    // Prioritize high-quality natural English voices
    const naturalEnVoice = voices.find(
      (v) =>
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Neural")) &&
        v.lang.startsWith("en")
    );
    return naturalEnVoice || voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
  };

  const startPlayback = (currentSpeed = speed) => {
    if (!synthRef.current || !script) return;
    synthRef.current.cancel();

    const u = new SpeechSynthesisUtterance(script);
    u.rate = currentSpeed;
    u.pitch = 1.0;

    const voice = getBestVoice();
    if (voice) u.voice = voice;

    u.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    u.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    u.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = u;
    synthRef.current.speak(u);
  };

  const handleTogglePlay = () => {
    if (!synthRef.current) return;

    if (isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    } else {
      startPlayback(speed);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  if (!supported) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-500/25 bg-gradient-to-r from-sky-950/20 via-background/60 to-primary/10 p-3 sm:p-4 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-sky-500/40">
      {/* Background glowing aura */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Info & Waveform */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isPlaying && !isPaused
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                : "bg-muted/40 text-muted-foreground border border-border/40"
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Audio Executive Briefing
              </span>
              <Badge variant="outline" className="text-[10px] font-mono text-sky-400 border-sky-500/30">
                2 Min Summary
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              Grounded synthesis across {sourcesCount} peer-reviewed repositories
            </p>
          </div>
        </div>

        {/* Center: Live Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1 h-6 px-3 py-1 rounded-full bg-black/40 border border-white/5">
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full transition-all duration-150 ${
                isPlaying && !isPaused
                  ? "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                  : "bg-muted-foreground/30"
              }`}
              style={{
                height: isPlaying && !isPaused ? `${Math.max(15, (h * (0.6 + ((i % 4) * 0.15))))}%` : "20%",
                animation: isPlaying && !isPaused ? `pulse 0.8s ease-in-out infinite ${(i * 0.08).toFixed(2)}s` : "none",
              }}
            />
          ))}
        </div>

        {/* Right: Audio Playback Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleSpeed}
            className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
            title="Adjust Playback Speed"
          >
            <FastForward className="w-3.5 h-3.5 mr-1" />
            {speed}x
          </Button>

          <Button
            size="sm"
            onClick={handleTogglePlay}
            className={`h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm transition-all ${
              isPlaying && !isPaused
                ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                : "bg-sky-500 hover:bg-sky-400 text-black shadow-sky-500/20"
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPaused ? "Resume" : "Listen"}</span>
              </>
            )}
          </Button>

          {isPlaying && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="h-8 px-2 text-xs border-border/40 hover:bg-red-500/10 hover:text-red-400"
              title="Stop Playback"
            >
              <Square className="w-3 h-3 fill-current" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
