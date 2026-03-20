import { getAccessTokenForConnection } from '@auth0/nextjs-auth0';

/**
 * Retrieves the GitHub access token for the currently authenticated user
 * via Auth0 Token Vault (Connected Accounts).
 *
 * Uses only named exports — no Auth0Client instance — to stay compatible
 * with handleAuth / getSession named-export usage elsewhere in the app.
 *
 * Returns `undefined` when GitHub is not connected; callers degrade gracefully.
 */
export async function getGitHubToken(): Promise<string | undefined> {
  try {
    const { token } = await getAccessTokenForConnection({ connection: 'github' });
    return token;
  } catch (err) {
    console.warn(
      '[auth0] Token Vault: GitHub token unavailable:',
      (err as Error).message,
    );
    return undefined;
  }
}
