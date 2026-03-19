import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { fetchPullRequests } from '@/lib/github';
import type { GitHubPullsResponse } from '@/lib/github';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Pass the GitHub token from the session or env when available.
  // For now fetchPullRequests falls back to mock data when no token is given.
  const token = process.env.GITHUB_TOKEN;
  const pulls = await fetchPullRequests(token);

  const response: GitHubPullsResponse = { pulls };
  return NextResponse.json(response);
}
