import { Auth0Client } from '@auth0/nextjs-auth0/server';
import type { Session } from '@auth0/nextjs-auth0/server';

// Shared Auth0 client instance used across all server-side routes.
// Reads credentials from environment variables at startup.
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
});

/**
 * Returns the current session or throws an error with message "Unauthorized".
 * Routes catch this and return a 401 response, keeping the guard a one-liner.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth0.getSession();
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
    const { token } = await auth0.getAccessTokenForConnection({ connection: 'github' });
    return token;
  } catch (err) {
    console.warn(
      '[auth0] Token Vault: GitHub token unavailable:',
      (err as Error).message,
    );
    return undefined;
  }
}
