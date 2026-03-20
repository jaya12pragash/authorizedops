import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getGitHubToken } from '@/lib/auth0';
import { fetchPullRequestsSafe } from '@/lib/github';
import type { GitHubPullRequest } from '@/lib/github';

export interface GitHubPullsApiResponse {
  pulls: GitHubPullRequest[];
  unavailable: boolean;
  /** 'token-vault' when a live GitHub token was retrieved; 'unavailable' otherwise. */
  source: 'token-vault' | 'unavailable';
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retrieve the user's GitHub access token from Auth0 Token Vault.
  const githubToken = await getGitHubToken();
  const { pulls, unavailable } = await fetchPullRequestsSafe(githubToken);

  return NextResponse.json({
    pulls,
    unavailable,
    source: unavailable ? 'unavailable' : 'token-vault',
  } satisfies GitHubPullsApiResponse);
}
