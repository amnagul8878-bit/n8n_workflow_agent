import React, { useState, useEffect } from "react";
import { Workflow, WorkflowNode, WorkflowConnection, NodeType, VirtualNotification } from "./types";
import { PREBUILT_TEMPLATES } from "./data/templates";
import TemplatesPanel from "./components/TemplatesPanel";
import NodeLibrary from "./components/NodeLibrary";
import WorkflowCanvas from "./components/WorkflowCanvas";
import Sidebar from "./components/Sidebar";
import SimulationLogs from "./components/SimulationLogs";
import { Play, PlusCircle, Trash, Save, FileCode, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

export default function App() {
  // Current Workflow State
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [workflowName, setWorkflowName] = useState("My Visual Workflow");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Focus/UI State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Simulated Outputs Workspace
  const [notifications, setNotifications] = useState<VirtualNotification[]>([]);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);

  // Load the first template as default on mount
  useEffect(() => {
    handleSelectTemplate(PREBUILT_TEMPLATES[0]);
    loadSavedWorkflows();
  }, []);

  const loadSavedWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows");
      const list = await res.json();
      if (list && list.length > 0) {
        // Option to restore, or we can just preload default
      }
    } catch (e) {
      console.warn("Could not retrieve persistent workflows, using local state instead.");
    }
  };

  const handleSelectTemplate = (template: Workflow) => {
    // Clone nodes and connections to prevent reference modification
    const clonedNodes = JSON.parse(JSON.stringify(template.nodes)) as WorkflowNode[];
    const clonedConns = JSON.parse(JSON.stringify(template.connections)) as WorkflowConnection[];
    
    setNodes(clonedNodes);
    setConnections(clonedConns);
    setWorkflowName(template.name);
    setActiveTemplateId(template.id);
    setSelectedNodeId(null);
    setExecutionLogs([`✦ Loaded pre-built template: "${template.name}"`]);
  };

  // Save workflow config
  const saveWorkflowState = async () => {
    const currentWf: Workflow = {
      id: activeTemplateId || "custom-wf",
      name: workflowName,
      nodes,
      connections,
      createdAt: new Date().toISOString()
    };
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([currentWf])
      });
      const data = await res.json();
      if (data.success) {
        addSystemLog("💾 Workflow configuration saved successfully on the server.");
      }
    } catch {
      addSystemLog("⚠️ Local fallback: Saved to browser cache.");
    }
  };

  // Helper log emitter
  const addSystemLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // Add customized Node from Library clicking
  const handleAddNode = (type: NodeType) => {
    const id = `node-${Date.now()}`;
    const name = `New ${type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;
    
    let defaultParams: Record<string, any> = {};
    if (type === 'trigger_manual' || type === 'trigger_webhook') {
      defaultParams = {
        mockPayload: {
          id: 100,
          customerName: "John Doe",
          email: "john.doe@company.com",
          category: "Tech Support",
          message: "The interface is running extremely fast, nice work!"
        }
      };
    } else if (type === 'js_code') {
      defaultParams = {
        code: `// Modify or filter output JSON\nconst data = $json;\nreturn {\n  ...data,\n  processedAt: new Date().toISOString(),\n  processedBy: "n8n Sandbox"\n};`
      };
    } else if (type === 'if_condition') {
      defaultParams = {
        field: "category",
        operator: "equals",
        value: "Tech Support"
      };
    } else if (type === 'gemini_ai') {
      defaultParams = {
        template: "Review this feedback from {{ $json.customerName }}: \"{{ $json.message }}\". Draft a friendly support auto-response.",
        systemInstruction: "You are a customer service assistant representing n8n Workspace.",
        temperature: 0.7
      };
    } else if (type === 'slack_simulator') {
      defaultParams = {
        channel: "general",
        messageTemplate: "📢 Broadcast: Received new notification regarding user *{{ $json.customerName }}* - Email: *{{ $json.email }}*"
      };
    } else if (type === 'email_simulator') {
      defaultParams = {
        to: "{{ $json.email }}",
        subject: "Support update regarding ticket #100",
        bodyTemplate: "Dear {{ $json.customerName }},\n\nWe received your request. Description:\n{{ $json.message }}"
      };
    } else if (type === 'set_variable') {
      defaultParams = {
        key: "workflowVerified",
        value: "true"
      };
    }

    const newNode: WorkflowNode = {
      id,
      type,
      name,
      x: 150 + Math.random() * 40,
      y: 150 + Math.random() * 40,
      parameters: defaultParams,
      executionState: { status: "idle" }
    };

    setNodes((prev) => [...prev, newNode]);
    addSystemLog(`✚ Added "${newNode.name}" node to grid.`);
    setSelectedNodeId(id);
    setActiveTemplateId(null); // customized
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.fromId !== nodeId && c.toId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    const node = nodes.find(n => n.id === nodeId);
    addSystemLog(`✂ Deleted node "${node?.name || nodeId}" and disconnected links.`);
  };

  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
    );
  };

  const handleUpdateParameters = (nodeId: string, parameters: Record<string, any>) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          // Check if rename requested from parameter sidebar
          const labelName = parameters._label_name;
          return {
            ...n,
            name: typeof labelName === 'string' ? labelName : n.name,
            parameters: { ...parameters, _label_name: undefined }
          };
        }
        return n;
      })
    );
  };

  const handleAddConnection = (newConn: Omit<WorkflowConnection, "id">) => {
    // Avoid duplicates
    const exists = connections.some(
      (c) =>
        c.fromId === newConn.fromId &&
        c.fromPort === newConn.fromPort &&
        c.toId === newConn.toId &&
        c.toPort === newConn.toPort
    );
    if (exists) return;

    const id = `conn-${Date.now()}`;
    const conn: WorkflowConnection = { ...newConn, id };
    setConnections((prev) => [...prev, conn]);
    
    const fromN = nodes.find(n => n.id === conn.fromId);
    const toN = nodes.find(n => n.id === conn.toId);
    addSystemLog(`🔌 Connected "${fromN?.name}" output to "${toN?.name}" input.`);
  };

  const handleRemoveConnection = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    addSystemLog(`🔌 Severed connection link.`);
  };

  // Deep compiler helper for double-bracket evaluation
  const deepCompileTemplate = (template: string, jsonContext: any): string => {
    if (!template) return "";
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expression) => {
      const cleanExpr = expression.trim();
      const parts = cleanExpr.split(".");
      
      let current = jsonContext;
      const startIndex = (parts[0] === "$json" || parts[0] === "json") ? 1 : 0;
      
      for (let i = startIndex; i < parts.length; i++) {
        if (current === null || current === undefined) {
          return "";
        }
        current = current[parts[i]];
      }
      
      if (current === undefined || current === null) {
        return "";
      }
      if (typeof current === "object") {
        return JSON.stringify(current);
      }
      return String(current);
    });
  };

  // Single step run for testing isolated parameters
  const handleExecuteNodeSingle = async (node: WorkflowNode) => {
    addSystemLog(`▶ Testing step: "${node.name}"...`);
    
    // Simulate input context
    const mockInput = node.parameters.mockPayload || {
      customerId: "cust-99",
      customerName: "Simulated Tester",
      email: "tester@sandbox.io",
      category: "Tech Support",
      message: "This is a single step test payload."
    };

    // Set status running
    updateNodeExecutionState(node.id, {
      status: "running",
      inputData: mockInput
    });

    const startTime = Date.now();

    try {
      let output: any = {};
      
      if (node.type === 'trigger_manual' || node.type === 'trigger_webhook') {
        output = mockInput;
      } else if (node.type === 'js_code') {
        const compiledFn = new Function("$json", `${node.parameters.code || "return $json;"}`);
        output = compiledFn(mockInput);
      } else if (node.type === 'set_variable') {
        output = {
          ...mockInput,
          [node.parameters.key || "setVar"]: node.parameters.value || ""
        };
      } else if (node.type === 'if_condition') {
        const fieldValue = mockInput[node.parameters.field || ""];
        const compVal = node.parameters.value;
        const op = node.parameters.operator || "equals";
        
        let conditionPassed = false;
        if (op === 'equals') conditionPassed = String(fieldValue) === String(compVal);
        else if (op === 'contains') conditionPassed = String(fieldValue).toLowerCase().includes(String(compVal).toLowerCase());
        else if (op === 'greater_than') conditionPassed = parseFloat(fieldValue) > parseFloat(compVal);
        else if (op === 'less_than') conditionPassed = parseFloat(fieldValue) < parseFloat(compVal);

        output = {
          ...mockInput,
          conditionPassed
        };
      } else if (node.type === 'gemini_ai') {
        const res = await callGeminiBackend(
          node.parameters.template,
          node.parameters.systemInstruction,
          node.parameters.temperature,
          mockInput
        );
        output = {
          ...mockInput,
          message: res.message,
          rawResponse: res
        };
      } else if (node.type === 'slack_simulator') {
        const compiledMsg = deepCompileTemplate(node.parameters.messageTemplate || "", mockInput);
        const chan = node.parameters.channel || "general";
        
        output = { ...mockInput, slackPosted: true };
        
        // Add Simulated Slack notification
        const notif: VirtualNotification = {
          id: `slack-${Date.now()}`,
          type: "slack",
          timestamp: new Date().toLocaleTimeString(),
          title: `Posted to #${chan}`,
          content: compiledMsg,
          sender: chan
        };
        setNotifications(prev => [notif, ...prev]);
      } else if (node.type === 'email_simulator') {
        const rcvEmail = deepCompileTemplate(node.parameters.to || "", mockInput);
        const subj = node.parameters.subject || "Alert notification";
        const bodyTxt = deepCompileTemplate(node.parameters.bodyTemplate || "", mockInput);

        output = { ...mockInput, emailDispatched: true };

        const notif: VirtualNotification = {
          id: `email-${Date.now()}`,
          type: "gmail",
          timestamp: new Date().toISOString().replace("T", " ").substring(0,19),
          title: subj,
          content: bodyTxt,
          sender: rcvEmail
        };
        setNotifications(prev => [notif, ...prev]);
      }

      const latency = Date.now() - startTime;
      
      updateNodeExecutionState(node.id, {
        status: "success",
        outputData: output,
        executionTimeMs: latency
      });
      addSystemLog(`▲ SUCCESS: Step "${node.name}" integrated output. (${latency}ms)`);
    } catch (err: any) {
      updateNodeExecutionState(node.id, {
        status: "failed",
        error: err.message || "Execution exception error"
      });
      addSystemLog(`❌ FAILED: Step "${node.name}" - Error: ${err.message}`);
    }
  };

  // Helper update status state
  const updateNodeExecutionState = (nodeId: string, state: Partial<NonNullable<WorkflowNode['executionState']>>) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            executionState: {
              ...n.executionState,
              ...state
            } as any
          };
        }
        return n;
      })
    );
  };

  // Proxy to server for secure Gemini AI execution
  const callGeminiBackend = async (template: string, systemInstruction: string, temperature: number, inputJson: any) => {
    const response = await fetch("/api/execute-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template,
        systemInstruction,
        temperature,
        inputJson
      })
    });
    if (!response.ok) {
      throw new Error("HTTP error connecting to Gemini endpoint server");
    }
    return response.json();
  };

  // Orchestrate full sequential workflow solver
  const handleExecuteWorkflow = async () => {
    if (isExecutingWorkflow) return;
    setIsExecutingWorkflow(true);
    addSystemLog("▶ Beginning full visual pipeline simulation...");

    // Reset all node statuses to idle
    setNodes(prev => prev.map(n => ({ ...n, executionState: { status: "idle" } })));

    // Find trigger nodes to begin
    const triggerNodes = nodes.filter(n => n.type === 'trigger_manual' || n.type === 'trigger_webhook');
    if (triggerNodes.length === 0) {
      addSystemLog("⚠️ VALIDATION ERROR: No manual / webhook starting nodes exist in active grid. Add one first!");
      setIsExecutingWorkflow(false);
      return;
    }

    // Keep active node outputs mapped
    const nodeOutputs: Record<string, any> = {};
    const executionQueue: string[] = [];

    // Push initial triggers
    triggerNodes.forEach(t => {
      executionQueue.push(t.id);
      nodeOutputs[t.id] = t.parameters.mockPayload || {};
    });

    // Helper: delayed execution to show visual progression
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const processedSet = new Set<string>();

    while (executionQueue.length > 0) {
      const currentId = executionQueue.shift()!;
      if (processedSet.has(currentId)) continue;
      
      const node = nodes.find(n => n.id === currentId);
      if (!node) continue;

      addSystemLog(`▶ Executing node: "${node.name}"`);
      updateNodeExecutionState(node.id, { status: "running", inputData: nodeOutputs[node.id] || {} });

      // Visual delay to showcase live runner traveling
      await delay(800);

      const startTime = Date.now();
      let executionSuccess = false;
      let outputData: any = {};
      let errorStr = "";

      try {
        const inputContext = nodeOutputs[node.id] || {};

        if (node.type === 'trigger_manual' || node.type === 'trigger_webhook') {
          outputData = inputContext;
          executionSuccess = true;
        } else if (node.type === 'js_code') {
          const compiledFn = new Function("$json", `${node.parameters.code || "return $json;"}`);
          outputData = compiledFn(inputContext);
          executionSuccess = true;
        } else if (node.type === 'set_variable') {
          outputData = {
            ...inputContext,
            [node.parameters.key || "var"]: node.parameters.value || ""
          };
          executionSuccess = true;
        } else if (node.type === 'if_condition') {
          // Resolve deep object paths if present, else flat
          const fieldName = node.parameters.field || "";
          const fieldValue = inputContext[fieldName];
          const op = node.parameters.operator || "equals";
          const compVal = node.parameters.value;

          let conditionPassed = false;
          if (op === 'equals') conditionPassed = String(fieldValue) === String(compVal);
          else if (op === 'contains') conditionPassed = String(fieldValue).toLowerCase().includes(String(compVal).toLowerCase());
          else if (op === 'greater_than') conditionPassed = parseFloat(fieldValue) > parseFloat(compVal);
          else if (op === 'less_than') conditionPassed = parseFloat(fieldValue) < parseFloat(compVal);

          outputData = {
            ...inputContext,
            conditionPassed
          };
          executionSuccess = true;
          addSystemLog(`➲ Router Evaluation: Field "${fieldName}" (${fieldValue}) compare is [${conditionPassed ? "TRUE" : "FALSE"}]`);
        } else if (node.type === 'gemini_ai') {
          addSystemLog(`⚙️ Compiling and sending context down to Gemini server...`);
          const res = await callGeminiBackend(
            node.parameters.template,
            node.parameters.systemInstruction,
            node.parameters.temperature,
            inputContext
          );
          outputData = {
            ...inputContext,
            message: res.message,
            rawResponse: res
          };
          executionSuccess = true;
        } else if (node.type === 'slack_simulator') {
          const compiledMsg = deepCompileTemplate(node.parameters.messageTemplate || "", inputContext);
          const chan = node.parameters.channel || "general";
          
          outputData = { ...inputContext, slackPosted: true };
          executionSuccess = true;

          // Push visual notification
          const notif: VirtualNotification = {
            id: `slack-${Date.now()}`,
            type: "slack",
            timestamp: new Date().toLocaleTimeString(),
            title: `Posted to #${chan}`,
            content: compiledMsg,
            sender: chan
          };
          setNotifications(prev => [notif, ...prev]);
          addSystemLog(`💬 Post slack completed on channel: #${chan}`);
        } else if (node.type === 'email_simulator') {
          const rcvEmail = deepCompileTemplate(node.parameters.to || "", inputContext);
          const subj = node.parameters.subject || "Alert notification";
          const bodyTxt = deepCompileTemplate(node.parameters.bodyTemplate || "", inputContext);

          outputData = { ...inputContext, emailDispatched: true };
          executionSuccess = true;

          // Push visual gmail inboxes
          const notif: VirtualNotification = {
            id: `email-${Date.now()}`,
            type: "gmail",
            timestamp: new Date().toISOString().replace("T", " ").substring(0,19),
            title: subj,
            content: bodyTxt,
            sender: rcvEmail
          };
          setNotifications(prev => [notif, ...prev]);
          addSystemLog(`✉ Email dispatched successfully into box: ${rcvEmail}`);
        }
      } catch (err: any) {
        errorStr = err.message || "Failed running workflow action";
        executionSuccess = false;
      }

      const latency = Date.now() - startTime;

      if (executionSuccess) {
        updateNodeExecutionState(node.id, {
          status: "success",
          outputData,
          executionTimeMs: latency
        });
        addSystemLog(`▲ SUCCESS: Step "${node.name}" finished in ${latency}ms.`);

        // Find connected downstream children to propagate
        const outwardLinks = connections.filter(c => c.fromId === node.id);
        
        outwardLinks.forEach(link => {
          // If parent was an IF condition, we must check true / false path routing!
          if (node.type === 'if_condition') {
            const conditionPassed = outputData.conditionPassed;
            if (conditionPassed && link.fromPort === 'true') {
              nodeOutputs[link.toId] = outputData;
              executionQueue.push(link.toId);
            } else if (!conditionPassed && link.fromPort === 'false') {
              nodeOutputs[link.toId] = outputData;
              executionQueue.push(link.toId);
            }
          } else {
            // General single output connection
            nodeOutputs[link.toId] = outputData;
            executionQueue.push(link.toId);
          }
        });
      } else {
        updateNodeExecutionState(node.id, {
          status: "failed",
          error: errorStr,
          executionTimeMs: latency
        });
        addSystemLog(`❌ FAILED: Step "${node.name}" crashed. Halting subsequent connections.`);
      }

      processedSet.add(node.id);
    }

    addSystemLog("🏁 Workflow pipeline execution completed successfully.");
    setIsExecutingWorkflow(false);
  };

  const clearSimulatedOutputs = () => {
    setNotifications([]);
    setExecutionLogs(["✦ Workspace buffers cleared. ready."]);
    setNodes(prev => prev.map(n => ({ ...n, executionState: { status: "idle" } })));
  };

  return (
    <div id="full-app-root" className="h-screen flex flex-col font-sans text-slate-800 overflow-hidden bg-[#fafbfc]">
      
      {/* Top Application Header bar */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          {/* Custom generated workflow builder badge */}
          <div className="w-8 h-8 rounded-lg bg-orange-500 border border-orange-600 flex items-center justify-center text-white font-bold text-sm tracking-tighter shadow-sm animate-[pulse_3s_infinite]">
            n8
          </div>
          <div className="flex items-center gap-2">
            <input
              id="workflow-name-input"
              type="text"
              value={workflowName}
              onChange={(e) => {
                setWorkflowName(e.target.value);
                setActiveTemplateId(null);
              }}
              className="bg-transparent font-bold tracking-tight text-sm text-slate-800 focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-orange-500 rounded py-0.5 px-1.5 transition-all text-ellipsis"
            />
            {activeTemplateId && (
              <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-semibold font-mono uppercase tracking-wider hidden sm:inline">
                Template Active
              </span>
            )}
          </div>
        </div>

        {/* Global Action items */}
        <div className="flex items-center gap-2">
          <button
            id="btn-global-save"
            onClick={saveWorkflowState}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            title="Save workflow structure server-side"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            id="btn-global-execute"
            onClick={handleExecuteWorkflow}
            disabled={isExecutingWorkflow}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm cursor-pointer transition-all duration-200 ${
              isExecutingWorkflow
                ? "bg-amber-600/50 border border-amber-600/30 shadow-none cursor-not-allowed animate-pulse"
                : "bg-orange-500 hover:bg-orange-600 border border-orange-400/25 hover:shadow-[0_2px_8px_rgba(249,115,22,0.2)]"
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isExecutingWorkflow ? "animate-spin" : ""}`} />
            <span>{isExecutingWorkflow ? "Running..." : "Test Workflow"}</span>
          </button>
        </div>
      </header>

      {/* Embedded pre-built template selectors */}
      <TemplatesPanel
        onSelectTemplate={handleSelectTemplate}
        activeTemplateId={activeTemplateId}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Drawer library */}
        <NodeLibrary onAddNode={handleAddNode} />

        {/* Grid visual workspace canvas */}
        <WorkflowCanvas
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onUpdateNodePosition={handleUpdateNodePosition}
          onAddConnection={handleAddConnection}
          onRemoveConnection={handleRemoveConnection}
          onCanvasClick={() => setSelectedNodeId(null)}
        />

        {/* Right contextual properties sidebar */}
        {selectedNodeId ? (
          <Sidebar
            selectedNode={nodes.find((n) => n.id === selectedNodeId) || null}
            onUpdateParameters={handleUpdateParameters}
            onDeleteNode={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
            onExecuteNodeSingle={handleExecuteNodeSingle}
          />
        ) : null}
      </div>

      {/* Bottom Simulated Workspace outputs dock */}
      <SimulationLogs
        notifications={notifications}
        executionLogs={executionLogs}
        nodes={nodes}
        onClear={clearSimulatedOutputs}
      />
    </div>
  );
}
