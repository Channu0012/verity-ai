"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  FolderOpen,
  FileText,
  Settings,
  ArrowRight,
  Shield,
  Clock,
  Command,
  X,
  PlusCircle,
} from "lucide-react";

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "action" | "navigation" | "research";
  icon: any;
  href?: string;
  action?: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Base navigation items
  const baseItems: PaletteItem[] = [
    {
      id: "nav-new",
      title: "Start New Research Inquiry",
      subtitle: "Launch autonomous multi-engine discovery across CrossRef & web",
      category: "action",
      icon: Sparkles,
      action: () => {
        setIsOpen(false);
        const qParam = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
        router.push(`/dashboard/research/new${qParam}`);
      },
    },
    {
      id: "nav-dash",
      title: "Research Dashboard",
      subtitle: "View active runs, completed dossiers, and workspace metrics",
      category: "navigation",
      icon: Clock,
      href: "/dashboard",
    },
    {
      id: "nav-projects",
      title: "Projects & Folders",
      subtitle: "Manage evidence portfolios and research directories",
      category: "navigation",
      icon: FolderOpen,
      href: "/dashboard/projects",
    },
    {
      id: "nav-reports",
      title: "Synthesized Reports Library",
      subtitle: "Browse executive briefs, claim ledgers, and citations",
      category: "navigation",
      icon: FileText,
      href: "/dashboard/reports",
    },
    {
      id: "nav-settings",
      title: "Account & Engine Settings",
      subtitle: "Manage API keys, profile settings, and notification alerts",
      category: "navigation",
      icon: Settings,
      href: "/dashboard/settings",
    },
    {
      id: "nav-admin",
      title: "Security & Admin Gate",
      subtitle: "Direct access to secure telemetry portal",
      category: "navigation",
      icon: Shield,
      href: "/admin",
    },
  ];

  // Filter items based on query
  const filteredItems = baseItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  // Keyboard navigation within list
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        setIsOpen(false);
        if (selected.action) {
          selected.action();
        } else if (selected.href) {
          router.push(selected.href);
        }
      } else if (query.trim()) {
        setIsOpen(false);
        router.push(`/dashboard/research/new?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <>
      {/* Floating launcher trigger button for users who don't know the shortcut */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-sky-400/30 bg-black/80 hover:bg-black/95 text-white/80 hover:text-white backdrop-blur-2xl shadow-[0_0_30px_rgba(56,189,248,0.25)] hover:shadow-[0_0_45px_rgba(56,189,248,0.4)] transition-all cursor-pointer text-xs font-mono group"
        title="Open Command Palette (Ctrl+K)"
      >
        <Command className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
        <span className="text-white/60">Quick Action</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-sky-300 font-mono">⌘K</kbd>
      </button>

      {/* Modal Backdrop & Palette */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-black/90 backdrop-blur-2xl shadow-[0_0_80px_rgba(56,189,248,0.2)] overflow-hidden z-10"
              onKeyDown={handleKeyDownList}
            >
              {/* Search Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a research question, command, or jump to page..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 text-base font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[11px] font-mono text-white/50">
                  ESC
                </kbd>
              </div>

              {/* Suggestions / Results */}
              <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
                {query.trim() && (
                  <div
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/dashboard/research/new?q=${encodeURIComponent(query.trim())}&autoStart=true`);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <PlusCircle className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-sm font-semibold">Investigate: &quot;{query}&quot;</div>
                        <div className="text-xs text-sky-300/70 font-mono">Launch autonomous 9-stage research execution</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                  </div>
                )}

                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIsOpen(false);
                        if (item.action) {
                          item.action();
                        } else if (item.href) {
                          router.push(item.href);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-sky-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-xs text-white/50">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-white/30 hidden sm:inline">
                        {item.category}
                      </span>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/40">
                    No commands matching &quot;{query}&quot;. Press Enter to start a new inquiry.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/40 font-mono">
                <div className="flex items-center gap-4">
                  <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">↑↓</kbd> Navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">↵</kbd> Select</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">ESC</kbd> Close</span>
                </div>
                <span className="text-sky-400">VERITY 2026 Engine</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
