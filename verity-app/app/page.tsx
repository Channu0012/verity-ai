"use client";

import { useState, useEffect } from "react";
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
      className="rounded-lg object-contain"
      priority
    />
  );
}

// ─── Sample Queries ─────────────────────────────────────────────────
const SAMPLE_QUERIES = [
  "Solid-State EV Battery Bottlenecks 2026",
  "CRISPR Off-Target Error Rates in Trials",
  "Quantum Error Correction Thresholds",
  "EU AI Act Liability for Foundation Models",
];

// ─── Pipeline Stages ────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { num: 1, verb: "Decompose", title: "Research Planning", icon: Crosshair, desc: "Breaks high-stakes questions into orthogonal sub-questions & evidence requirements." },
  { num: 2, verb: "Discover", title: "Multi-Engine Search", icon: Search, desc: "Cross-queries live web, CrossRef DOIs, and arXiv scholarly feeds concurrently." },
  { num: 3, verb: "Ingest", title: "Text Extraction", icon: BookOpen, desc: "Strips paywall boilerplate and parses high-density technical sections." },
  { num: 4, verb: "Retrieve", title: "Hybrid Indexing", icon: Database, desc: "Combines dense vector semantics with exact keyword citation anchors." },
  { num: 5, verb: "Analyze", title: "Claim Extraction", icon: Layers, desc: "Isolates assertions and maps each to verbatim source excerpts." },
  { num: 6, verb: "Check", title: "Contradiction Engine", icon: GitCompare, desc: "Detects cross-source discrepancies and presents divergent data." },
  { num: 7, verb: "Verify", title: "Citation Audit", icon: Shield, desc: "Adversarially tests whether cited passages support the claims." },
  { num: 8, verb: "Synthesize", title: "Structured Report", icon: FileCheck2, desc: "Generates executive brief, findings, metrics, and bibliography." },
  { num: 9, verb: "Score", title: "Quality Evaluation", icon: BarChart3, desc: "Calculates completeness, soundness, and citation fidelity scores." },
];

// ─── Interactive Demo Data ──────────────────────────────────────────
const DEMO_CLAIMS = [
  {
    source: "Nature Energy",
    match: 96,
    badge: "primary",
    text: "Solid-state electrolyte interface resistance degrades by over 38% under high C-rate cycling (>2C) without active external pressure.",
  },
  {
    source: "MIT Technology Review",
    match: 91,
    badge: "secondary",
    text: "Automotive OEM pilot manufacturing lines anticipate initial commercial pack assembly costs above $125/kWh until 2028.",
  },
  {
    source: "Contradiction Detected",
    match: 94,
    badge: "warning",
    text: "Cell-level energy density projections diverge between silicon-composite anodes (420 Wh/kg) and pure lithium metal anodes (510 Wh/kg).",
  },
];

