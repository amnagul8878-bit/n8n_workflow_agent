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
    color: "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 shadow-sm"
  },
  {
    type: "trigger_webhook",
    name: "Webhook trigger",
    category: "Triggers",
    description: "Simulates an HTTP webhook incoming post payload.",
    icon: <Globe className="w-4 h-4" />,
    color: "bg-teal-50/50 hover:bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400 shadow-sm"
  },
  {
    type: "if_condition",
    name: "If Condition Router",
    category: "Logic",
    description: "Branch flows based on parameters (exports True & False ports).",
    icon: <GitFork className="w-4 h-4" />,
    color: "bg-pink-50/50 hover:bg-pink-50 text-pink-700 border-pink-200 hover:border-pink-400 shadow-sm"
  },
  {
    type: "js_code",
    name: "Write JS Script",
    category: "Logic",
    description: "Run custom ES6 Javascript variables modifier sandbox.",
    icon: <Code className="w-4 h-4" />,
    color: "bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400 shadow-sm"
  },
  {
    type: "set_variable",
    name: "Set JSON Variable",
    category: "Logic",
    description: "Add or update static value pairs in current cursor data.",
    icon: <ToggleLeft className="w-4 h-4" />,
    color: "bg-blue-50/50 hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 shadow-sm"
  },
  {
    type: "gemini_ai",
    name: "Gemini AI Agent",
    category: "AI & Integrations",
    description: "Submit templates to Gemini model server-side.",
    icon: <Sparkles className="w-4 h-4" />,
    color: "bg-purple-50/50 hover:bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400 shadow-sm"
  },
  {
    type: "slack_simulator",
    name: "Slack Notify Sandbox",
    category: "AI & Integrations",
    description: "Post simulated channel alerts to Virtual Workspace feeds.",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "bg-amber-50/50 hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 shadow-sm"
  },
  {
    type: "email_simulator",
    name: "Gmail Outbox Send",
    category: "AI & Integrations",
    description: "Drafts automated outbound letters into Gmail Simulator panels.",
    icon: <Mail className="w-4 h-4" />,
    color: "bg-sky-50/50 hover:bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400 shadow-sm"
  }
];

export default function NodeLibrary({ onAddNode }: NodeLibraryProps) {
  const categories = ["Triggers", "Logic", "AI & Integrations"] as const;

  return (
    <div id="node-library" className="w-80 bg-white border-r border-slate-200 p-4 overflow-y-auto flex flex-col shrink-0">
      <div className="mb-4">
        <h3 className="text-slate-800 text-xs font-semibold uppercase tracking-wider">Node Library</h3>
        <p className="text-slate-500 text-[11px] mt-0.5">Click a node to add it to your active board canvas.</p>
      </div>

      <div className="space-y-5 flex-1">
        {categories.map((cat) => {
          const items = MODULE_DEFINITIONS.filter((item) => item.category === cat);
          return (
            <div key={cat} className="space-y-2">
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">{cat}</h4>
              <div className="space-y-2">
                {items.map((def) => (
                  <button
                    id={`add-node-btn-${def.type}`}
                    key={def.type}
                    onClick={() => onAddNode(def.type)}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all duration-200 cursor-pointer group ${def.color}`}
                  >
                    <div className="p-1.5 rounded-lg bg-white border border-current shrink-0 mt-0.5 shadow-sm">
                      {def.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-tight text-slate-850 group-hover:text-amber-800 transition-colors">
                          {def.name}
                        </span>
                        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-500" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-1">
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
