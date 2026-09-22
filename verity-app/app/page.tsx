"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Crosshair,
  Shield,
  Zap,
  BookOpen,
  GitCompare,
  BarChart3,
  Database,
  Layers,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CosmicBackground } from "@/components/ui/cosmic-background";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";

// ─── VERITY Logo Component ──────────────────────────────────────────
function VerityLogo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/verity-logo.png"
      alt="VERITY"
      width={size}
      height={size}
      className="rounded-xl object-contain shadow-[0_0_20px_rgba(56,189,248,0.2)]"
      priority
    />
  );
}

// ─── Sample Research Queries ─────────────────────────────────────────
const SAMPLE_QUERIES = [
  "Solid-State EV Battery Commercialization Bottlenecks",
  "CRISPR Off-Target Error Rates in Clinical Trials",
  "Quantum Error Correction Thresholds 2026",
  "EU AI Act Liability for Foundation Models",
];

// ─── Pipeline Stages ────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { num: 1, verb: "Decompose", title: "Research Planning", icon: Crosshair, desc: "Decomposes complex inquiries into orthogonal sub-questions & evidence requirements." },
  { num: 2, verb: "Discover", title: "Multi-Engine Search", icon: Search, desc: "Queries live web, CrossRef scholarly DOIs, and arXiv repositories concurrently." },
  { num: 3, verb: "Ingest", title: "Document Ingestion", icon: BookOpen, desc: "Extracts dense technical sections, stripping paywall boilerplate and ads." },
  { num: 4, verb: "Retrieve", title: "Hybrid Indexing", icon: Database, desc: "Combines dense vector semantics with exact keyword citation anchors." },
  { num: 5, verb: "Analyze", title: "Claim Extraction", icon: Layers, desc: "Isolates assertions and maps each directly to verbatim source excerpts." },
  { num: 6, verb: "Check", title: "Contradiction Engine", icon: GitCompare, desc: "Detects cross-source discrepancies and highlights conflicting empirical data." },
  { num: 7, verb: "Verify", title: "Citation Audit", icon: Shield, desc: "Adversarially tests whether cited passages mathematically support assertions." },
  { num: 8, verb: "Synthesize", title: "Structured Dossier", icon: FileCheck2, desc: "Generates executive brief, findings, metrics, and verified bibliography." },
  { num: 9, verb: "Score", title: "Quality Evaluation", icon: BarChart3, desc: "Calculates soundness, source completeness, and citation fidelity scores." },
];

