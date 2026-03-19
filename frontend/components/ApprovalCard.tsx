'use client';

import type { AgentPlan } from '@/types/agent';

interface ApprovalCardProps {
  plan: AgentPlan;
  onApprove: () => void;
  onReject: () => void;
  isExecuting?: boolean;
}

export default function ApprovalCard({
  plan,
  onApprove,
  onReject,
  isExecuting = false,
}: ApprovalCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Summary
        </span>
        <p className="mt-1 text-sm">{plan.summary}</p>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Planned Action
        </span>
        <p className="mt-1 text-sm">{plan.plannedAction}</p>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Data Sources
        </span>
        <div className="mt-1 flex flex-wrap gap-2">
          {plan.dataSources.map((source) => (
            <span
              key={source}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {source}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Draft Output
        </span>
        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed">
          {plan.draftOutput}
        </pre>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onApprove}
          disabled={isExecuting}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? 'Executing…' : 'Approve & Execute'}
        </button>
        <button
          onClick={onReject}
          disabled={isExecuting}
          className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
