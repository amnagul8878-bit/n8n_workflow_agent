import React from "react";
import { WorkflowNode } from "../types";
import { HelpCircle, Trash2, X, Play, Code, Cpu, Layers } from "lucide-react";

interface SidebarProps {
  selectedNode: WorkflowNode | null;
  onUpdateParameters: (nodeId: string, parameters: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
  onExecuteNodeSingle: (node: WorkflowNode) => void;
}

export default function Sidebar({
  selectedNode,
  onUpdateParameters,
  onDeleteNode,
  onClose,
  onExecuteNodeSingle
}: SidebarProps) {
  if (!selectedNode) return null;

  const handleParamChange = (key: string, value: any) => {
    onUpdateParameters(selectedNode.id, {
      ...selectedNode.parameters,
      [key]: value
    });
  };

  const renderDescription = () => {
    switch (selectedNode.type) {
      case "trigger_manual":
        return "Triggers the pipeline manually. You can set customized mock JSON variables below which will act as the output of this node.";
      case "trigger_webhook":
        return "Simulates an external incoming webhook. Allows creating customizable JSON payloads that feed downstream actions.";
      case "if_condition":
        return "Branch router. Compares a field of structural input JSON. If the match is met, sends data strictly down true port (Upper connection) or false port (Lower connection).";
      case "js_code":
        return "Runs interactive ES6 JavaScript code in the browser context. Access previous inputs using `$json` variable. Returns a JSON object to downstream nodes.";
      case "set_variable":
        return "Modify active payload variables or create custom parameters on the fly without using custom code blocks.";
      case "gemini_ai":
        return "Connects directly to the Gemini AI API server-side. Encourages dynamic templates with {{ $json.field }} compile notation, temperature sliders, and custom model instructions.";
      case "slack_simulator":
        return "Send alerts to simulated local Workspaces. Compiles message templates automatically and posts them to your Slack channel tracker.";
      case "email_simulator":
        return "Simulate automated outbound email delivery. Submits drafts to your visual Inbox sandbox instantly.";
      default:
        return "";
    }
  };

  const stringifyData = (val: any) => {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return "";
    }
  };

  const handleJsonTextareaChange = (key: string, val: string) => {
    try {
      const parsed = JSON.parse(val);
      handleParamChange(key, parsed);
    } catch {
      // Allow raw typing editing without crashing
    }
  };

