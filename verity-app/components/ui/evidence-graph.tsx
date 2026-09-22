"use client";

import React, { useState } from "react";
import { TopologyNode, TopologyEdge } from "@/lib/server-store";
import { Badge } from "./badge";
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";

interface EvidenceGraphProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  onSelectNode?: (node: TopologyNode) => void;
}

export function EvidenceGraph({ nodes, edges, onSelectNode }: EvidenceGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Layout calculations (SVG viewBox 800 x 500, Center: 400, 250)
  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // Separate nodes by type
  const inquiryNode = nodes.find((n) => n.type === "inquiry") || nodes[0];
  const sourceNodes = nodes.filter((n) => n.type === "source");
  const claimNodes = nodes.filter((n) => n.type === "claim");

  // Position nodes in orbits around the center
  const nodeCoords = new Map<string, { x: number; y: number }>();

  if (inquiryNode) {
    nodeCoords.set(inquiryNode.id, { x: centerX, y: centerY });
  }

  // Inner orbit: Sources (radius = 140)
  const sourceRadius = 145;
  sourceNodes.forEach((s, idx) => {
    const angle = (idx / Math.max(1, sourceNodes.length)) * 2 * Math.PI - Math.PI / 2;
    nodeCoords.set(s.id, {
      x: centerX + sourceRadius * Math.cos(angle),
      y: centerY + sourceRadius * Math.sin(angle),
    });
  });

  // Outer orbit: Claims (radius = 215)
  const claimRadius = 215;
  claimNodes.forEach((c, idx) => {
    const angle =
      ((idx + 0.5) / Math.max(1, claimNodes.length)) * 2 * Math.PI - Math.PI / 2;
    nodeCoords.set(c.id, {
      x: centerX + claimRadius * Math.cos(angle),
      y: centerY + claimRadius * Math.sin(angle),
    });
  });

  const handleNodeClick = (node: TopologyNode) => {
    setSelectedNodeId(node.id);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="relative w-full rounded-2xl border border-border/70 bg-gradient-to-b from-card/80 to-background/95 p-4 overflow-hidden shadow-xl backdrop-blur-md">
      {/* Top Header / Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 pb-3 border-b border-border/40">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span>Evidence Topology & Citation Cluster</span>
            <Badge variant="outline" className="text-[10px] font-mono text-sky-400 border-sky-500/30">
              Interactive
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hover to inspect semantic connections · Click node to focus in inspector
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <span className="text-muted-foreground">Inquiry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-muted-foreground">Peer Source</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">Supported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">Constraint</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[460px] bg-black/40 rounded-xl border border-white/5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            <radialGradient id="inquiryGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sourceGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="counterEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Background Orbit Guide Rings */}
          <circle cx={centerX} cy={centerY} r={sourceRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
          <circle cx={centerX} cy={centerY} r={claimRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />

          {/* Edges / Connections */}
          {edges.map((edge) => {
            const src = nodeCoords.get(edge.source);
            const tgt = nodeCoords.get(edge.target);
            if (!src || !tgt) return null;

            const isHighlighted =
              hoveredNode?.id === edge.source || hoveredNode?.id === edge.target;
            const isCounter = edge.stance === "counter";

            return (
              <g key={edge.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={
                    isHighlighted
                      ? isCounter
                        ? "#fbbf24"
                        : "#38bdf8"
                      : isCounter
                      ? "url(#counterEdgeGrad)"
                      : "url(#edgeGrad)"
                  }
                  strokeWidth={isHighlighted ? 2.5 : 1.2}
                  strokeDasharray={isCounter ? "4 3" : undefined}
                  opacity={isHighlighted ? 1 : 0.65}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const coord = nodeCoords.get(node.id);
            if (!coord) return null;

            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNodeId === node.id;
            const isInquiry = node.type === "inquiry";
            const isSource = node.type === "source";
            const isClaim = node.type === "claim";

            let nodeColor = "#38bdf8";
            let nodeRadius = 14;

            if (isInquiry) {
              nodeColor = "#38bdf8";
              nodeRadius = 26;
            } else if (isSource) {
              nodeColor = "#818cf8";
              nodeRadius = 16;
            } else if (isClaim) {
              nodeColor = node.status === "disputed" ? "#fbbf24" : "#34d399";
              nodeRadius = 13;
            }

            return (
              <g
                key={node.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Glow ring on hover/selection */}
                {(isHovered || isSelected || isInquiry) && (
                  <circle
                    r={nodeRadius + (isInquiry ? 14 : 9)}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={1.5}
                    opacity={0.4}
                    className="animate-pulse"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={nodeRadius}
                  fill={nodeColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered || isSelected ? 2 : 1}
                  className="transition-all duration-200"
                  style={{
                    filter: `drop-shadow(0 0 ${isHovered ? 12 : 6}px ${nodeColor}88)`,
                  }}
                />

                {/* Label text */}
                <text
                  y={nodeRadius + 14}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={isInquiry ? 11 : 9.5}
                  fontWeight={isInquiry ? "bold" : "normal"}
                  className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Node Tooltip Card */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3 rounded-xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase text-sky-400 font-bold">
                {hoveredNode.type.toUpperCase()}
              </span>
              {hoveredNode.confidence && (
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30">
                  {Math.round(hoveredNode.confidence * 100)}% Confidence
                </Badge>
              )}
            </div>

            <p className="font-semibold text-foreground leading-snug">
              {hoveredNode.label}
            </p>

            {hoveredNode.publisher && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Publisher:</span>
                <span className="text-foreground font-medium">{hoveredNode.publisher}</span>
              </p>
            )}

            <div className="pt-1 text-[10px] text-sky-300 font-mono flex items-center gap-1">
              <span>Click to view evidence details</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
        )}

        {/* Floating Zoom Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md z-10">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
