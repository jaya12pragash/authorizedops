'use client';

import { useState } from 'react';
import PromptForm from '@/components/PromptForm';
import ApprovalCard from '@/components/ApprovalCard';
import type {
  AgentPlan,
  AgentPlanResponse,
  AgentStatus,
  AgentExecuteResult,
  AgentExecuteResponse,
} from '@/types/agent';

export default function AgentSection() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [executionResult, setExecutionResult] = useState<AgentExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePromptSubmit(prompt: string) {
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data: AgentPlanResponse | { error: string } = await res.json();

      if (!res.ok) {
        throw new Error('error' in data ? data.error : 'Failed to generate plan');
      }

      setPlan((data as AgentPlanResponse).plan);
      setStatus('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus('idle');
    }
  }

  async function handleApprove() {
    if (!plan) return;
    setStatus('executing');
    setError(null);

    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          plannedAction: plan.plannedAction,
          draftOutput: plan.draftOutput,
        }),
      });

      const data: AgentExecuteResponse | { error: string } = await res.json();

      if (!res.ok) {
        throw new Error('error' in data ? data.error : 'Execution failed');
      }

      setExecutionResult((data as AgentExecuteResponse).result);
      setStatus('executed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus('review');
    }
  }

  function handleReject() {
    setPlan(null);
    setStatus('rejected');
  }

  function handleReset() {
    setPlan(null);
    setExecutionResult(null);
    setError(null);
    setStatus('idle');
  }

  const showPromptForm = status !== 'executed';

  return (
    <>
      <section className="mb-6 rounded-lg border p-5 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Ask AuthorizedOps</h2>

        {showPromptForm ? (
          <PromptForm
            onSubmit={handlePromptSubmit}
            isLoading={status === 'loading'}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Action executed successfully.</p>
            <button
              onClick={handleReset}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              New Plan
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {status === 'rejected' && (
          <div className="mt-3 flex items-center gap-3">
            <p className="text-sm text-gray-600">Plan rejected.</p>
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </section>

      {(status === 'review' || status === 'executing') && plan && (
        <section className="mb-6 rounded-lg border p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Review Agent Plan</h2>
          <ApprovalCard
            plan={plan}
            onApprove={handleApprove}
            onReject={handleReject}
            isExecuting={status === 'executing'}
          />
        </section>
      )}

      {status === 'executed' && plan && executionResult && (
        <section className="mb-6 rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xl font-semibold">Execution Result</h2>
            <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
              {executionResult.status === 'success' ? 'Success' : 'Failed'}
            </span>
          </div>

          <p className="mb-3 text-sm text-gray-700">{executionResult.message}</p>

          <div className="mb-4 space-y-1 text-xs text-gray-500">
            <p><strong>Action:</strong> {plan.plannedAction}</p>
            <p>
              <strong>Executed at:</strong>{' '}
              {new Date(executionResult.executedAt).toLocaleString()}
            </p>
          </div>

          <pre className="whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-relaxed">
            {plan.draftOutput}
          </pre>
        </section>
      )}
    </>
  );
}
