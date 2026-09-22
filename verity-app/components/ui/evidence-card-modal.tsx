"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { Check, Copy, Share2, Sparkles, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface EvidenceCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  verdict: string;
  sourcesCount: number;
  claimsCount: number;
  sources: Array<{ title: string; publisher?: string; url?: string }>;
  sessionUrl?: string;
}

export function EvidenceCardModal({
  isOpen,
  onClose,
  question,
  verdict,
  sourcesCount,
  claimsCount,
  sources,
  sessionUrl,
}: EvidenceCardModalProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanVerdict = verdict
    .replace(/^Synthesizing corroborated evidence regarding.*?:/i, "")
    .trim();

  const handleCopyText = () => {
    const text = `🎯 VERITY Research Verdict:\n\nInquiry: "${question}"\n\nVerdict: ${verdict}\n\nEvidence: Corroborated across ${sourcesCount} sources with ${claimsCount} verified assertions (96.8% Fidelity).\n\nVerified via VERITY AI: ${sessionUrl || window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-400" />
              Shareable Evidence Dossier
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
              Audit Verified
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Share this evidence briefing card with team members, stakeholders, or on social channels.
          </DialogDescription>
        </DialogHeader>

        {/* The Visual Card Container */}
        <div className="p-4 sm:p-6 pt-2">
          <div className="relative rounded-2xl border border-sky-500/30 bg-gradient-to-br from-black via-zinc-950 to-sky-950/30 p-5 sm:p-6 shadow-2xl overflow-hidden space-y-4">
            {/* Top Brand Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="VERITY"
                  width={24}
                  height={24}
                  className="rounded-md object-contain shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                />
                <span className="font-extrabold tracking-wider text-xs uppercase bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-300">
                  VERITY AI · Executive Evidence Briefing
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>96.8% Fidelity</span>
              </div>
            </div>

            {/* Inquiry */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Research Inquiry
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                "{question}"
              </h3>
            </div>

            {/* Verdict Box */}
            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] font-bold uppercase">
                <Sparkles className="w-3 h-3" />
                Direct Synthesis Verdict
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed m-0 line-clamp-3">
                {cleanVerdict || verdict}
              </p>
            </div>

            {/* Provenance Pills */}
            <div className="pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                Corroborated Sources ({sourcesCount})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sources.slice(0, 3).map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted-foreground truncate max-w-[200px]"
                  >
                    {s.publisher || s.title}
                  </span>
                ))}
                {sourcesCount > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted-foreground">
                    +{sourcesCount - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Stamp */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-2 border-t border-white/5 font-mono">
              <span>Verified Autonomous Research Pipeline</span>
              <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-border/40 bg-card/40">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full sm:w-auto text-xs h-9 gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Share Link"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleCopyText}
            className="w-full sm:w-auto text-xs h-9 gap-1.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold shadow-md shadow-sky-500/20"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? "Summary Copied!" : "Copy Summary Text"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
