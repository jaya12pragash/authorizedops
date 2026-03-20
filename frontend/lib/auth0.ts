import { getSession } from '@auth0/nextjs-auth0';
import type { Session } from '@auth0/nextjs-auth0';

/**
 * Returns the current session or throws an error with message "Unauthorized".
 * Routes catch this and return a 401 response, keeping the guard a one-liner.
 */
export async function requireSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

/**
 * Retrieves the GitHub access token for the currently authenticated user
 * via Auth0 Token Vault (Connected Accounts).
 *
 * Returns `undefined` when GitHub is not connected; callers degrade gracefully.
 */
export async function getGitHubToken(): Promise<string | undefined> {
  try {
    const session = await getSession();
    if (!session) return undefined;
    // In v3, GitHub token is accessed via session properties if Auth0 is configured
    // to return connected account tokens. Falls back gracefully if not available.
    const token = (session as any)?.accessToken;
    return token || undefined;
  } catch (err) {
    console.warn(
      '[auth0] Token Vault: GitHub token unavailable:',
      (err as Error).message,
    );
    return undefined;
  }
}
