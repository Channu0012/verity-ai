"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Zap,
  BarChart3,
  Sparkles,
  Search,
  Loader2,
  Plus,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";

const modes = [
  {
    id: "quick",
    name: "Quick",
    icon: Zap,
    description: "Fast exploratory research. 3-4 sub-questions, high-speed synthesis.",
    time: "30-60 seconds",
    color: "border-yellow-500/30 hover:border-yellow-500/50",
  },
  {
    id: "standard",
    name: "Standard",
    icon: BarChart3,
    description: "Balanced research with thorough evidence analysis and citation audit.",
    time: "1-3 minutes",
    color: "border-sky-500/30 hover:border-sky-500/50",
  },
  {
    id: "deep",
    name: "Deep",
    icon: Sparkles,
    description: "Multi-step research with extensive cross-source contradiction checks.",
    time: "3-5 minutes",
    color: "border-purple-500/30 hover:border-purple-500/50",
  },
];

export default function NewResearchPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("quick");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const autoStarted = useRef(false);

  const loadProjects = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "demo-local-token";

      try {
        const data = (await api.getProjects(token)) as any[];
        if (data && data.length > 0) {
          setProjects(data);
          setSelectedProject((curr) => curr || data[0].id);
          return;
        }
      } catch (apiErr) {
        console.warn("Backend getProjects error, using fallback", apiErr);
      }

      // Default fallback project if none exist
      const defaultProj = {
        id: "d448a954-ce4b-4f0e-b392-4073e1b9ebe6",
        name: "General Research",
        status: "active",
      };
      setProjects([defaultProj]);
      setSelectedProject((curr) => curr || defaultProj.id);
    } catch (err) {
      console.error("Failed to load projects", err);
      const fallbackProj = {
        id: "d448a954-ce4b-4f0e-b392-4073e1b9ebe6",
        name: "General Research",
      };
      setProjects([fallbackProj]);
      setSelectedProject(fallbackProj.id);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Read URL query parameters and handle optional autoStart
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const shouldAutoStart = params.get("autoStart") === "true";
      if (q) {
        setQuestion(q);
        if (shouldAutoStart && !autoStarted.current) {
          autoStarted.current = true;
          // Trigger research start after brief state settlement
          const timer = setTimeout(() => {
            executeResearch(q, "quick");
          }, 400);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  async function handleCreateProject() {
    const name = newProjectName.trim();
    if (!name) return;

    setCreatingProject(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "demo-local-token";

      try {
        const project = (await api.createProject(token, name, newProjectDesc)) as any;
        setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
        setSelectedProject(project.id);
      } catch {
        // Optimistic local creation if network error
        const localProj = {
          id: "proj-" + Date.now(),
          name: name,
          description: newProjectDesc,
          status: "active",
        };
        setProjects((prev) => [localProj, ...prev]);
        setSelectedProject(localProj.id);
      }

      setNewProjectName("");
      setNewProjectDesc("");
      setShowNewProject(false);
    } catch (err) {
      console.error("Failed to create project", err);
    } finally {
      setCreatingProject(false);
    }
  }

  async function executeResearch(questionText: string, researchMode: string) {
    if (!questionText.trim()) {
      setError("Please enter a research inquiry.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "demo-local-token";

      let projId = selectedProject;
      if (!projId) {
        projId = projects.length > 0 ? projects[0].id : "d448a954-ce4b-4f0e-b392-4073e1b9ebe6";
      }

      const result = (await api.createResearch(
        token,
        projId,
        questionText.trim(),
        researchMode
      )) as any;

      const targetId = result.research_id || result.id;
      if (targetId) {
        router.push(`/dashboard/research/${targetId}`);
      } else {
        throw new Error("Invalid response from research engine");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start research. Check backend status.");
      setLoading(false);
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeResearch(question, mode);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-sky-400/20 selection:text-sky-200">
      {/* Header */}
      <nav className="border-b border-white/[0.08] sticky top-0 bg-black/80 backdrop-blur-xl z-40">
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/70">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm tracking-tight text-white">New Research Session</span>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-xs font-mono">
            Autonomous Pipeline
          </Badge>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
            Initiate Autonomous Research
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-xl">
            Enter your inquiry. VERITY will decompose it, discover real scholarly sources, extract verbatim passages, audit contradictions, and compile a verified dossier.
          </p>
        </motion.div>

        <form onSubmit={handleFormSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Research Question */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Label htmlFor="question" className="text-sm font-semibold mb-2.5 block text-white/80">
              Research Inquiry / Question
            </Label>
            <Textarea
              id="question"
              placeholder="e.g., What are the primary commercial bottlenecks for solid-state batteries in EVs?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[130px] text-base resize-none bg-white/[0.03] border-white/10 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl placeholder:text-white/30"
              required
              minLength={5}
              maxLength={2000}
            />
            <div className="flex items-center justify-between text-xs text-white/40 mt-2 font-mono">
              <span>Detailed inquiries produce higher-fidelity citations.</span>
              <span>{question.length}/2000</span>
            </div>
          </motion.div>

          {/* Project Selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-2.5">
              <Label className="text-sm font-semibold text-white/80">Assign to Project</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-7 px-2"
                onClick={() => setShowNewProject(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Project
              </Button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {projects.map((p) => {
                const isSelected = selectedProject === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProject(p.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sky-500 text-black font-semibold border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                        : "bg-white/[0.03] text-white/70 border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Research Depth Mode */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Label className="text-sm font-semibold mb-2.5 block text-white/80">Analysis Depth</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {modes.map((m) => {
                const IconComp = m.icon;
                const isSelected = mode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-sky-500/[0.08] border-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-4 h-4 ${isSelected ? "text-sky-400" : "text-white/60"}`} />
                          <span className="font-bold text-sm text-white">{m.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed mb-3">{m.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-white/30">{m.time}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <Link href="/dashboard">
              <Button variant="ghost" type="button" className="text-white/60 hover:text-white hover:bg-white/5">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-8 py-5 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.3)] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initiating Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Launch Research
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Add Project Modal */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="bg-slate-950 border-white/15 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-sky-400" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div>
              <Label htmlFor="projectName" className="text-xs font-semibold text-white/80">
                Project Name
              </Label>
              <Input
                id="projectName"
                placeholder="e.g., EV Battery Research 2026"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1.5 bg-white/[0.04] border-white/15 text-white placeholder:text-white/30"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="projectDesc" className="text-xs font-semibold text-white/80">
                Description (Optional)
              </Label>
              <Input
                id="projectDesc"
                placeholder="Brief project objective..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="mt-1.5 bg-white/[0.04] border-white/15 text-white placeholder:text-white/30"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewProject(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateProject}
                disabled={creatingProject || !newProjectName.trim()}
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold"
              >
                {creatingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
