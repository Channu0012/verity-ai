"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileCheck2,
  BookOpen,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  BarChart3,
  GitCompare,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Layers,
  Scale,
  Compass,
  Database,
  Crosshair,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Evidence Universe Ambient Nodes
function EvidenceUniverse() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden />;
  }

  const nodes = [
    { id: 1, x: 14, y: 22, size: 4, delay: 0.2, opacity: 0.35 },
    { id: 2, x: 28, y: 15, size: 6, delay: 1.1, opacity: 0.45 },
    { id: 3, x: 42, y: 30, size: 5, delay: 0.7, opacity: 0.4 },
    { id: 4, x: 60, y: 18, size: 7, delay: 1.5, opacity: 0.5 },
    { id: 5, x: 78, y: 25, size: 4, delay: 0.9, opacity: 0.3 },
    { id: 6, x: 88, y: 40, size: 6, delay: 2.1, opacity: 0.4 },
    { id: 7, x: 20, y: 65, size: 5, delay: 1.3, opacity: 0.35 },
    { id: 8, x: 35, y: 80, size: 7, delay: 0.5, opacity: 0.5 },
    { id: 9, x: 55, y: 72, size: 5, delay: 1.8, opacity: 0.4 },
    { id: 10, x: 72, y: 85, size: 6, delay: 2.4, opacity: 0.35 },
    { id: 11, x: 84, y: 68, size: 4, delay: 1.0, opacity: 0.3 },
    { id: 12, x: 10, y: 45, size: 5, delay: 0.4, opacity: 0.25 },
  ];

  const connections = [
    { from: nodes[0], to: nodes[1], opacity: 0.15 },
    { from: nodes[1], to: nodes[2], opacity: 0.12 },
    { from: nodes[2], to: nodes[3], opacity: 0.18 },
    { from: nodes[3], to: nodes[4], opacity: 0.14 },
    { from: nodes[4], to: nodes[5], opacity: 0.16 },
    { from: nodes[6], to: nodes[7], opacity: 0.12 },
    { from: nodes[7], to: nodes[8], opacity: 0.15 },
    { from: nodes[8], to: nodes[9], opacity: 0.13 },
    { from: nodes[9], to: nodes[10], opacity: 0.16 },
    { from: nodes[2], to: nodes[8], opacity: 0.08 },
    { from: nodes[3], to: nodes[9], opacity: 0.09 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="w-full h-full">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {connections.map((conn, i) => (
          <line
            key={`line-${i}`}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity={conn.opacity}
          />
        ))}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 3}
              fill="url(#nodeGlow)"
              opacity={node.opacity * 0.4}
              className="animate-pulse-glow"
              style={{ animationDelay: `${node.delay}s` }}
            />
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="#38bdf8"
              opacity={node.opacity}
              className="animate-float"
              style={{ animationDelay: `${node.delay}s` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// Sample Interactive Evidence Inspection Data
const demoClaims = [
  {
    id: "claim-1",
    tag: "[Source 1: Nature Energy]",
    claimText: "Solid-state electrolyte interface resistance degrades by over 38% under high C-rate cycling (>2C) without active external pressure.",
    supportStatus: "supported",
    relevance: "96%",
    sourceTitle: "Interfacial impedance kinetics in all-solid-state lithium batteries",
    publisher: "Nature Energy (2025)",
    doi: "10.1038/s41560-025-01492-x",
    passage: "Under continuous cycling exceeding 2C without applied uniaxial compressive stress (≥5 MPa), interfacial void formation between the sulfide electrolyte and lithium anode leads to a 38.4% increase in charge-transfer impedance after 200 cycles.",
    sourceType: "Academic Peer-Reviewed",
  },
  {
    id: "claim-2",
    tag: "[Source 2: MIT Technology Review]",
    claimText: "Automotive OEM pilot manufacturing lines anticipate initial commercial pack assembly costs will remain above $125/kWh until 2028.",
    supportStatus: "supported",
    relevance: "91%",
    sourceTitle: "The Road to Commercial Solid-State EV Fleets",
    publisher: "MIT Technology Review (Feb 2026)",
    doi: "https://www.technologyreview.com/2026/02/02/1132042",
    passage: "Automotive manufacturing consortia estimate that dry-room capital expenditure and low initial separator yield will keep early pack production costs in the $125 to $145 per kilowatt-hour range through 2028.",
    sourceType: "Industry Intelligence",
  },
  {
    id: "claim-3",
    tag: "[Contradiction Detected]",
    claimText: "Cell-level energy density projections diverge between silicon-composite anodes (420 Wh/kg) and pure lithium metal anodes (510 Wh/kg).",
    supportStatus: "conflicting_evidence",
    relevance: "94%",
    sourceTitle: "Comparative Energy Densities in Advanced Solid State Architectures",
    publisher: "Journal of Power Sources (2025)",
    doi: "10.1016/j.jpowsour.2025.234102",
    passage: "While lab prototypes utilizing pure lithium foils demonstrate 510 Wh/kg gravimetric capacity, scalable silicon-dominant composite formulations achieve 415-430 Wh/kg with significantly superior dendrite suppression.",
    sourceType: "Contradiction Matrix",
  },
];

const pipelineStages = [
  { step: "1. Decompose", title: "Research Planning", desc: "Breaks high-stakes questions into orthogonal sub-questions & evidence requirements." },
  { step: "2. Discover", title: "Multi-Engine Search", desc: "Cross-queries live web engines, CrossRef DOIs, and arXiv scholarly feeds concurrently." },
  { step: "3. Ingest", title: "Text Extraction", desc: "Strips paywall boilerplate and parses high-density technical sections with zero truncation." },
  { step: "4. Retrieve", title: "Hybrid Indexing", desc: "Combines dense vector semantics with exact keyword citation anchors." },
  { step: "5. Analyze", title: "Claim Extraction", desc: "Isolates empirical assertions and maps each directly to verbatim source excerpts." },
  { step: "6. Check", title: "Contradiction Engine", desc: "Detects cross-source discrepancies and transparently presents divergent data." },
  { step: "7. Verify", title: "Citation Audit", desc: "Adversarially tests whether the cited passage mathematically proves the claim." },
  { step: "8. Synthesize", title: "Structured Report", desc: "Generates executive brief, findings, confidence metrics, and bibliography." },
  { step: "9. Score", title: "Quality Evaluation", desc: "Calculates completeness, soundness, and citation fidelity scores." },
];

export default function LandingPage() {
  const router = useRouter();
  const [activeClaim, setActiveClaim] = useState(demoClaims[0]);
  const [inquiryText, setInquiryText] = useState("");

  const samplePrompts = [
    "Solid-State EV Battery Commercial Bottlenecks 2026",
    "CRISPR In Vivo Off-Target Error Rates in Clinical Trials",
    "Quantum Error Correction Thresholds in Neutral Atom Arrays",
    "EU AI Act Liability Framework for Frontier Foundation Models",
  ];

  function handleStartInquiry(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = inquiryText.trim() || samplePrompts[0];
    router.push(`/signup?redirect=/dashboard/research/new&q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background */}
      <EvidenceUniverse />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
                VERITY
              </span>
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase -mt-1 font-mono">
                Evidence Engine
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#interactive-demo" className="hover:text-foreground transition-colors">
              Evidence Inspector
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Why VERITY
            </a>
            <a href="#pipeline" className="hover:text-foreground transition-colors">
              9-Stage Pipeline
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="verity-glow px-4">
                Launch Workspace
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-wider mb-6"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Precision Research Instrument · Zero Hallucinated Citations</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
        >
          Don&apos;t trust the answer.
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Follow the evidence.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Generic AI chatbots synthesize plausible guesses with unverifiable footnotes.
          <strong className="text-foreground font-semibold"> VERITY</strong> executes a 9-stage adversarial research pipeline: extracting verbatim evidence, detecting contradictions, and validating every assertion against peer-reviewed literature.
        </motion.p>

        {/* Live Inquiry Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <form
            onSubmit={handleStartInquiry}
            className="p-2 rounded-2xl glass border border-border/80 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-3 px-4 py-2 w-full">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="Ask any complex research question..."
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto px-6 py-6 font-medium verity-glow shrink-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Evidence
            </Button>
          </form>

          {/* Quick Prompt Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span className="font-mono text-[11px] uppercase tracking-wider mr-1">Explore inquiries:</span>
            {samplePrompts.map((p) => (
              <button
                key={p}
                onClick={() => setInquiryText(p)}
                className="px-2.5 py-1 rounded-md border border-border/60 hover:border-primary/40 hover:text-foreground bg-accent/30 transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Section 2: Why VERITY is Different (The Contrast Matrix) */}
      <section id="comparison" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-primary border-primary/30">
            Structural Contrast
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Why Standard AI Fails Rigorous Research
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Traditional LLM generation cannot be trusted for scientific, legal, or investment due diligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Generic Chatbot */}
          <Card className="glass border-red-500/20 bg-red-500/[0.02]">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400">Generic Chatbots & Search Wrappers</h3>
                  <p className="text-xs text-muted-foreground">Unverifiable text generation</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Hallucinated Footnotes:</strong> Fabricates realistic-sounding authors, journals, and DOIs that do not exist.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Blind Consensus:</strong> Collapses nuanced or conflicting scientific datasets into a single ungrounded answer.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Opaque Provenance:</strong> Gives you a block of text with no way to inspect the exact passage the claim was derived from.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Ephemeral Context:</strong> No structured claim ledger, no audit trail, and zero mathematical verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VERITY Precision Instrument */}
          <Card className="glass border-primary/40 bg-primary/[0.03] shadow-[0_0_30px_rgba(56,189,248,0.1)]">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">VERITY Evidence Engine</h3>
                  <p className="text-xs text-muted-foreground">Grounded scientific & market intelligence</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Verifiable Passage Quotes:</strong> Every assertion maps to verbatim text with publisher metadata and live DOI/web links.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Explicit Contradiction Detection:</strong> Surfaces empirical disagreements transparently instead of forcing a false consensus.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Interactive Evidence Inspector:</strong> Click any inline citation in the report to immediately audit the source excerpt in real time.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Multi-Engine Search:</strong> Queries DuckDuckGo live web, CrossRef DOI registry, and arXiv preprints concurrently.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Interactive Evidence Inspector Demo */}
      <section id="interactive-demo" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-primary border-primary/30">
            Live Interactive Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Experience the Evidence Inspector
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Click any citation badge below to see how VERITY surfaces verbatim source text, support status, and provenance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Synthesized Report Excerpt */}
          <Card className="glass lg:col-span-6 border-border/70 shadow-lg">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">Synthesis Report Viewer</span>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  Citation Fidelity: 98%
                </Badge>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-2">
                  Solid-State Electrolyte Degradation Kinetics
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Inquiry: What are the commercial bottlenecks for solid-state batteries in EVs?
                </p>

                <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
                  <p>
                    Recent empirical evaluations across automotive test matrices confirm that sulfide-based solid electrolytes encounter severe interfacial resistance when cycled at fast-charging rates.
                  </p>

                  <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-3">
                    <p className="text-xs uppercase font-mono text-muted-foreground">Select a claim to inspect evidence:</p>
                    <div className="space-y-2.5">
                      {demoClaims.map((claim) => {
                        const isSelected = activeClaim.id === claim.id;
                        return (
                          <div
                            key={claim.id}
                            onClick={() => setActiveClaim(claim)}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                                : "border-border/40 hover:border-border hover:bg-accent/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <Badge
                                variant={isSelected ? "default" : "secondary"}
                                className={`text-[10px] font-mono ${
                                  claim.supportStatus === "conflicting_evidence"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : ""
                                }`}
                              >
                                {claim.tag}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Match: {claim.relevance}
                              </span>
                            </div>
                            <p className="font-medium text-foreground">{claim.claimText}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Live Evidence Inspector Panel */}
          <Card className="glass lg:col-span-6 border-primary/30 bg-primary/[0.02] shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">Evidence & Source Inspector</span>
                </div>
                <Badge
                  className={
                    activeClaim.supportStatus === "supported"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }
                >
                  {activeClaim.supportStatus === "supported" ? "Verified Supported" : "Conflicting Evidence"}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Source Metadata */}
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                    Originating Source ({activeClaim.sourceType})
                  </div>
                  <h4 className="font-semibold text-foreground text-sm leading-snug">
                    {activeClaim.sourceTitle}
                  </h4>
                  <p className="text-xs text-primary font-mono mt-1">
                    {activeClaim.publisher} · DOI: {activeClaim.doi}
                  </p>
                </div>

                {/* Verbatim Passage Quote */}
                <div className="p-4 rounded-xl bg-background/80 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase">
                      Exact Extracted Passage
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Unedited
                    </Badge>
                  </div>
                  <p className="text-xs italic leading-relaxed text-foreground/90 border-l-2 border-primary pl-3">
                    &ldquo;{activeClaim.passage}&rdquo;
                  </p>
                </div>

                {/* Grounding Telemetry */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-border/50 bg-accent/20">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Confidence Metric</div>
                    <div className="text-lg font-bold text-primary font-mono">{activeClaim.relevance}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-accent/20">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Verification Audit</div>
                    <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass (Zero Hallucination)
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/signup">
                    <Button variant="outline" size="sm" className="w-full text-xs font-mono">
                      Inspect Full Workspace Telemetry <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: The 9-Stage Precision Pipeline */}
      <section id="pipeline" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-3 font-mono text-xs uppercase tracking-widest text-primary border-primary/30">
            Methodological Rigor
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            The 9-Stage Autonomous Pipeline
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From raw inquiry to published dossier: each stage enforces deterministic exit conditions and adversarial checks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pipelineStages.map((stage, idx) => (
            <Card key={stage.step} className="glass group hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-primary font-semibold tracking-wide">
                    {stage.step}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Stage {idx + 1}/9
                  </span>
                </div>
                <h3 className="text-base font-bold group-hover:text-primary transition-colors">
                  {stage.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stage.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 5: High-Value CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-10 sm:p-16 rounded-3xl glass border border-primary/30 bg-gradient-to-b from-primary/[0.08] to-transparent shadow-[0_0_50px_rgba(56,189,248,0.15)] space-y-6">
          <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider text-primary border-primary/30">
            Production Ready
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Stop Guessing. Start Verifying.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Run your first research inquiry through the full VERITY pipeline with real web discovery, CrossRef scholarly search, and claim-level evidence mapping.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="verity-glow text-base px-8 py-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Launch Research Workspace
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 py-6">
                Sign In to Existing Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-10 bg-background/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">VERITY</span>
            <span>— Precision AI Research Instrument</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Model Gateway: Live</span>
            <span>CrossRef DOI: Active</span>
            <span>Zero Hallucinations Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
