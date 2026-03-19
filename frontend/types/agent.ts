export interface AgentPlanRequest {
  prompt: string;
}

export interface AgentPlan {
  id: string;
  summary: string;
  plannedAction: string;
  dataSources: string[];
  draftOutput: string;
  createdAt: string;
}

export interface AgentPlanResponse {
  plan: AgentPlan;
}

export interface AgentExecuteRequest {
  planId: string;
  plannedAction: string;
  draftOutput: string;
}

export interface AgentExecuteResult {
  status: 'success' | 'failure';
  message: string;
  executedAt: string;
}

export interface AgentExecuteResponse {
  result: AgentExecuteResult;
}

export type AgentStatus =
  | 'idle'
  | 'loading'
  | 'review'
  | 'executing'
  | 'executed'
  | 'rejected';
