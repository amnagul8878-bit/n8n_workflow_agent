import React from "react";
import { PREBUILT_TEMPLATES } from "../data/templates";
import { Workflow } from "../types";
import { Play, Sparkles, AlertCircle, FileText, Share2 } from "lucide-react";

interface TemplatesPanelProps {
  onSelectTemplate: (template: Workflow) => void;
  activeTemplateId: string | null;
}

export default function TemplatesPanel({ onSelectTemplate, activeTemplateId }: TemplatesPanelProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case "ai-autoresponder":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "lead-router":
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case "sentiment-routing":
        return <AlertCircle className="w-5 h-5 text-pink-400" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div id="templates-panel" className="bg-slate-900 border-b border-slate-800 p-4 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-medium tracking-tight flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            n8n Interactive Playground
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Select a pre-built template to explore live executions, or start dragging visual nodes from the library.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PREBUILT_TEMPLATES.map((tmpl) => {
            const isActive = activeTemplateId === tmpl.id;
            return (
              <button
                id={`btn-tmpl-${tmpl.id}`}
                key={tmpl.id}
                onClick={() => onSelectTemplate(tmpl)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]"
                    : "bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                }`}
              >
                {getIcon(tmpl.id)}
                <span>{tmpl.name}</span>
                <Play className={`w-3 h-3 ml-1 ${isActive ? "text-orange-400" : "text-slate-500"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