// ─── Main Homepage ──────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/research/new?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-sky-400/20 selection:text-sky-200 overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <VerityLogo size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">VERITY</span>
              <span className="text-[9px] tracking-[0.25em] text-white/40 uppercase -mt-0.5 font-mono">Evidence Engine</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/50">
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#comparison" className="hover:text-white transition-colors">Why VERITY</a>
            <a href="#demo" className="hover:text-white transition-colors">Evidence Inspector</a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5 text-[13px]">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[13px] px-4 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                Launch Workspace
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION with Cosmic Background ─────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <CosmicBackground />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Tagline pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/[0.06] text-sky-300 text-xs font-mono uppercase tracking-wider mb-8"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Precision Research Instrument · Zero Hallucinated Citations</span>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <VerityLogo size={100} />
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
          >
            Don&apos;t trust the answer.
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Follow the evidence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-base sm:text-lg text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Generic AI chatbots synthesize plausible guesses with unverifiable footnotes.{" "}
            <strong className="text-white/80">VERITY</strong> executes a 9-stage adversarial
            research pipeline: extracting verbatim evidence, detecting contradictions, and
            validating every assertion against peer-reviewed literature.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <form
              onSubmit={handleSearch}
              className="p-1.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.8)] flex items-center gap-2"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
                <Search className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask any complex research question..."
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/30 text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-6 py-5 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.3)] shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </form>

            {/* Sample query pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/30 mr-1">Explore:</span>
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    router.push(`/dashboard/research/new?q=${encodeURIComponent(q)}`);
                  }}
                  className="px-2.5 py-1 rounded-md border border-white/[0.08] hover:border-sky-500/40 hover:text-white text-white/40 bg-white/[0.02] transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── COMPARISON: Chatbots vs VERITY ─────────────────── */}
      <section id="comparison" className="relative py-24 border-t border-white/[0.04]">
        <FloatingPathsBackground position={-1} className="min-h-[600px] flex items-center">
          <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/20">
                Structural Contrast
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
                Why Standard AI Fails Rigorous Research
              </h2>
              <p className="text-white/40 max-w-2xl mx-auto">
                Traditional LLM generation cannot be trusted for scientific, legal, or investment due diligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generic Chatbots */}
              <Card className="bg-red-500/[0.03] border-red-500/20 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400">Generic Chatbots</h3>
                      <p className="text-xs text-white/40">Unverifiable text generation</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    {[
                      { title: "Hallucinated Footnotes:", desc: "Fabricates realistic-sounding authors, journals, and DOIs that do not exist." },
                      { title: "Blind Consensus:", desc: "Collapses nuanced or conflicting scientific datasets into a single ungrounded answer." },
                      { title: "Opaque Provenance:", desc: "Gives you a block of text with no way to inspect the exact passage the claim was derived from." },
                      { title: "Ephemeral Context:", desc: "No structured claim ledger, no audit trail, and zero mathematical verification." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-0.5">✕</span>
                        <p className="text-white/50">
                          <strong className="text-white/80">{item.title}</strong> {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* VERITY Engine */}
              <Card className="bg-sky-500/[0.03] border-sky-500/30 backdrop-blur-sm shadow-[0_0_30px_rgba(56,189,248,0.08)]">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-sky-400">VERITY Evidence Engine</h3>
                      <p className="text-xs text-white/40">Grounded scientific intelligence</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    {[
                      { title: "Verifiable Passage Quotes:", desc: "Every assertion maps to verbatim text with publisher metadata and live DOI/web links." },
                      { title: "Contradiction Detection:", desc: "Surfaces empirical disagreements transparently instead of forcing a false consensus." },
                      { title: "Interactive Evidence Inspector:", desc: "Click any inline citation to immediately audit the source excerpt in real time." },
                      { title: "Multi-Engine Search:", desc: "Queries DuckDuckGo live web, CrossRef DOI registry, and arXiv preprints concurrently." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-white/50">
                          <strong className="text-white/80">{item.title}</strong> {item.desc}
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

      {/* ─── INTERACTIVE EVIDENCE INSPECTOR DEMO ─────────────── */}
      <section id="demo" className="relative py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/20">
              Live Interactive Demo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
              Experience the Evidence Inspector
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Click any citation badge below to see how VERITY surfaces verbatim source text, support status, and provenance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Viewer */}
            <Card className="bg-white/[0.02] border-white/[0.08] backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold text-sm text-white">Synthesis Report</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono text-white/70 border-white/10">
                    Citation Fidelity: 98%
                  </Badge>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-2 text-white">Solid-State Electrolyte Degradation Kinetics</h4>
                  <p className="text-xs text-white/40 mb-4">
                    Inquiry: What are the commercial bottlenecks for solid-state batteries in EVs?
                  </p>
                  <p className="text-sm leading-relaxed text-white/60 mb-5">
                    Recent empirical evaluations across automotive test matrices confirm that sulfide-based solid electrolytes encounter severe interfacial resistance when cycled at fast-charging rates.
                  </p>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                    <p className="text-xs uppercase font-mono text-white/30">Select a claim to inspect evidence:</p>
                    <div className="space-y-2.5">
                      {DEMO_CLAIMS.map((claim, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedClaim(i)}
                          className={`w-full text-left p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            selectedClaim === i
                              ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.12)]"
                              : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Badge
                              variant={claim.badge === "warning" ? "outline" : "default"}
                              className={`text-[10px] font-mono ${
                                claim.badge === "warning"
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : claim.badge === "primary"
                                  ? "bg-sky-500 text-black"
                                  : "bg-white/10 text-white/70"
                              }`}
                            >
                              {claim.badge === "warning" ? "[Contradiction Detected]" : `[Source: ${claim.source}]`}
                            </Badge>
                            <span className="text-[10px] text-white/30 font-mono">Match: {claim.match}%</span>
                          </div>
                          <p className="font-medium text-white/80">{claim.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Inspector */}
            <Card className="bg-sky-500/[0.02] border-sky-500/20 backdrop-blur-sm shadow-[0_0_40px_rgba(56,189,248,0.06)]">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold text-sm text-white">Evidence & Source Inspector</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                    Verified Supported
                  </Badge>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedClaim}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="text-xs text-white/30 font-mono uppercase tracking-wider mb-1">
                        Originating Source (Academic Peer-Reviewed)
                      </div>
                      <h4 className="font-semibold text-white text-sm leading-snug">
                        {selectedClaim === 0 && "Interfacial impedance kinetics in all-solid-state lithium batteries"}
                        {selectedClaim === 1 && "Automotive EV battery supply chain economics & capex analysis"}
                        {selectedClaim === 2 && "Comparative anode architectures for next-generation solid-state cells"}
                      </h4>
                      <p className="text-xs text-sky-400 font-mono mt-1">
                        {selectedClaim === 0 && "Nature Energy (2025) · DOI: 10.1038/s41560-025-01492-x"}
                        {selectedClaim === 1 && "MIT Technology Review (2025) · Industry Report"}
                        {selectedClaim === 2 && "Advanced Energy Materials (2025) · DOI: 10.1002/aenm.202501234"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/30 uppercase">Exact Extracted Passage</span>
                        <Badge variant="outline" className="text-[10px] font-mono text-white/50 border-white/10">
                          Unedited
                        </Badge>
                      </div>
                      <p className="text-xs italic leading-relaxed text-white/70 border-l-2 border-sky-500 pl-3">
                        {selectedClaim === 0 &&
                          '"Under continuous cycling exceeding 2C without applied uniaxial compressive stress (≥5 MPa), interfacial void formation between the sulfide electrolyte and lithium anode leads to a 38.4% increase in charge-transfer impedance after 200 cycles."'}
                        {selectedClaim === 1 &&
                          '"Current pilot-line estimates from three major OEMs indicate that solid-state pack-level costs will not drop below $125/kWh before 2028, primarily due to inert atmosphere processing requirements and low yield rates at scale."'}
                        {selectedClaim === 2 &&
                          '"While lithium metal anodes project theoretical gravimetric energy densities of 510 Wh/kg, silicon-composite alternatives plateau near 420 Wh/kg — a divergence reflecting fundamentally different degradation mechanisms."'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <div className="text-[10px] uppercase font-mono text-white/30">Confidence Metric</div>
                        <div className="text-lg font-bold text-sky-400 font-mono">{DEMO_CLAIMS[selectedClaim].match}%</div>
                      </div>
                      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <div className="text-[10px] uppercase font-mono text-white/30">Verification Audit</div>
                        <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedClaim === 2 ? "Contradiction Flagged" : "Pass (Zero Hallucination)"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <Link href="/signup" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs font-mono border-white/10 hover:border-sky-500/30 text-white/60 hover:text-white bg-transparent">
                    Inspect Full Workspace Telemetry
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── 9-STAGE PIPELINE ────────────────────────────────── */}
      <section id="pipeline" className="relative py-24 border-t border-white/[0.04]">
        <FloatingPathsBackground position={1} className="min-h-[500px]">
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-sky-400 border-sky-500/20">
                Methodological Rigor
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
                The 9-Stage Autonomous Pipeline
              </h2>
              <p className="text-white/40 max-w-2xl mx-auto">
                From raw inquiry to published dossier: each stage enforces deterministic exit conditions and adversarial checks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PIPELINE_STAGES.map((stage) => (
                <motion.div
                  key={stage.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: stage.num * 0.06, duration: 0.4 }}
                >
                  <Card className="bg-white/[0.02] border-white/[0.06] hover:border-sky-500/30 transition-all duration-300 group backdrop-blur-sm h-full">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-sky-400 font-semibold tracking-wide">
                          {stage.num}. {stage.verb}
                        </span>
                        <span className="text-[10px] font-mono text-white/20">
                          Stage {stage.num}/9
                        </span>
                      </div>
                      <h3 className="text-sm font-bold group-hover:text-sky-400 transition-colors text-white/90">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-white/40 leading-relaxed">{stage.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </FloatingPathsBackground>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative py-28 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 sm:p-16 rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.06] to-transparent backdrop-blur-xl shadow-[0_0_80px_rgba(56,189,248,0.08)] space-y-6"
          >
            <VerityLogo size={56} />
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider text-sky-400 border-sky-500/20">
              Production Ready
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Stop Guessing. Start Verifying.
            </h2>
            <p className="text-white/40 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Run your first research inquiry through the full VERITY pipeline with real web discovery, CrossRef scholarly search, and claim-level evidence mapping.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-8 py-6 text-base shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Launch Research Workspace
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-white/10 hover:border-sky-500/30 text-white/60 hover:text-white bg-transparent px-8 py-6 text-base">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerityLogo size={20} />
            <span className="text-sm font-semibold text-white/50">VERITY</span>
            <span className="text-xs text-white/20 font-mono">· Evidence Engine v1.0</span>
          </div>
          <p className="text-xs text-white/20 font-mono">
            Ask Deeper. Trust Further.
          </p>
        </div>
      </footer>
    </div>
  );
}
