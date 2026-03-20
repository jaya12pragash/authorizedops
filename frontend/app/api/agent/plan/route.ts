import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getGitHubToken } from '@/lib/auth0';
import type { AgentPlan, AgentPlanRequest } from '@/types/agent';
import {
  fetchPullRequestsSafe,
  formatPRLine,
  getTopPriority,
} from '@/lib/github';
import type { GitHubPullRequest } from '@/lib/github';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Intent = 'daily-update' | 'meeting' | 'review' | 'status' | 'email' | 'deploy';

interface PromptContext {
  /** Normalised lower-case prompt */
  raw: string;
  /** Day/time hint extracted from the prompt, or a sensible default */
  timeHint: string;
  /** First capitalised word that looks like a name, or empty string */
  personHint: string;
  /** Live (or mock) GitHub pull requests — populated for GitHub-heavy intents */
  pulls: GitHubPullRequest[];
  /** True when the GitHub fetch failed; plan builders degrade gracefully */
  githubUnavailable: boolean;
}

interface IntentPlan {
  summary: string;
  plannedAction: string;
  dataSources: string[];
  draftOutput: string;
}

// ---------------------------------------------------------------------------
// Context extraction
// ---------------------------------------------------------------------------

function extractContext(
  prompt: string,
  pulls: GitHubPullRequest[],
  githubUnavailable: boolean,
): PromptContext {
  const raw = prompt.toLowerCase();

  const timePatterns: Array<[RegExp, string]> = [
    [/\btoday\b/, 'today'],
    [/\btomorrow\b/, 'tomorrow'],
    [/\bmonday\b/, 'Monday'],
    [/\btuesday\b/, 'Tuesday'],
    [/\bwednesday\b/, 'Wednesday'],
    [/\bthursday\b/, 'Thursday'],
    [/\bfriday\b/, 'Friday'],
    [/\bmorning\b/, 'this morning'],
    [/\bafternoon\b/, 'this afternoon'],
    [/\bend of day\b|eod/, 'end of day'],
    [/\bweekly\b/, 'this week'],
  ];
  const timeMatch = timePatterns.find(([re]) => re.test(raw));
  const timeHint = timeMatch ? timeMatch[1] : 'today';

  const nameMatch = prompt.match(/(?<!\. |\? |! |^)\b([A-Z][a-z]{2,})\b/);
  const personHint = nameMatch ? nameMatch[1] : '';

  return { raw, timeHint, personHint, pulls, githubUnavailable };
}

// ---------------------------------------------------------------------------
// Intent resolution  (ordered most-specific first)
// ---------------------------------------------------------------------------

function resolveIntent(raw: string): Intent {
  if (/\b(deploy|release|ship|rollout|pipeline|ci\/cd)\b/.test(raw)) return 'deploy';
  if (/\b(email|send email|draft email|compose|mail)\b/.test(raw)) return 'email';
  if (/\b(meeting|schedule|calendar|invite|standup|sync|book)\b/.test(raw)) return 'meeting';
  if (/\b(pr|pull request|code review|review pr|open prs?|merge)\b/.test(raw)) return 'review';
  if (/\b(daily update|status update|daily standup note|post.*update|send.*update|update)\b/.test(raw)) return 'daily-update';
  return 'status';
}

