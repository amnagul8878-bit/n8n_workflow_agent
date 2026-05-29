import React, { useState, useRef, useEffect } from "react";
import { WorkflowNode, WorkflowConnection, NodeType } from "../types";
import {
  Play,
  Globe,
  GitFork,
  Code,
  Sparkles,
  MessageSquare,
  Mail,
  ToggleLeft,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onAddConnection: (connection: Omit<WorkflowConnection, "id">) => void;
  onRemoveConnection: (connectionId: string) => void;
  onCanvasClick: () => void;
}

export default function WorkflowCanvas({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onAddConnection,
  onRemoveConnection,
  onCanvasClick
}: WorkflowCanvasProps) {
  // Navigation & Zoom State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Draggable Node State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Web drag-to-connect state
  const [activeConnectionSource, setActiveConnectionSource] = useState<{
    nodeId: string;
    portName: "output" | "true" | "false";
    startX: number;
    startY: number;
  } | null>(null);
  const [connectorTargetCoords, setConnectorTargetCoords] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Constants
  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 90;

  // Track global moves for canvas drag, node drag, and curve drawing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan({ x: pan.x + dx, y: pan.y + dy });
        panStart.current = { x: e.clientX, y: e.clientY };
      } else if (draggingNodeId) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calculate new grid coordinates taking pan and zoom into account
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;
        
        let newX = Math.round(mouseX - dragOffset.current.x);
        let newY = Math.round(mouseY - dragOffset.current.y);
        
        // Keep inside canvas bounds loosely
        newX = Math.max(10, Math.min(2500, newX));
        newY = Math.max(10, Math.min(2500, newY));

        onUpdateNodePosition(draggingNodeId, newX, newY);
      } else if (activeConnectionSource) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Target relative workspace coordinate
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        
        setConnectorTargetCoords({ x, y });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
      setActiveConnectionSource(null);
      setConnectorTargetCoords(null);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isPanning, draggingNodeId, activeConnectionSource, pan, zoom]);

  // Helper: Get visual node coordinate by type & port name
  const getPortCoordinates = (node: WorkflowNode, portType: "input" | "output" | "true" | "false") => {
    const nx = node.x;
    const ny = node.y;

    if (portType === "input") {
      return { x: nx, y: ny + CARD_HEIGHT / 2 };
    }
    if (portType === "output") {
      return { x: nx + CARD_WIDTH, y: ny + CARD_HEIGHT / 2 };
    }
    if (portType === "true") {
      return { x: nx + CARD_WIDTH, y: ny + CARD_HEIGHT / 3 };
    }
    if (portType === "false") {
      return { x: nx + CARD_WIDTH, y: ny + (2 * CARD_HEIGHT) / 3 };
    }

    return { x: nx, y: ny };
  };

  const getIcon = (type: NodeType) => {
    const classStyle = "w-4 h-4";
    switch (type) {
      case "trigger_manual":
        return <Play className={`${classStyle} text-emerald-400`} />;
      case "trigger_webhook":
        return <Globe className={`${classStyle} text-teal-400`} />;
      case "if_condition":
        return <GitFork className={`${classStyle} text-pink-400`} />;
      case "js_code":
        return <Code className={`${classStyle} text-indigo-400`} />;
      case "gemini_ai":
        return <Sparkles className={`${classStyle} text-purple-400`} />;
      case "slack_simulator":
        return <MessageSquare className={`${classStyle} text-amber-400`} />;
      case "email_simulator":
        return <Mail className={`${classStyle} text-sky-400`} />;
      case "set_variable":
        return <ToggleLeft className={`${classStyle} text-blue-400`} />;
    }
  };

  // Drag Canvas background to pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === "canvas-grid-bg") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      onCanvasClick();
    }
  };

  // Drag Node handle trigger
  const handleNodeHeaderMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    onSelectNode(node.id);
    
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseXInWorkspace = (e.clientX - rect.left - pan.x) / zoom;
    const mouseYInWorkspace = (e.clientY - rect.top - pan.y) / zoom;

    setDraggingNodeId(node.id);
    dragOffset.current = {
      x: mouseXInWorkspace - node.x,
      y: mouseYInWorkspace - node.y
    };
  };

  // Start connecting line dragging
  const handlePortMouseDown = (e: React.MouseEvent, node: WorkflowNode, portName: "output" | "true" | "false") => {
    e.stopPropagation();
    const coords = getPortCoordinates(node, portName);
    setActiveConnectionSource({
      nodeId: node.id,
      portName,
      startX: coords.x,
      startY: coords.y
    });
    setConnectorTargetCoords({ x: coords.x, y: coords.y });
  };

  // Complete connect line
  const handlePortMouseUp = (e: React.MouseEvent, targetNode: WorkflowNode) => {
    e.stopPropagation();
    if (activeConnectionSource && targetNode.id !== activeConnectionSource.nodeId) {
      onAddConnection({
        fromId: activeConnectionSource.nodeId,
        fromPort: activeConnectionSource.portName,
        toId: targetNode.id,
        toPort: "input"
      });
    }
    setActiveConnectionSource(null);
    setConnectorTargetCoords(null);
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      className={`flex-1 relative overflow-hidden bg-[#fafbfc] select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ touchAction: "none" }}
    >
      {/* Visual Workspace grid under transformation */}
      <div
        id="canvas-grid-bg"
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          backgroundImage: "radial-gradient(#cbd5e1 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      >
        {/* Draw SVG Connections */}
        <svg className="absolute overflow-visible pointer-events-none inset-0 w-full h-full z-0">
          <defs>
            <linearGradient id="active-flow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f54291" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {connections.map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.fromId);
            const toNode = nodes.find((n) => n.id === conn.toId);

            if (!fromNode || !toNode) return null;

            const start = getPortCoordinates(fromNode, conn.fromPort);
            const end = getPortCoordinates(toNode, conn.toPort);

            // Compute smart handle control points for bezier s-curve
            const dx = Math.abs(end.x - start.x) * 0.5;
            const c1x = start.x + dx;
            const c1y = start.y;
            const c2x = end.x - dx;
            const c2y = end.y;

            const pathData = `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;

            const isFlowRunning = fromNode.executionState?.status === 'running' || toNode.executionState?.status === 'running';
            const isFlowSuccess = fromNode.executionState?.status === 'success' && toNode.executionState?.status === 'success';

            return (
              <g key={conn.id} className="pointer-events-auto group">
                {/* Visual glow connection background */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isFlowSuccess ? "url(#active-flow)" : "#e2e8f0"}
                  strokeWidth={4}
                  className="transition-all duration-300 opacity-60 group-hover:stroke-amber-400 group-hover:opacity-100 group-hover:stroke-[5px]"
                />

                <path
                  d={pathData}
                  fill="none"
                  stroke={isFlowSuccess ? "#10b981" : isFlowRunning ? "#f59e0b" : "#94a3b8"}
                  strokeWidth={2}
                  className="transition-all duration-300"
                />

                {/* Simulated glowing charge moving down pipeline when successful */}
                {isFlowSuccess && (
                  <circle r="4" fill="#10b981" filter="url(#glow)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}

                {/* Simulated glowing charge moving when active running */}
                {isFlowRunning && (
                  <circle r="4" fill="#f59e0b">
                    <animateMotion dur="1s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Render real-time active drag connection anchor path */}
          {activeConnectionSource && connectorTargetCoords && (
            <path
              d={`M ${activeConnectionSource.startX} ${activeConnectionSource.startY} C ${
                (activeConnectionSource.startX + connectorTargetCoords.x) / 2
              } ${activeConnectionSource.startY}, ${
                (activeConnectionSource.startX + connectorTargetCoords.x) / 2
              } ${connectorTargetCoords.y}, ${connectorTargetCoords.x} ${connectorTargetCoords.y}`}
              fill="none"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="4,4"
              className="animate-[dash_10s_linear_infinite]"
            />
          )}
        </svg>

        {/* Visual Line centered delete snips (rendered as absolute buttons on workspace) */}
        {connections.map((conn) => {
          const fromNode = nodes.find((n) => n.id === conn.fromId);
          const toNode = nodes.find((n) => n.id === conn.toId);
          if (!fromNode || !toNode) return null;

          const start = getPortCoordinates(fromNode, conn.fromPort);
          const end = getPortCoordinates(toNode, conn.toPort);

          // Find exact mid-point of connection line
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          return (
            <button
              id={`btn-snip-${conn.id}`}
              key={`snip-${conn.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveConnection(conn.id);
              }}
              style={{
                left: `${midX - 9}px`,
                top: `${midY - 9}px`
              }}
              className="absolute w-4.5 h-4.5 bg-rose-50 border border-rose-200 rounded-full text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-110 cursor-pointer z-20 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)]"
              title="Delete this connection line link"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          );
        })}

        {/* Render Workspace draggable Node component absolute cards */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const status = node.executionState?.status || 'idle';

          return (
            <div
              id={`node-${node.id}`}
              key={node.id}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`
              }}
              className={`absolute rounded-xl bg-white border text-slate-800 shadow-md hover:shadow-lg transition-all ${
                isSelected
                  ? "border-orange-500 ring-2 ring-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  : status === 'success'
                  ? "border-emerald-500 hover:border-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.06)]"
                  : status === 'failed'
                  ? "border-rose-500 hover:border-rose-600 shadow-[0_4px_12px_rgba(239,68,68,0.08)] animate-[shake_0.4s_ease]"
                  : status === 'running'
                  ? "border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.08)]"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Node top header dragging handle */}
              <div
                id={`node-hdr-${node.id}`}
                onMouseDown={(e) => handleNodeHeaderMouseDown(e, node)}
                className={`px-3 py-1.5 rounded-t-xl flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-slate-100 bg-slate-50/50`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getIcon(node.type)}
                  <span className="font-bold text-[11px] truncate text-slate-700 tracking-tight">
                    {node.name}
                  </span>
                </div>

                {/* Visual run status symbols */}
                {status === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 filter drop-shadow-[0_0_1px_rgba(16,185,129,0.2)]" />
                )}
                {status === 'failed' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
                )}
                {status === 'running' && (
                  <div className="w-3.5 h-3.5 rounded-full border border-t-amber-500 border-amber-200 animate-spin shrink-0"></div>
                )}
              </div>

              {/* Node summary stats block */}
              <div className="p-2 px-3 text-[10px] text-slate-500 flex flex-col justify-between h-[52px]">
                <p className="truncate text-slate-600 font-medium pl-0.5">
                  {node.type === "gemini_ai"
                    ? `Instruct: "${node.parameters.systemInstruction || 'Assistant'}"`
                    : node.type === "js_code"
                    ? "Sandbox JavaScript execution"
                    : node.type === "if_condition"
                    ? `Compare: "${node.parameters.field}"`
                    : node.type === "slack_simulator"
                    ? `Chan: #${node.parameters.channel || "general"}`
                    : "n8n Workflow Node step"}
                </p>

                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className="uppercase font-mono text-[8.5px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-semibold border border-slate-200">
                    {node.type.replace("_", " ")}
                  </span>
                  {node.executionState?.executionTimeMs !== undefined && (
                    <span className="font-mono text-amber-600 bg-amber-50 px-1 rounded font-semibold">
                      {node.executionState.executionTimeMs}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Connect Port circles */}
              {/* Direct input left port (not allowed on Triggers) */}
              {node.type !== "trigger_manual" && node.type !== "trigger_webhook" && (
                <div
                  id={`port-in-${node.id}`}
                  onMouseUp={(e) => handlePortMouseUp(e, node)}
                  className="absolute w-3.5 h-3.5 bg-white border-2 border-slate-350 hover:border-amber-500 hover:bg-amber-100 rounded-full cursor-crosshair -left-1.5 top-1/2 -mt-1.5 flex items-center justify-center transition-all z-30 shadow-sm"
                  title="Pipeline Input"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-amber-500"></div>
                </div>
              )}

              {/* Standard single output Port (not allowed on condition structures or endpoints) */}
              {node.type !== "if_condition" && (
                <div
                  id={`port-out-${node.id}`}
                  onMouseDown={(e) => handlePortMouseDown(e, node, "output")}
                  className="absolute w-3.5 h-3.5 bg-white border-2 border-slate-350 hover:border-orange-500 hover:bg-orange-100 rounded-full cursor-crosshair -right-1.5 top-1/2 -mt-1.5 flex items-center justify-center transition-all z-30 shadow-sm"
                  title="Connect pipeline next step"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                </div>
              )}

              {/* Splitted branching Ports for condition nodes */}
              {node.type === "if_condition" && (
                <>
                  {/* TRUE Port (top right) */}
                  <div
                    id={`port-true-${node.id}`}
                    onMouseDown={(e) => handlePortMouseDown(e, node, "true")}
                    className="absolute w-3.5 h-3.5 bg-white border-2 border-slate-350 hover:border-emerald-500 hover:bg-emerald-100 rounded-full cursor-crosshair -right-1.5 top-1/3 -mt-1.5 flex items-center justify-center transition-all z-30 shadow-sm"
                    title="Path True"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="absolute left-4 -top-0.5 text-[8.5px] uppercase tracking-wider font-bold text-emerald-600 font-mono select-none">
                      True
                    </span>
                  </div>

                  {/* FALSE Port (bottom right) */}
                  <div
                    id={`port-false-${node.id}`}
                    onMouseDown={(e) => handlePortMouseDown(e, node, "false")}
                    className="absolute w-3.5 h-3.5 bg-white border-2 border-slate-350 hover:border-rose-500 hover:bg-rose-100 rounded-full cursor-crosshair -right-1.5 top-2/3 -mt-1.5 flex items-center justify-center transition-all z-30 shadow-sm"
                    title="Path False"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span className="absolute left-4 -top-0.5 text-[8.5px] uppercase tracking-wider font-bold text-rose-600 font-mono select-none">
                      False
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Camera controls */}
      <div className="absolute right-4 bottom-4 bg-white/95 backdrop-blur border border-slate-200 p-1.5 rounded-xl flex items-center gap-1 shadow-md z-30">
        <button
          id="btn-scale-in"
          onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
          className="p-1 px-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] text-slate-600 font-mono min-w-[40px] text-center font-bold">
          {Math.round(zoom * 100)}%
        </span>

        <button
          id="btn-scale-out"
          onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
          className="p-1 px-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1"></div>

        <button
          id="btn-scale-reset"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          className="p-1 px-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
          title="Center Workflow Views"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Reset</span>
        </button>
      </div>

      {/* Quick Visual Help Banner */}
      <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur border border-slate-200 p-2.5 rounded-xl max-w-sm hidden lg:flex items-start gap-2.5 select-none text-[10px] text-slate-600 z-10 shadow-lg">
        <HelpCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div className="leading-normal">
          <p className="font-bold text-slate-800">Interactive Controls:</p>
          <p>• Pan around using mouse **click and drag** on grid background.</p>
          <p>• Reposition node blocks by dragging their title headers.</p>
          <p>• Connect nodes by dragging orange dots to side handles.</p>
        </div>
      </div>
    </div>
  );
}