  return (
    <div id="node-config-sidebar" className="w-[450px] bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto shrink-0 font-sans shadow-[[-12px_0_30px_rgba(0,0,0,0.3)]] relative z-10">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-920">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-xs uppercase tracking-wider text-white">Node Properties</span>
        </div>
        <button
          id="btn-close-sidebar"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Identity card */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <input
            id={`node-rename-input-${selectedNode.id}`}
            type="text"
            value={selectedNode.name}
            onChange={(e) => {
              // Standard name rewrite
              onUpdateParameters(selectedNode.id, { ...selectedNode.parameters, _label_name: e.target.value });
            }}
            className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-orange-500 focus:outline-none py-0.5 px-1 rounded max-w-[250px] tracking-tight"
          />
          <div className="flex items-center gap-1">
            <button
              id={`btn-sidebar-run-single-${selectedNode.id}`}
              onClick={() => onExecuteNodeSingle(selectedNode)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold flex items-center gap-1 border border-slate-755 cursor-pointer transition-colors"
              title="Test run this node with current variables mock outputs"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Test Step</span>
            </button>
            <button
              id={`btn-sidebar-delete-${selectedNode.id}`}
              onClick={() => onDeleteNode(selectedNode.id)}
              className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white transition-colors cursor-pointer"
              title="Delete node from canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-850/60 block">
          {renderDescription()}
        </p>
      </div>

      {/* Settings Form Blocks */}
      <div className="p-4 flex-1 space-y-5">
        {selectedNode.type === 'trigger_manual' || selectedNode.type === 'trigger_webhook' ? (
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 pl-0.5">
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span>Output Mock JSON Payload</span>
            </label>
            <textarea
              id={`textarea-payload-${selectedNode.id}`}
              rows={10}
              defaultValue={stringifyData(selectedNode.parameters.mockPayload || {})}
              onChange={(e) => handleJsonTextareaChange("mockPayload", e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl p-3 font-mono text-xs leading-relaxed"
              placeholder={'{\n  "key": "value"\n}'}
            />
            <p className="text-[10px] text-slate-500 leading-normal pl-0.5">
              Note: This dictionary is passed down to subsequent items when executing the workflow.
            </p>
          </div>
        ) : null}

        {selectedNode.type === 'js_code' ? (
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 pl-0.5">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>JavaScript Sandbox Code</span>
            </label>
            <textarea
              id={`textarea-js-code-${selectedNode.id}`}
              rows={12}
              value={selectedNode.parameters.code || ""}
              onChange={(e) => handleParamChange("code", e.target.value)}
              className="w-full bg-slate-950 text-slate-250 border border-slate-800 focus:border-orange-500/80 focus:outline-none rounded-xl p-3 font-mono text-xs leading-relaxed"
              placeholder="// Write ES6 code\nconst data = $json;\nreturn {\n  ...data\n};"
            />
            <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-850/60 space-y-1 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 font-bold uppercase text-indigo-400 text-[9px] mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Sandbox Helpers</span>
              </div>
              <p>• Access input payload directly using <code className="text-amber-400 font-semibold">$json</code></p>
              <p>• You MUST return a flat object, e.g. <code className="text-amber-400 font-semibold">return {"{ computed: 42 }"};</code></p>
            </div>
          </div>
        ) : null}

        {selectedNode.type === 'if_condition' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Evaluate Input Field</label>
              <input
                id={`input-if-field-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.field || ""}
                onChange={(e) => handleParamChange("field", e.target.value)}
                placeholder="e.g. employeesCount or user.score"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
              <p className="text-[10px] text-slate-500">The field path inside incoming JSON model to validate.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Comparison Operator</label>
              <select
                id={`select-if-operator-${selectedNode.id}`}
                value={selectedNode.parameters.operator || "equals"}
                onChange={(e) => handleParamChange("operator", e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains / Partial string</option>
                <option value="greater_than">Numeric Greater Than (&gt;)</option>
                <option value="less_than">Numeric Less Than (&lt;)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Compare With Value</label>
              <input
                id={`input-if-value-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.value || ""}
                onChange={(e) => handleParamChange("value", e.target.value)}
                placeholder="Value to compare against"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>
        ) : null}

        {selectedNode.type === 'set_variable' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Variable Label Key</label>
              <input
                id={`input-set-key-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.key || ""}
                onChange={(e) => handleParamChange("key", e.target.value)}
                placeholder="e.g. calculatedRank"
                className="w-full bg-slate-950 text-slate-250 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Static Assignment Value</label>
              <input
                id={`input-set-value-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.value || ""}
                onChange={(e) => handleParamChange("value", e.target.value)}
                placeholder="Value to assign"
                className="w-full bg-slate-950 text-slate-250 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>
        ) : null}

        {selectedNode.type === 'gemini_ai' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 pl-0.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Compiler Prompt Template</span>
              </label>
              <textarea
                id={`textarea-gemini-prompt-${selectedNode.id}`}
                rows={5}
                value={selectedNode.parameters.template || ""}
                onChange={(e) => handleParamChange("template", e.target.value)}
                placeholder="User message is {{ $json.body }}. Summarize it!"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl p-3 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 leading-normal pl-0.5">
                Support double-curly notation, e.g. <code className="text-amber-500 font-semibold font-mono">&#123;&#123; $json.sender &#125;&#125;</code> to interpolate runtime field state.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">System Instructions</label>
              <input
                id={`input-gemini-sys-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.systemInstruction || ""}
                onChange={(e) => handleParamChange("systemInstruction", e.target.value)}
                placeholder="e.g. You are a helpful support bot"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] uppercase font-bold text-slate-400 px-0.5">
                <span>Creativity (Temperature)</span>
                <span className="font-mono text-purple-400">{selectedNode.parameters.temperature ?? 0.7}</span>
              </div>
              <input
                id={`input-gemini-temp-${selectedNode.id}`}
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={selectedNode.parameters.temperature ?? 0.7}
                onChange={(e) => handleParamChange("temperature", parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        ) : null}

        {selectedNode.type === 'slack_simulator' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Channel Name Target</label>
              <input
                id={`input-slack-channel-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.channel || ""}
                onChange={(e) => handleParamChange("channel", e.target.value)}
                placeholder="e.g. priority-alerts"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Slack Message Template</label>
              <textarea
                id={`textarea-slack-message-${selectedNode.id}`}
                rows={5}
                value={selectedNode.parameters.messageTemplate || ""}
                onChange={(e) => handleParamChange("messageTemplate", e.target.value)}
                placeholder="Warning: Alert for {{ $json.customer }}"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl p-3 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 pl-0.5 mt-0.5">Compiles dynamically using current cursor JSON variables.</p>
            </div>
          </div>
        ) : null}

        {selectedNode.type === 'email_simulator' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Recipient Outbound Address</label>
              <input
                id={`input-email-to-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.to || ""}
                onChange={(e) => handleParamChange("to", e.target.value)}
                placeholder="e.g. customer@domain.com or {{ $json.sender }}"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Header Subject Line</label>
              <input
                id={`input-email-subj-${selectedNode.id}`}
                type="text"
                value={selectedNode.parameters.subject || ""}
                onChange={(e) => handleParamChange("subject", e.target.value)}
                placeholder="e.g. Response regarding ticket"
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-400 pl-0.5">Message Outbox Template</label>
              <textarea
                id={`textarea-email-body-${selectedNode.id}`}
                rows={5}
                value={selectedNode.parameters.bodyTemplate || ""}
                onChange={(e) => handleParamChange("bodyTemplate", e.target.value)}
                placeholder="Dear customer, thanks for contacting support regarding {{ $json.subject }}."
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-orange-500 focus:outline-none rounded-xl p-3 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Visual Execution Outputs panel inside sidebar */}
      {selectedNode.executionState?.outputData || selectedNode.executionState?.inputData ? (
        <div className="p-4 bg-slate-955 border-t border-slate-800 shrink-0 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step Execution Result</span>
            <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded ${
              selectedNode.executionState?.status === 'success' ? "bg-emerald-950 text-emerald-400 border border-emerald-500/10" :
              selectedNode.executionState?.status === 'failed' ? "bg-rose-955 text-rose-450 border border-rose-500/10" : "bg-slate-800 text-slate-400"
            }`}>
              {selectedNode.executionState?.status.toUpperCase()}
            </span>
          </div>

          {selectedNode.executionState?.inputData && (
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 block">✦ INPUT JSON Data:</span>
              <pre className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-850 max-h-24 overflow-y-auto leading-relaxed">
                {stringifyData(selectedNode.executionState.inputData)}
              </pre>
            </div>
          )}

          {selectedNode.executionState?.outputData && (
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 block">✦ OUTPUT JSON Result:</span>
              <pre className="text-[10px] text-slate-350 bg-slate-950 p-2.5 rounded-lg border border-slate-850 max-h-24 overflow-y-auto leading-relaxed">
                {stringifyData(selectedNode.executionState.outputData)}
              </pre>
            </div>
          )}

          {selectedNode.executionState?.error && (
            <div className="space-y-1">
              <span className="text-[9px] text-rose-400 block font-bold">✦ RUN ERROR:</span>
              <div className="text-[10px] text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30 font-bold">
                {selectedNode.executionState.error}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-950/20 text-center text-[10px] text-slate-550 italic border-t border-slate-800">
          No execution data. Run this step or the whole workflow to inspect JSON.
        </div>
      )}
    </div>
  );
}