// Intents that benefit from live GitHub PR data
function needsGitHubData(intent: Intent): boolean {
  return intent === 'review' || intent === 'daily-update' || intent === 'status';
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildPRBlock(pulls: GitHubPullRequest[], unavailable = false): string[] {
  if (unavailable) return ['  GitHub data unavailable — plan generated without live PR context.'];
  if (pulls.length === 0) return ['  No open pull requests.'];
  return pulls.map(formatPRLine);
}

// ---------------------------------------------------------------------------
// Per-intent plan builders
// ---------------------------------------------------------------------------

function buildDailyUpdatePlan(ctx: PromptContext): IntentPlan {
  const { timeHint, personHint, pulls, githubUnavailable } = ctx;
  const recipient = personHint ? `for ${personHint}` : 'for the engineering team';
  const openCount = pulls.length;
  const prLines = buildPRBlock(pulls, githubUnavailable);
  const topPR = getTopPriority(pulls);
  const prSummary = githubUnavailable
    ? 'GitHub unavailable'
    : openCount === 1 ? '1 open PR' : `${openCount} open PRs`;

  return {
    summary: githubUnavailable
      ? `I will compile ${timeHint}'s activity from Calendar and Jira and draft a Slack update ${recipient}. Note: GitHub data was unavailable.`
      : `I will compile ${timeHint}'s activity from Calendar, GitHub, and Jira, then draft a Slack update ${recipient}.`,
    plannedAction: 'Draft and post a Slack engineering status update',
    dataSources: ['Google Calendar', 'GitHub Pull Requests', 'Jira Tickets', 'Slack'],
    draftOutput: [
      `📋  Engineering Daily Update — ${cap(timeHint)}`,
      ``,
      `Meetings`,
      `  • 9:00 am  — Morning standup (15 min, 4 attendees)`,
      `  • 3:00 pm  — Sprint review`,
      ``,
      `GitHub  (${prSummary})`,
      ...prLines,
      ...(topPR ? [``, `  Next action: review #${topPR.number} — ${topPR.title}`] : []),
      ``,
      `Jira`,
      `  • 3 tickets moved to In Progress`,
      `  • 1 blocker raised: AUTH-42 (token expiry edge case)`,
      ``,
      `Focus for ${timeHint}: complete Auth0 Token Vault integration (80% done)`,
      ``,
      `— AuthorizedOps`,
    ].join('\n'),
  };
}

function buildMeetingPlan(ctx: PromptContext): IntentPlan {
  const { timeHint, personHint } = ctx;
  const attendees = personHint ? `${personHint}, team@company.com` : 'team@company.com';
  const when =
    timeHint === 'today'
      ? 'Today, 2:00 pm – 2:30 pm'
      : `${cap(timeHint)}, 10:00 am – 10:30 am`;
  return {
    summary: `I will create a calendar event${personHint ? ` with ${personHint}` : ''} for ${timeHint} and notify attendees via Slack.`,
    plannedAction: 'Create a Google Calendar event and send Slack notifications to attendees',
    dataSources: ['Google Calendar', 'Google Contacts', 'Slack'],
    draftOutput: [
      `📅  Calendar Event Draft`,
      ``,
      `Title:      Engineering Sync`,
      `When:       ${when}`,
      `Location:   Zoom (link auto-generated on save)`,
      `Attendees:  ${attendees}`,
      ``,
      `Agenda`,
      `  1. Sprint progress check-in`,
      `  2. Blocker review`,
      `  3. Action items assignment`,
      ``,
      `A Slack reminder will be posted to #engineering 15 minutes before.`,
      ``,
      `— AuthorizedOps`,
    ].join('\n'),
  };
}

function buildReviewPlan(ctx: PromptContext): IntentPlan {
  const { timeHint, pulls, githubUnavailable } = ctx;
  const openCount = pulls.length;
  const prLines = buildPRBlock(pulls, githubUnavailable);
  const topPR = getTopPriority(pulls);
  const countLabel = githubUnavailable
    ? 'GitHub Unavailable'
    : openCount === 1 ? '1 Open Pull Request' : `${openCount} Open Pull Requests`;

  return {
    summary: githubUnavailable
      ? `GitHub was unavailable for ${timeHint}. The plan was generated without live PR data — retry to get the latest.`
      : `I fetched ${openCount} open pull request${openCount !== 1 ? 's' : ''} from GitHub, ranked by priority, for ${timeHint}.`,
    plannedAction: 'Fetch open pull requests and compile a GitHub code-review summary',
    dataSources: ['GitHub Pull Requests', 'GitHub Commit History', 'Jira Tickets'],
    draftOutput: [
      `🔍  GitHub PR Review Summary — ${cap(timeHint)}`,
      ``,
      `${countLabel}`,
      ``,
      ...prLines,
      ``,
      ...(topPR
        ? [`Recommended action: Review #${topPR.number} (${topPR.title}) — highest priority.`]
        : ['No priority PRs at this time.']),
      ``,
      `CI status: all checks green on main.`,
      ``,
      `— AuthorizedOps`,
    ].join('\n'),
  };
}

function buildStatusPlan(ctx: PromptContext): IntentPlan {
  const { timeHint, pulls, githubUnavailable } = ctx;
  const openCount = pulls.length;
  const githubLine = githubUnavailable
    ? '  GitHub     unavailable'
    : `  GitHub     ${openCount} open PR${openCount !== 1 ? 's' : ''} · 0 failing checks · last commit 2 h ago`;

  return {
    summary: `I will pull a broad snapshot of activity across your connected apps and produce an ops summary for ${timeHint}.`,
    plannedAction: 'Compile a general operations status summary across all connected apps',
    dataSources: ['Google Calendar', 'GitHub', 'Jira Tickets', 'Slack', 'Gmail'],
    draftOutput: [
      `📊  Operations Summary — ${cap(timeHint)}`,
      ``,
      `  Calendar   1 event scheduled (standup 9 am)`,
      githubLine,
      `  Jira       5 in-progress tickets · 1 blocker`,
      `  Slack      6 unread messages in #engineering`,
      `  Gmail      2 flagged threads awaiting reply`,
      ``,
      `No incidents or alerts detected.`,
      ``,
      `— AuthorizedOps`,
    ].join('\n'),
  };
}

function buildEmailPlan(ctx: PromptContext): IntentPlan {
  const { timeHint, personHint } = ctx;
  const to = personHint ? `${personHint.toLowerCase()}@company.com` : 'stakeholders@company.com';
  return {
    summary: `I will compose an email${personHint ? ` to ${personHint}` : ''} summarising ${timeHint}'s engineering activity and queue it in Gmail.`,
    plannedAction: 'Compose and queue an outbound email via Gmail',
    dataSources: ['Gmail', 'Google Contacts', 'GitHub Pull Requests', 'Jira Tickets'],
    draftOutput: [
      `✉️  Email Draft`,
      ``,
      `To:       ${to}`,
      `Subject:  AuthorizedOps — Engineering Update`,
      ``,
      `Hi${personHint ? ` ${personHint}` : ''},`,
      ``,
      `Here is ${timeHint}'s engineering summary:`,
      `  • 2 PRs merged, 1 awaiting review`,
      `  • Auth0 Token Vault integration is in final QA (80% complete)`,
      `  • 1 blocker raised — AUTH-42 being triaged`,
      `  • No production incidents`,
      ``,
      `Next milestone: production release scheduled for end of sprint.`,
      ``,
      `Best,`,
      `AuthorizedOps`,
    ].join('\n'),
  };
}

function buildDeployPlan(ctx: PromptContext): IntentPlan {
  const { timeHint } = ctx;
  return {
    summary: `I will validate the main branch, trigger the GitHub Actions → Vercel pipeline, and post a Slack notification on completion.`,
    plannedAction: 'Trigger CI/CD pipeline and broadcast a deployment notification to Slack',
    dataSources: ['GitHub Actions', 'Vercel', 'Slack'],
    draftOutput: [
      `🚀  Deployment Plan — ${cap(timeHint)}`,
      ``,
      `Target:   Production`,
      `Branch:   main  (HEAD: a3f92c1 — "finalize token vault middleware")`,
      `Pipeline: GitHub Actions → Vercel`,
      ``,
      `Pre-flight checks`,
      `  ✓ All tests passing (142 / 142)`,
      `  ✓ No high-severity advisories (Dependabot)`,
      `  ✓ Environment variables verified`,
      `  ✓ Staging smoke tests green`,
      ``,
      `On success: post to #deployments and update Jira release ticket.`,
      ``,
      `— AuthorizedOps`,
    ].join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Dispatch table
// ---------------------------------------------------------------------------

const intentBuilders: Record<Intent, (ctx: PromptContext) => IntentPlan> = {
  'daily-update': buildDailyUpdatePlan,
  meeting: buildMeetingPlan,
  review: buildReviewPlan,
  status: buildStatusPlan,
  email: buildEmailPlan,
  deploy: buildDeployPlan,
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<AgentPlanRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = body.prompt;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  if (prompt.trim().length > 1000) {
    return NextResponse.json({ error: 'Prompt must be 1000 characters or fewer' }, { status: 400 });
  }

  const trimmedPrompt = prompt.trim();
  const intent = resolveIntent(trimmedPrompt.toLowerCase());

  // Fetch GitHub PR data only for intents that use it.
  // Token comes from Auth0 Token Vault; undefined when not connected (degrades gracefully).
  const { pulls, unavailable: githubUnavailable } = needsGitHubData(intent)
    ? await fetchPullRequestsSafe(await getGitHubToken())
    : { pulls: [], unavailable: false };

  const ctx = extractContext(trimmedPrompt, pulls, githubUnavailable);
  const { summary, plannedAction, dataSources, draftOutput } = intentBuilders[intent](ctx);

  const plan: AgentPlan = {
    id: crypto.randomUUID(),
    summary,
    plannedAction,
    dataSources,
    draftOutput,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ plan });
}
