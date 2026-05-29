import React from "react";
import { NodeType } from "../types";
import {
  Play,
  Globe,
  Code,
  Sparkles,
  GitFork,
  MessageSquare,
  Mail,
  ToggleLeft,
  Plus
} from "lucide-react";

interface NodeLibraryProps {
  onAddNode: (type: NodeType) => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  category: "Triggers" | "Logic" | "AI & Integrations";
  description: string;
  icon: React.ReactElement;
  color: string;
}

const MODULE_DEFINITIONS: NodeDefinition[] = [
  {
    type: "trigger_manual",
    name: "Manual Node Trigger",
    category: "Triggers",
    description: "Start the pipeline manually with custom JSON variables.",
    icon: <Play className="w-4 h-4" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60"
  },
  {
    type: "trigger_webhook",
    name: "Webhook trigger",
    category: "Triggers",
    description: "Simulates an HTTP webhook incoming post payload.",
    icon: <Globe className="w-4 h-4" />,
    color: "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:border-teal-500/60"
  },
  {
    type: "if_condition",
    name: "If Condition Router",
    category: "Logic",
    description: "Branch flows based on parameters (exports True & False ports).",
    icon: <GitFork className="w-4 h-4" />,
    color: "bg-pink-500/10 text-pink-400 border-pink-500/30 hover:border-pink-500/60"
  },
  {
    type: "js_code",
    name: "Write JS Script",
    category: "Logic",
    description: "Run custom ES6 Javascript variables modifier sandbox.",
    icon: <Code className="w-4 h-4" />,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60"
  },
  {
    type: "set_variable",
    name: "Set JSON Variable",
    category: "Logic",
    description: "Add or update static value pairs in current cursor data.",
    icon: <ToggleLeft className="w-4 h-4" />,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-500/60"
  },
  {
    type: "gemini_ai",
    name: "Gemini AI Agent",
    category: "AI & Integrations",
    description: "Submit templates to Gemini model server-side.",
    icon: <Sparkles className="w-4 h-4 animate-pulse" />,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.1)]"
  },
  {
    type: "slack_simulator",
    name: "Slack Notify Sandbox",
    category: "AI & Integrations",
    description: "Post simulated channel alerts to Virtual Workspace feeds.",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-500/60"
  },
  {
    type: "email_simulator",
    name: "Gmail Outbox Send",
    category: "AI & Integrations",
    description: "Drafts automated outbound letters into Gmail Simulator panels.",
    icon: <Mail className="w-4 h-4" />,
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:border-sky-500/60"
  }
];

export default function NodeLibrary({ onAddNode }: NodeLibraryProps) {
  const categories = ["Triggers", "Logic", "AI & Integrations"] as const;

  return (
    <div id="node-library" className="w-80 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto flex flex-col shrink-0">
      <div className="mb-4">
        <h3 className="text-white text-xs font-semibold uppercase tracking-wider">Node Library</h3>
        <p className="text-slate-400 text-[11px] mt-0.5">Click a node to add it to your active board canvas.</p>
      </div>

      <div className="space-y-6 flex-1">
        {categories.map((cat) => {
          const items = MODULE_DEFINITIONS.filter((item) => item.category === cat);
          return (
            <div key={cat} className="space-y-2">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">{cat}</h4>
              <div className="space-y-2">
                {items.map((def) => (
                  <button
                    id={`add-node-btn-${def.type}`}
                    key={def.type}
                    onClick={() => onAddNode(def.type)}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all duration-200 cursor-pointer group ${def.color}`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-950/40 border border-current shrink-0 mt-0.5">
                      {def.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-tight text-white group-hover:text-amber-300 transition-colors">
                          {def.name}
                        </span>
                        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-1">
                        {def.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
