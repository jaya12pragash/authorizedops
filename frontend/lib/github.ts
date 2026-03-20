// ---------------------------------------------------------------------------
// GitHub service
//
// fetchPullRequests(token) — live GitHub API when a token is supplied.
// fetchPullRequestsSafe(token) — safe wrapper; never throws, returns { pulls, unavailable }.
//
// The token is obtained at call-site via Auth0 Token Vault:
//   auth0.getAccessTokenForConnection({ connection: 'github' })
// Falls back to mock data when the token or GITHUB_REPO env var is absent.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewState = 'awaiting_review' | 'changes_requested' | 'approved';

export interface GitHubPullRequest {
  number: number;
  title: string;
  author: string;
  state: ReviewState;
  ageInDays: number;
  blocksRelease: boolean;
  url: string;
}

export interface GitHubPullsResponse {
  pulls: GitHubPullRequest[];
}

// ---------------------------------------------------------------------------
// Mock data  (mirrors a realistic repo state)
// ---------------------------------------------------------------------------

const MOCK_PULLS: GitHubPullRequest[] = [
  {
    number: 193,
    title: 'refactor token vault middleware',
    author: 'alice',
    state: 'awaiting_review',
    ageInDays: 2,
    blocksRelease: true,
    url: 'https://github.com/org/repo/pull/193',
  },
  {
    number: 189,
    title: 'add OAuth2 PKCE flow',
    author: 'bob',
    state: 'changes_requested',
    ageInDays: 1,
    blocksRelease: false,
    url: 'https://github.com/org/repo/pull/189',
  },
  {
    number: 185,
    title: 'update dependencies to latest stable',
    author: 'carol',
    state: 'approved',
    ageInDays: 3,
    blocksRelease: false,
    url: 'https://github.com/org/repo/pull/185',
  },
];

// ---------------------------------------------------------------------------
// Real-API shape mapper (used when live fetch is enabled)
// ---------------------------------------------------------------------------

interface GitHubApiPull {
  number: number;
  title: string;
  user: { login: string };
  html_url: string;
  created_at: string;
  labels: Array<{ name: string }>;
}

function mapApiPull(raw: GitHubApiPull): GitHubPullRequest {
  const created = new Date(raw.created_at);
  const ageInDays = Math.floor(
    (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
  const blocksRelease = raw.labels.some((l) =>
    /blocker|release/i.test(l.name),
  );
  return {
    number: raw.number,
    title: raw.title,
    author: raw.user.login,
    // review state requires a separate API call; default to awaiting_review
    state: 'awaiting_review',
    ageInDays,
    blocksRelease,
    url: raw.html_url,
  };
}

// ---------------------------------------------------------------------------
// Public service function
// ---------------------------------------------------------------------------

/**
 * Returns open pull requests for the configured repository.
 *
 * Pass a GitHub personal-access-token (or installation token) to enable the
 * live GitHub API path.  Without a token the function returns mock data so
 * the rest of the application can be developed and tested without credentials.
 */
export async function fetchPullRequests(
  token?: string,
): Promise<GitHubPullRequest[]> {
  if (token) {
    const repo = process.env.GITHUB_REPO;
    if (!repo) {
      console.warn('[github] GITHUB_REPO not set — falling back to mock data');
      return MOCK_PULLS;
    }

    const res = await fetch(
      `https://api.github.com/repos/${repo}/pulls?state=open&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) {
      console.error(`[github] API error ${res.status} for repo ${repo}`);
      return MOCK_PULLS;
    }
    const json: GitHubApiPull[] = await res.json();
    return json.map(mapApiPull);
  }

  // No token — Token Vault not connected for this user; return mock data.
  return MOCK_PULLS;
}

// ---------------------------------------------------------------------------
// Formatting helpers (shared by API routes and plan builders)
// ---------------------------------------------------------------------------

const STATE_ICON: Record<ReviewState, string> = {
  awaiting_review: '⏳',
  changes_requested: '🔄',
  approved: '✅',
};

const STATE_LABEL: Record<ReviewState, string> = {
  awaiting_review: 'awaiting review',
  changes_requested: 'changes requested',
  approved: 'approved — merge pending',
};

/** Formats a single PR as a fixed-width summary line for draft outputs. */
export function formatPRLine(pr: GitHubPullRequest): string {
  const icon = STATE_ICON[pr.state];
  const label = STATE_LABEL[pr.state];
  const age = pr.ageInDays === 1 ? '1 d old' : `${pr.ageInDays} d old`;
  const priority = pr.blocksRelease ? '  ← priority' : '';
  const paddedTitle = pr.title.length > 38
    ? pr.title.slice(0, 35) + '…'
    : pr.title.padEnd(38);
  return `  #${pr.number}  ${paddedTitle}  ${icon} ${label.padEnd(24)} ${age}${priority}`;
}

/** Returns the highest-priority PR (blocks release, then oldest). */
export function getTopPriority(
  pulls: GitHubPullRequest[],
): GitHubPullRequest | undefined {
  const blockers = pulls.filter((p) => p.blocksRelease);
  const pool = blockers.length > 0 ? blockers : pulls;
  return pool.reduce<GitHubPullRequest | undefined>((top, pr) => {
    if (!top) return pr;
    return pr.ageInDays > top.ageInDays ? pr : top;
  }, undefined);
}

// ---------------------------------------------------------------------------
// Safe fetch wrapper — never throws; callers check `unavailable` instead
// ---------------------------------------------------------------------------

export interface GitHubFetchResult {
  pulls: GitHubPullRequest[];
  unavailable: boolean;
}

export async function fetchPullRequestsSafe(
  token?: string,
): Promise<GitHubFetchResult> {
  try {
    const pulls = await fetchPullRequests(token);
    return { pulls, unavailable: false };
  } catch (err) {
    console.error('[github] fetchPullRequests failed:', err);
    return { pulls: [], unavailable: true };
  }
}
