"use client";

import { useState } from "react";
import Link from "next/link";
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
  Play,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroVideoBackground } from "@/components/ui/hero-video-background";
import { VerityBrandLogo } from "@/components/ui/verity-logo";

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
  const [selectedMode, setSelectedMode] = useState("quick");
  const [selectedClaim, setSelectedClaim] = useState(0);

  const startResearchWithQuery = (qText: string) => {
    const target = qText.trim();
    if (!target) return;
    router.push(`/dashboard/research/new?q=${encodeURIComponent(target)}&mode=${selectedMode}&autoStart=true`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startResearchWithQuery(query);
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-sky-400/20 selection:text-sky-200 overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <VerityBrandLogo size={34} subtitle="Autonomous Evidence Engine" />

          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/60">
            <a href="#studio" className="hover:text-sky-300 transition-colors">
              Research Studio
            </a>
            <a href="#pipeline" className="hover:text-sky-300 transition-colors">
              9-Stage Engine
            </a>
            <a href="#demo" className="hover:text-sky-300 transition-colors">
              Telemetry Inspector
            </a>
            <a href="#comparison" className="hover:text-sky-300 transition-colors">
              Why VERITY
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/5 text-[13px] px-4 rounded-xl"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard/research/new">
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[13px] px-4 py-2 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION: Cinematic Video Background with Clean Grand Layout ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Direct native HD video canvas with watermark shield */}
        <HeroVideoBackground />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-16 pb-20 flex flex-col items-center justify-center">
          {/* Futuristic Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-sky-400/30 bg-black/50 backdrop-blur-2xl text-sky-300 text-xs font-mono tracking-widest uppercase mb-16 shadow-[0_0_35px_rgba(56,189,248,0.25)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span className="font-semibold text-white/90">VERITY INTELLIGENCE</span>
            <span className="text-white/30">|</span>
            <span className="text-sky-300">AUTONOMOUS EVIDENCE ENGINE</span>
          </motion.div>

          {/* Crazy Futuristic Action Deck Floating over Video */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14 w-full max-w-md sm:max-w-none"
          >
            <Link href="/dashboard/research/new" className="w-full sm:w-auto">
              <div className="relative group p-[2px] rounded-2xl overflow-hidden bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-500 shadow-[0_0_40px_rgba(56,189,248,0.45)] hover:shadow-[0_0_75px_rgba(56,189,248,0.75)] transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer">
                <div className="relative px-9 py-4 rounded-[14px] bg-gradient-to-b from-black/90 to-slate-950/95 backdrop-blur-2xl flex items-center justify-center gap-3.5 text-white font-bold text-base tracking-wide overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-white via-sky-100 to-cyan-200 bg-clip-text text-transparent font-semibold">
                    Launch Autonomous Studio
                  </span>
                  <ArrowRight className="w-4 h-4 text-sky-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <a href="#studio" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-[54px] px-8 rounded-2xl border-white/20 hover:border-sky-400/60 bg-black/50 hover:bg-white/[0.08] text-white/90 hover:text-white font-medium text-base backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 text-sky-400" />
                <span>Explore Research Console</span>
              </Button>
            </a>
          </motion.div>

          {/* Clean Metric Badges (Transparent Floating Glass) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="inline-flex flex-wrap items-center justify-center gap-6 px-6 py-3 rounded-2xl border border-white/[0.12] bg-black/40 backdrop-blur-2xl text-xs text-white/70 font-mono shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Verbatim Citation Anchors</span>
            </div>
            <span className="text-white/20 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-sky-400" />
              <span>Cross-Source Contradiction Auditing</span>
            </div>
            <span className="text-white/20 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Zero Hallucinated Bibliographies</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── RESEARCH STUDIO & SEARCH CONSOLE SECTION ─────────────── */}
      <section id="studio" className="relative py-20 border-t border-white/[0.08] bg-gradient-to-b from-black via-slate-950/60 to-black">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Interactive Research Console
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Investigate Any Technical or Scientific Hypothesis
            </h2>
            <p className="text-white/60 text-sm max-w-xl mx-auto">
              Execute live multi-engine discovery across CrossRef scholarly DOIs, arXiv preprints, and verified web sources.
            </p>
          </div>

          {/* Research Box Form */}
          <div className="p-3 sm:p-4 rounded-3xl border border-white/15 bg-white/[0.02] backdrop-blur-2xl shadow-[0_0_60px_rgba(56,189,248,0.12)] transition-all focus-within:border-sky-500/50">
            {/* Mode selection pills */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <button
                type="button"
                onClick={() => setSelectedMode("quick")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedMode === "quick"
                    ? "bg-sky-500 text-black font-semibold"
                    : "text-white/50 hover:text-white bg-white/5"
                }`}
              >
                Quick Diligence (~30s)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("deep")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedMode === "deep"
                    ? "bg-sky-500 text-black font-semibold"
                    : "text-white/50 hover:text-white bg-white/5"
                }`}
              >
                Deep Empirical Audit (~2m)
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/60 border border-white/10 flex-1">
                <Search className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask any complex research question, clinical hypothesis, or due diligence inquiry..."
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/35 text-base font-medium"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="h-14 sm:h-auto bg-sky-500 hover:bg-sky-400 text-black font-bold px-8 rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.3)] shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Research</span>
              </Button>
            </form>
          </div>

          {/* Quick Explore Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/40 mr-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Suggested Inquiries:
            </span>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => startResearchWithQuery(q)}
                className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-200 text-white/60 bg-white/[0.02] transition-all cursor-pointer text-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE EVIDENCE INSPECTOR DEMO ─────────────── */}
      <section id="demo" className="relative py-24 border-t border-white/[0.06] bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Interactive Telemetry
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              See How VERITY Proves Every Claim
            </h2>
            <p className="text-base text-white/50 max-w-2xl mx-auto">
              Click any extracted assertion below to inspect its verbatim text passage, cryptographic source anchor, and contradiction score.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Claim Selector */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2 px-1">
                Extracted Assertions (Solid-State Batteries)
              </div>
              {DEMO_CLAIMS.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedClaim(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedClaim === idx
                      ? "bg-white/[0.06] border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/20"
                      : "bg-white/[0.015] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 font-mono flex items-center gap-1.5">
                      {c.badge === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {c.source}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-mono ${
                        c.badge === "warning"
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      }`}
                    >
                      {c.badge === "warning" ? "Contradiction 94%" : `Fidelity ${c.match}%`}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                    {c.text}
                  </p>
                </button>
              ))}
            </div>

            {/* Right: Verbatim Evidence Inspector */}
            <div className="lg:col-span-7">
              <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2 px-1">
                Passage-Level Verification Telemetry
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedClaim}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden"
                >
                  {/* Glowing corner indicator */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-mono uppercase tracking-wider text-sky-300">
                        Citation Fidelity: Verified
                      </span>
                    </div>
                    <span className="text-xs font-mono text-white/40">
                      Anchor ID: VERITY-EVID-8291
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
                      Target Assertion
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {DEMO_CLAIMS[selectedClaim].text}
                    </p>
                  </div>

                  <div className="mb-4 p-4 rounded-xl bg-black/60 border border-white/[0.08]">
                    <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Verbatim Extracted Passage
                    </div>
                    <p className="text-xs text-white/80 font-mono leading-relaxed italic">
                      {DEMO_CLAIMS[selectedClaim].passage}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50">
                    <div>
                      <div className="font-semibold text-white/80">
                        {DEMO_CLAIMS[selectedClaim].paperTitle}
                      </div>
                      <div className="text-[11px] font-mono text-white/40">
                        {DEMO_CLAIMS[selectedClaim].citation}
                      </div>
                    </div>
                    <Link href="/dashboard/research/new">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-sky-500/30 text-sky-300 hover:bg-sky-500/10 rounded-lg shrink-0"
                      >
                        Inspect Full Dossier
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9-STAGE PIPELINE ARCHITECTURE ─────────────────────── */}
      <section id="pipeline" className="relative py-28 border-t border-white/[0.06] bg-gradient-to-b from-black via-slate-950/40 to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Autonomous Architecture
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              The 9-Stage Factuality Engine
            </h2>
            <p className="text-base text-white/50 max-w-2xl mx-auto">
              Unlike generic chat assistants that guess answers, VERITY executes a deterministic, adversarial pipeline from query decomposition to citation audit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PIPELINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.015] hover:border-sky-500/40 hover:bg-white/[0.03] transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-white/30">
                      STAGE 0{stage.num}
                    </span>
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-1">
                    {stage.verb}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHY VERITY COMPARISON MATRIX ──────────────────────── */}
      <section id="comparison" className="relative py-24 border-t border-white/[0.06] bg-black">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/30">
              Soundness Benchmark
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Built for High-Stakes Decisions
            </h2>
            <p className="text-base text-white/50 max-w-xl mx-auto">
              Engineered for researchers, clinicians, investors, and engineers who cannot afford a plausible-sounding hallucination.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.015] overflow-hidden">
            <div className="grid grid-cols-12 p-4 border-b border-white/10 text-xs font-mono uppercase tracking-wider text-white/40">
              <div className="col-span-5">Verification Capability</div>
              <div className="col-span-3 text-center">Standard LLM / Search</div>
              <div className="col-span-4 text-center text-sky-400 font-bold">VERITY Research Engine</div>
            </div>

            {[
              {
                feat: "Citation Grounding",
                standard: "Post-hoc simulated links (often 404s)",
                verity: "Verbatim text excerpts anchored to verified DOIs",
              },
              {
                feat: "Contradiction Detection",
                standard: "Smooths over conflicting evidence",
                verity: "Explicit cross-source discrepancy analysis",
              },
              {
                feat: "Claim Atomization",
                standard: "Blended generative paragraphs",
                verity: "Isolated empirical assertions with confidence scores",
              },
              {
                feat: "Scholarly Discovery",
                standard: "Public SEO web scraper index",
                verity: "CrossRef academic API + arXiv + live web",
              },
              {
                feat: "Auditability & Export",
                standard: "Ephemeral chat session history",
                verity: "Exportable Dossiers (Markdown, JSON, Dossier)",
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-4 border-b border-white/[0.04] text-xs items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-5 font-medium text-white/90">{row.feat}</div>
                <div className="col-span-3 text-center text-white/40">{row.standard}</div>
                <div className="col-span-4 text-center text-sky-300 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{row.verity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER & FINAL CTA ─────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.08] bg-black py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/[0.08]">
            <div className="flex flex-col items-center md:items-start">
              <VerityBrandLogo size={36} subtitle="Autonomous Evidence Engine" />
              <p className="text-xs text-white/40 mt-3 max-w-sm text-center md:text-left">
                Empirical factuality, verbatim citation verification, and autonomous research diligence.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard/research/new">
                <Button className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                  Launch App
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
            <div>
              © 2026 VERITY Research Systems. All empirical telemetry rights reserved.
            </div>
            <div className="flex items-center gap-6 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Vercel Serverless Ready
              </span>
              <span>v1.0.0-prod</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
