export type NodeType =
  | 'trigger_manual'
  | 'trigger_webhook'
  | 'js_code'
  | 'gemini_ai'
  | 'if_condition'
  | 'slack_simulator'
  | 'email_simulator'
  | 'set_variable';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  // Node parameters
  parameters: Record<string, any>;
  // Execution state & results
  executionState?: {
    status: 'idle' | 'running' | 'success' | 'failed';
    error?: string;
    inputData?: any;
    outputData?: any;
    executionTimeMs?: number;
  };
}

export interface WorkflowConnection {
  id: string;
  fromId: string;
  fromPort: 'output' | 'true' | 'false';
  toId: string;
  toPort: 'input';
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
}

export interface VirtualNotification {
  id: string;
  type: 'slack' | 'gmail';
  timestamp: string;
  title: string;
  content: string;
  sender: string;
}

export interface TestExecutionResult {
  nodeId: string;
  status: 'success' | 'failed';
  outputData: any;
  error?: string;
}