// ─── Interactive Demo Claims ────────────────────────────────────────
const DEMO_CLAIMS = [
  {
    source: "Nature Energy",
    match: 96,
    badge: "primary",
    text: "Solid-state electrolyte interface resistance degrades by over 38% under high C-rate cycling (>2C) without active external pressure.",
    paperTitle: "Interfacial impedance kinetics in all-solid-state lithium batteries",
    citation: "Nature Energy (2025) · DOI: 10.1038/s41560-025-01492-x",
    passage: '"Under continuous cycling exceeding 2C without applied uniaxial compressive stress (≥5 MPa), interfacial void formation between the sulfide electrolyte and lithium anode leads to a 38.4% increase in charge-transfer impedance after 200 cycles."',
  },
  {
    source: "MIT Technology Review",
    match: 91,
    badge: "secondary",
    text: "Automotive OEM pilot manufacturing lines anticipate initial commercial pack assembly costs above $125/kWh until 2028.",
    paperTitle: "Automotive EV battery supply chain economics & capex analysis",
    citation: "MIT Technology Review (2025) · Industry Report",
    passage: '"Current pilot-line estimates from three major OEMs indicate that solid-state pack-level costs will not drop below $125/kWh before 2028, primarily due to inert atmosphere processing requirements and low yield rates at scale."',
  },
  {
    source: "Contradiction Detected",
    match: 94,
    badge: "warning",
    text: "Cell-level energy density projections diverge between silicon-composite anodes (420 Wh/kg) and pure lithium metal anodes (510 Wh/kg).",
    paperTitle: "Comparative anode architectures for next-generation solid-state cells",
    citation: "Advanced Energy Materials (2025) · DOI: 10.1002/aenm.202501234",
    passage: '"While lithium metal anodes project theoretical gravimetric energy densities of 510 Wh/kg, silicon-composite alternatives plateau near 420 Wh/kg — a divergence reflecting fundamentally different degradation mechanisms."',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState(0);

  const startResearchWithQuery = (qText: string) => {
    const target = qText.trim();
    if (!target) return;
    router.push(`/dashboard/research/new?q=${encodeURIComponent(target)}&autoStart=true`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startResearchWithQuery(query);
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-sky-400/20 selection:text-sky-200 overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/[0.08] bg-black/70 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <VerityLogo size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-sky-400 transition-colors">
                VERITY
              </span>
              <span className="text-[9px] tracking-[0.25em] text-white/40 uppercase -mt-0.5 font-mono">
                Evidence Engine
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/60">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Pipeline
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Evidence Inspector
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why VERITY
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/5 text-[13px]"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard/research/new">
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[13px] px-4 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all"
              >
                Start Research
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION: Clean Cosmic Backing with Focused Research Bar ─── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden py-20">
        <CosmicBackground />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/[0.08] backdrop-blur-md text-sky-300 text-xs font-mono tracking-wider mb-6"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span>Precision Research Instrument · Zero Hallucinated Citations</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            Don&apos;t trust the answer.
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Follow the evidence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            An autonomous multi-stage evidence engine. Extracts verbatim passages from scholarly feeds, detects empirical contradictions, and proves every claim.
          </motion.p>

          {/* Research Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <form
              onSubmit={handleSearch}
              className="p-1.5 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(56,189,248,0.15)] flex items-center gap-2 transition-all focus-within:border-sky-500/60 focus-within:shadow-[0_0_60px_rgba(56,189,248,0.25)]"
            >
              <div className="flex items-center gap-3 px-4 py-3 flex-1">
                <Search className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask any complex research inquiry..."
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 text-base font-medium"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-6 py-6 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] shrink-0 transition-transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Research
              </Button>
            </form>

            {/* Quick Explore Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/30 mr-1">
                Explore:
              </span>
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => startResearchWithQuery(q)}
                  className="px-3 py-1 rounded-md border border-white/[0.08] hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-200 text-white/50 bg-white/[0.02] transition-all cursor-pointer text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── INTERACTIVE EVIDENCE INSPECTOR DEMO ─────────────── */}
      <section id="demo" className="relative py-24 border-t border-white/[0.06] bg-gradient-to-b from-black via-slate-950/40 to-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Interactive Telemetry
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
              The Evidence Inspector
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm sm:text-base">
              Click any claim below to audit the verbatim passage, publisher DOI, and verification status in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Synthesis Report Viewer */}
            <Card className="bg-black/60 border-white/10 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold text-sm text-white">Synthesis Dossier</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    Citation Fidelity: 98%
                  </Badge>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold mb-1.5 text-white">
                    Solid-State Electrolyte Interface Kinetics
                  </h4>
                  <p className="text-xs text-white/40 mb-4 font-mono">
                    Inquiry: Commercialization bottlenecks for solid-state EV batteries
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-white/70 mb-5">
                    Recent empirical evaluations across automotive test matrices confirm that sulfide-based solid electrolytes encounter severe interfacial resistance when cycled at fast-charging rates.
                  </p>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                    <p className="text-[11px] uppercase font-mono text-white/40">Select claim to verify:</p>
                    <div className="space-y-2.5">
                      {DEMO_CLAIMS.map((claim, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedClaim(i)}
                          className={`w-full text-left p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            selectedClaim === i
                              ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                              : "border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Badge
                              variant={claim.badge === "warning" ? "outline" : "default"}
                              className={`text-[10px] font-mono ${
                                claim.badge === "warning"
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : claim.badge === "primary"
                                  ? "bg-sky-500 text-black font-semibold"
                                  : "bg-white/10 text-white/80"
                              }`}
                            >
                              {claim.badge === "warning" ? "[Contradiction Detected]" : `[Source: ${claim.source}]`}
                            </Badge>
                            <span className="text-[10px] text-white/40 font-mono">Match: {claim.match}%</span>
                          </div>
                          <p className="font-medium text-white/85 leading-relaxed">{claim.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence & Source Inspector */}
            <Card className="bg-sky-950/20 border-sky-500/20 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold text-sm text-white">Live Passage Auditor</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                    Verified Supported
                  </Badge>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedClaim}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-1">
                        Originating Source
                      </div>
                      <h4 className="font-semibold text-white text-sm leading-snug">
                        {DEMO_CLAIMS[selectedClaim].paperTitle}
                      </h4>
                      <p className="text-xs text-sky-400 font-mono mt-1">
                        {DEMO_CLAIMS[selectedClaim].citation}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/40 uppercase">Verbatim Source Excerpt</span>
                        <Badge variant="outline" className="text-[10px] font-mono text-white/50 border-white/10">
                          Raw Unedited
                        </Badge>
                      </div>
                      <p className="text-xs italic leading-relaxed text-white/80 border-l-2 border-sky-500 pl-3">
                        {DEMO_CLAIMS[selectedClaim].passage}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <div className="text-[10px] uppercase font-mono text-white/40">Fidelity Score</div>
                        <div className="text-lg font-bold text-sky-400 font-mono">{DEMO_CLAIMS[selectedClaim].match}%</div>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <div className="text-[10px] uppercase font-mono text-white/40">Citation Audit</div>
                        <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedClaim === 2 ? "Contradiction Flagged" : "Pass (Zero Hallucination)"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="pt-2">
                  <Button
                    onClick={() => startResearchWithQuery("Solid-State EV Battery Commercialization")}
                    className="w-full text-xs font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  >
                    Launch Live Workspace Telemetry
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON SECTION: Generic Chatbots vs VERITY ───── */}
      <section id="comparison" className="relative py-24 border-t border-white/[0.06]">
        <FloatingPathsBackground position={-1} className="py-8">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
                Architectural Contrast
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
                Why Standard AI Fails High-Stakes Research
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-sm sm:text-base">
                Generic LLM generation cannot be trusted for scientific, legal, or investment diligence without verifiable source grounding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generic Chatbots */}
              <Card className="bg-red-500/[0.02] border-red-500/20 backdrop-blur-xl">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400">Generic Chatbots</h3>
                      <p className="text-xs text-white/40">Unverified probabilistic generation</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    {[
                      { title: "Hallucinated Footnotes:", desc: "Fabricates convincing-sounding journal titles and fake DOIs." },
                      { title: "Forced False Consensus:", desc: "Smooths over conflicting datasets into an ungrounded compromise." },
                      { title: "Opaque Provenance:", desc: "Gives blocks of text with no exact passage trace or verifiable excerpt." },
                      { title: "Zero Audit Trail:", desc: "No claim ledger, no contradiction checks, and no citation verification." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-0.5 shrink-0">✕</span>
                        <p className="text-white/60">
                          <strong className="text-white/90">{item.title}</strong> {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* VERITY Engine */}
              <Card className="bg-sky-500/[0.02] border-sky-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.08)]">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-sky-400">VERITY Evidence Engine</h3>
                      <p className="text-xs text-white/40">Grounded scientific intelligence</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    {[
                      { title: "Verbatim Passage Quotes:", desc: "Every assertion maps to exact text with publisher metadata and live DOIs." },
                      { title: "Contradiction Engine:", desc: "Surfaces empirical disagreements transparently instead of smoothing them away." },
                      { title: "Interactive Evidence Inspector:", desc: "Click any inline citation to instantly audit the originating source passage." },
                      { title: "Multi-Engine Search:", desc: "Queries live web, CrossRef DOI registry, and arXiv preprints concurrently." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-white/60">
                          <strong className="text-white/90">{item.title}</strong> {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </FloatingPathsBackground>
      </section>

      {/* ─── 9-STAGE PIPELINE ────────────────────────────────── */}
      <section id="pipeline" className="relative py-24 border-t border-white/[0.06] bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Deterministic Methodology
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
              The 9-Stage Autonomous Pipeline
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm sm:text-base">
              From raw question to published dossier: each stage enforces exit conditions, adversarial verification, and provenance tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PIPELINE_STAGES.map((stage) => {
              const IconComp = stage.icon;
              return (
                <Card
                  key={stage.num}
                  className="bg-white/[0.02] border-white/[0.08] hover:border-sky-500/40 transition-all duration-300 group backdrop-blur-xl"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-mono text-sky-400 font-semibold tracking-wide">
                          {stage.verb}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/30">
                        Stage {stage.num}/9
                      </span>
                    </div>
                    <h3 className="text-sm font-bold group-hover:text-sky-300 transition-colors text-white/95">
                      {stage.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-normal">
                      {stage.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative py-28 border-t border-white/[0.06] bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-10 sm:p-14 rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.05] to-transparent backdrop-blur-2xl shadow-[0_0_80px_rgba(56,189,248,0.1)] space-y-6">
            <div className="flex justify-center">
              <VerityLogo size={52} />
            </div>
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider text-sky-400 border-sky-500/30">
              Autonomous Verification
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Stop Guessing. Start Verifying.
            </h2>
            <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Launch research inquiries through multi-engine web search, scholarly DOI validation, and passage-level evidence mapping.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center">
              <Link href="/dashboard/research/new">
                <Button
                  size="lg"
                  className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-8 py-6 text-base shadow-[0_0_30px_rgba(56,189,248,0.3)] transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Launch Research Workspace
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/15 hover:border-sky-500/40 text-white/70 hover:text-white bg-transparent px-8 py-6 text-base"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <VerityLogo size={22} />
            <span className="text-sm font-bold text-white/70">VERITY</span>
            <span className="text-xs text-white/30 font-mono">· Autonomous Evidence Engine v1.0</span>
          </div>
          <p className="text-xs text-white/30 font-mono">
            Zero Hallucinated Citations · High-Fidelity Research
          </p>
        </div>
      </footer>
    </div>
  );
}
