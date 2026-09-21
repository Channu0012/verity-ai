"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Deterministic pseudo-random helper based on index to ensure purity
function getPseudoRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return Number((x - Math.floor(x)).toFixed(4));
}

// Evidence Universe — Ambient floating nodes visualization
function EvidenceUniverse() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden />;
  }

  const nodes = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Number((10 + getPseudoRandom(i * 3) * 80).toFixed(2)),
    y: Number((10 + getPseudoRandom(i * 7) * 80).toFixed(2)),
    size: Number((3 + getPseudoRandom(i * 11) * 6).toFixed(2)),
    delay: Number((getPseudoRandom(i * 13) * 4).toFixed(2)),
    opacity: Number((0.15 + getPseudoRandom(i * 17) * 0.4).toFixed(3)),
  }));

  const connections = nodes.slice(0, 15).map((node, i) => {
    const target = nodes[(i + 3 + Math.floor(getPseudoRandom(i * 19) * 5)) % nodes.length];
    return { from: node, to: target, opacity: Number((0.06 + getPseudoRandom(i * 23) * 0.1).toFixed(3)) };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="w-full h-full">
        {connections.map((conn, i) => (
          <line
            key={`conn-${i}`}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="var(--verity)"
            strokeWidth="1"
            opacity={conn.opacity}
          />
        ))}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="var(--verity)"
              opacity={node.opacity}
              className="animate-float"
              style={{ animationDelay: `${node.delay}s` }}
            />
            <circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 2}
              fill="var(--verity)"
              opacity={node.opacity * 0.2}
              className="animate-pulse-glow"
              style={{ animationDelay: `${node.delay + 1}s` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const features = [
  {
    icon: Search,
    title: "Intelligent Source Discovery",
    description:
      "Automatically discovers and validates credible sources from academic, government, news, and research organizations.",
  },
  {
    icon: FileCheck2,
    title: "Citation Verification",
    description:
      "Every claim is traced back to its source. No unsupported assertions survive the verification pipeline.",
  },
  {
    icon: GitCompare,
    title: "Contradiction Detection",
    description:
      "When credible sources disagree, VERITY shows both sides transparently — never forcing false consensus.",
  },
  {
    icon: BarChart3,
    title: "Evidence Mapping",
    description:
      "Interactive evidence graphs connect claims to passages to sources, making provenance instantly inspectable.",
  },
  {
    icon: Zap,
    title: "Multi-Provider AI",
    description:
      "Route to the best model for each task — planning, extraction, synthesis, verification — with automatic fallback.",
  },
  {
    icon: Shield,
    title: "Research-Grade Security",
    description:
      "Server-side API keys, prompt injection defenses, file validation, audit logging, and zero secret exposure.",
  },
];

const pipeline = [
  { step: "Question", desc: "Enter your research question" },
  { step: "Plan", desc: "AI decomposes into sub-questions" },
  { step: "Discover", desc: "Source discovery and validation" },
  { step: "Retrieve", desc: "Hybrid semantic + keyword search" },
  { step: "Analyze", desc: "Claim extraction and evidence mapping" },
  { step: "Verify", desc: "Citation verification loop" },
  { step: "Report", desc: "Structured, evidence-backed report" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Evidence Universe Background */}
      <EvidenceUniverse />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">VERITY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="verity-glow">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Evidence-First AI Research
          </Badge>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          variants={fadeUp}
        >
          Don&apos;t trust the answer.
          <br />
          <span className="text-primary verity-glow-text">Follow the evidence.</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          variants={fadeUp}
        >
          VERITY transforms complex research questions into structured,
          evidence-backed reports with verified citations, contradiction
          detection, and full source provenance.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeUp}>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6 verity-glow">
              Start Researching
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="#pipeline">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              See How It Works
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Research Pipeline */}
      <section id="pipeline" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl sm:text-4xl font-bold mb-4" variants={fadeUp}>
            The Research Pipeline
          </motion.h2>
          <motion.p className="text-muted-foreground text-lg max-w-2xl mx-auto" variants={fadeUp}>
            Every question follows a rigorous path from question to verified report.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {pipeline.map((item, i) => (
            <motion.div key={item.step} variants={fadeUp}>
              <Card className="glass h-full text-center group hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
                  <div className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                    {item.step}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl sm:text-4xl font-bold mb-4" variants={fadeUp}>
            Built for rigorous research
          </motion.h2>
          <motion.p className="text-muted-foreground text-lg max-w-2xl mx-auto" variants={fadeUp}>
            Every feature serves one purpose: making the evidence visible and verifiable.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp}>
              <Card className="glass h-full group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl sm:text-4xl font-bold mb-8" variants={fadeUp}>
            Why evidence matters
          </motion.h2>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={stagger}>
            {[
              { value: "100%", label: "Citations verified against source material" },
              { value: "Transparent", label: "Conflicting evidence shown, never hidden" },
              { value: "Traceable", label: "Every claim maps to a source passage" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl sm:text-4xl font-bold mb-4" variants={fadeUp}>
            Start your evidence-first research
          </motion.h2>
          <motion.p className="text-muted-foreground text-lg mb-8" variants={fadeUp}>
            Ask a difficult question. VERITY will find the sources, verify the claims, and show you
            what the evidence actually supports.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-10 py-6 verity-glow">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>VERITY — Evidence-First AI Research Engine</span>
          </div>
          <div>Built with rigorous AI engineering</div>
        </div>
      </footer>
    </div>
  );
}
