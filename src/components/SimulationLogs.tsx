import React, { useState } from "react";
import { VirtualNotification, WorkflowNode } from "../types";
import { MessageSquare, Mail, Terminal, Trash2, Calendar, User, Eye } from "lucide-react";

interface SimulationLogsProps {
  notifications: VirtualNotification[];
  executionLogs: string[];
  nodes: WorkflowNode[];
  onClear: () => void;
}

type TabType = 'slack' | 'gmail' | 'logs';

export default function SimulationLogs({ notifications, executionLogs, nodes, onClear }: SimulationLogsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [selectedMail, setSelectedMail] = useState<VirtualNotification | null>(null);

  const slackMessages = notifications.filter((n) => n.type === 'slack');
  const gmailMessages = notifications.filter((n) => n.type === 'gmail');

  return (
    <div id="simulation-panel" className="h-72 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 shrink-0">
      {/* Tab Navigation Area */}
      <div className="w-full md:w-56 bg-slate-900 p-3 flex flex-col justify-between shrink-0">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
            Virtual Workspace feeds
          </span>

          <button
            id="tab-btn-logs"
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'logs'
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Execution Logs</span>
            </div>
            <span className="bg-slate-950 text-[10px] text-orange-400 px-1.5 py-0.5 rounded-full font-mono border border-orange-500/10">
              {executionLogs.length}
            </span>
          </button>

          <button
            id="tab-btn-slack"
            onClick={() => setActiveTab('slack')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'slack'
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated Slack</span>
            </div>
            <span className="bg-slate-950 text-[10px] text-emerald-400 px-1.5 py-0.5 rounded-full font-mono border border-emerald-500/10">
              {slackMessages.length}
            </span>
          </button>

          <button
            id="tab-btn-gmail"
            onClick={() => {
              setActiveTab('gmail');
              setSelectedMail(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'gmail'
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-sky-450" />
              <span>Gmail Inbox</span>
            </div>
            <span className="bg-slate-950 text-[10px] text-sky-400 px-1.5 py-0.5 rounded-full font-mono border border-sky-500/10">
              {gmailMessages.length}
            </span>
          </button>
        </div>

        <button
          id="btn-clear-logs"
          onClick={() => {
            onClear();
            setSelectedMail(null);
          }}
          className="w-full flex items-center justify-center gap-2 text-[10px] text-slate-500 hover:text-rose-400 bg-slate-950/40 border border-slate-800 hover:border-rose-500/30 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Outputs</span>
        </button>
      </div>

      {/* Main Tab Content Block */}
      <div className="flex-1 p-3 overflow-y-auto font-sans min-w-0">
        {activeTab === 'logs' && (
          <div className="space-y-1.5">
            {executionLogs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                <span>Ready. Start a workflow execution to trace real-time nodes.</span>
              </div>
            ) : (
              <div className="font-mono text-[11px] text-slate-300 space-y-1 bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                {executionLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 hover:bg-slate-800/20 py-0.5 rounded px-1">
                    <span className="text-slate-600 select-none">{idx+1} [2026-05-29]</span>
                    <span className={
                      log.includes("▲ SUCCESS") ? "text-emerald-400 font-semibold" :
                      log.includes("❌ FAILED") ? "text-rose-400 font-semibold animate-pulse" :
                      log.includes("▶ RUNNING") ? "text-amber-400 animate-pulse" : "text-slate-350"
                    }>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'slack' && (
          <div className="space-y-2">
            {slackMessages.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                <span>No simulated Slack notifications yet.</span>
                <span className="text-[10px] text-slate-600 mt-0.5">Use the "Slack Notify Sandbox" node type in your flow.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {slackMessages.map((msg) => (
                  <div key={msg.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex gap-3 hover:border-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-550 flex items-center justify-center text-emerald-400 text-xs font-semibold shrink-0">
                      #{msg.sender.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="font-semibold text-[11px] text-emerald-400">#{msg.sender}</span>
                        <span className="text-[9px] text-slate-550">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 leading-normal whitespace-pre-line font-chat">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gmail' && (
          <div className="h-full flex flex-col md:flex-row gap-3 min-h-0">
            {gmailMessages.length === 0 ? (
              <div className="w-full h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Mail className="w-8 h-8 text-slate-700 mb-2" />
                <span>No simulated emails sent.</span>
                <span className="text-[10px] text-slate-600 mt-0.5">Use the "Gmail Outbox Send" node type in your flow.</span>
              </div>
            ) : (
              <>
                {/* Inbox List */}
                <div className="w-full md:w-1/2 overflow-y-auto space-y-1.5 pr-1 max-h-52">
                  <span className="text-[10px] uppercase font-bold text-slate-550 block mb-1">Gmail Inbox Simulation</span>
                  {gmailMessages.map((mail) => (
                    <button
                      id={`btn-mail-${mail.id}`}
                      key={mail.id}
                      onClick={() => setSelectedMail(mail)}
                      className={`w-full text-left p-2 rounded-lg border text-xs cursor-pointer transition-colors block ${
                        selectedMail?.id === mail.id
                          ? "bg-sky-500/10 border-sky-550 text-white"
                          : "bg-slate-900 border-slate-850 text-slate-300 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate text-[11px] text-sky-400">{mail.title}</span>
                        <span className="text-[9px] text-slate-550 shrink-0">{mail.timestamp.split("T")[1]?.slice(0,5) || "12:00"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">To: {mail.sender}</div>
                    </button>
                  ))}
                </div>

                {/* Email Viewer */}
                <div className="flex-1 bg-slate-900 border border-slate-850 p-3 rounded-xl max-h-52 overflow-y-auto leading-normal">
                  {selectedMail ? (
                    <div className="space-y-2">
                      <div className="border-b border-slate-800 pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs text-white">{selectedMail.title}</h4>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {selectedMail.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Recipient: </span>
                          <span className="font-mono text-slate-355">{selectedMail.sender}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed pt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-850/60 font-mono">
                        {selectedMail.content}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                      <Eye className="w-6 h-6 mb-1 text-slate-700" />
                      <span>Select an email on the left list to view.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
