"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, ArrowLeft, Zap, BarChart3, Sparkles,
  Search, Loader2, Plus, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

const modes = [
  {
    id: "quick",
    name: "Quick",
    icon: Zap,
    description: "Fast exploratory research. 3-4 sub-questions, fewer sources.",
    time: "2-5 minutes",
    color: "border-yellow-500/30 hover:border-yellow-500/50",
  },
  {
    id: "standard",
    name: "Standard",
    icon: BarChart3,
    description: "Balanced research with thorough evidence analysis and verification.",
    time: "5-15 minutes",
    color: "border-blue-500/30 hover:border-blue-500/50",
  },
  {
    id: "deep",
    name: "Deep",
    icon: Sparkles,
    description: "Multi-step research with extensive source collection and deep evidence analysis.",
    time: "15-45 minutes",
    color: "border-purple-500/30 hover:border-purple-500/50",
  },
];

export default function NewResearchPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("standard");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  // Check URL search parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setQuestion(q);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const data = await api.getProjects(session.access_token) as any[];
      setProjects(data);

      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      } else {
        // Auto-create default project so user is never blocked
        try {
          const defProj = await api.createProject(session.access_token, "General Research") as any;
          setProjects([defProj]);
          setSelectedProject(defProj.id);
        } catch (projErr) {
          console.error("Auto project creation failed", projErr);
        }
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  }, [router]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const project = await api.createProject(session.access_token, newProjectName) as any;
      setProjects((prev) => [project, ...prev]);
      setSelectedProject(project.id);
      setNewProjectName("");
      setShowNewProject(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  }

  async function handleStartResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !selectedProject) return;

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const result = await api.createResearch(
        session.access_token,
        selectedProject,
        question,
        mode
      ) as any;

      router.push(`/dashboard/research/${result.research_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start research");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-lg z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold">New Research</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Start New Research</h1>
          <p className="text-muted-foreground">
            Ask a research question. VERITY will plan, discover sources, analyze evidence,
            and generate a verified report.
          </p>
        </motion.div>

        <form onSubmit={handleStartResearch} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Question */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Label htmlFor="question" className="text-base font-medium mb-3 block">
              Research Question
            </Label>
            <Textarea
              id="question"
              placeholder="e.g., What are the major risks and opportunities in India's EV market over the next 5 years?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] text-base resize-none"
              required
              minLength={10}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {question.length}/2000 characters. Be specific — detailed questions produce better research.
            </p>
          </motion.div>

          {/* Project Selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Label className="text-base font-medium mb-3 block">Project</Label>
            <div className="flex flex-wrap gap-3">
              {projects.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant={selectedProject === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProject(p.id)}
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                  {p.name}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewProject(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Project
              </Button>

              <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        placeholder="e.g., Market Research 2026"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateProject} className="w-full">
                      Create Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Research Mode */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Label className="text-base font-medium mb-3 block">Research Depth</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Deeper research uses more sources and AI calls. Completion time varies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {modes.map((m) => (
                <Card
                  key={m.id}
                  className={`cursor-pointer transition-all duration-200 ${m.color} ${
                    mode === m.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setMode(m.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <m.icon className={`w-4 h-4 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
                    <Badge variant="outline" className="text-xs">{m.time}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6 verity-glow"
              disabled={loading || !question.trim() || !selectedProject}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              Start Research
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
