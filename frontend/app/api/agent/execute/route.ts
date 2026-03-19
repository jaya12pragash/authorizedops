import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import type {
  AgentExecuteRequest,
  AgentExecuteResult,
  AgentExecuteResponse,
} from '@/types/agent';

// ---------------------------------------------------------------------------
// Mock execution messages keyed by plannedAction keyword
// ---------------------------------------------------------------------------

function resolveExecutionMessage(plannedAction: string): string {
  const a = plannedAction.toLowerCase();
  if (/slack/.test(a)) return 'Slack message posted to #engineering successfully.';
  if (/calendar|event|attendee/.test(a)) return 'Calendar event created and attendees notified.';
  if (/pull request|github|code.?review/.test(a)) return 'PR review summary posted to #engineering.';
  if (/email|gmail/.test(a)) return 'Email composed and queued in Gmail outbox.';
  if (/deploy|pipeline|ci\/cd|vercel/.test(a)) return 'Deployment pipeline triggered on GitHub Actions.';
  return 'Action executed successfully across connected apps.';
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<AgentExecuteRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { planId, plannedAction, draftOutput } = body;

  if (!planId || typeof planId !== 'string' || planId.trim().length === 0) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 });
  }
  if (!plannedAction || typeof plannedAction !== 'string' || plannedAction.trim().length === 0) {
    return NextResponse.json({ error: 'plannedAction is required' }, { status: 400 });
  }
  if (!draftOutput || typeof draftOutput !== 'string' || draftOutput.trim().length === 0) {
    return NextResponse.json({ error: 'draftOutput is required' }, { status: 400 });
  }

  const result: AgentExecuteResult = {
    status: 'success',
    message: resolveExecutionMessage(plannedAction.trim()),
    executedAt: new Date().toISOString(),
  };

  const response: AgentExecuteResponse = { result };
  return NextResponse.json(response);
}
