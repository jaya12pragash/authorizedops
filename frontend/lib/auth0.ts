import { Auth0Client } from '@auth0/nextjs-auth0';

// Singleton server-side Auth0 client.
// Reads AUTH0_SECRET, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
// and AUTH0_BASE_URL automatically from environment variables.
export const auth0 = new Auth0Client();

/**
 * Retrieves the GitHub access token for the currently authenticated user
 * via Auth0 Token Vault (Connected Accounts).
 *
 * Returns `undefined` when the user has not connected GitHub or when Token
 * Vault is not yet configured — callers must degrade gracefully.
 */
export async function getGitHubToken(): Promise<string | undefined> {
  try {
    const { token } = await auth0.getAccessTokenForConnection({
      connection: 'github',
    });
    return token;
  } catch (err) {
    console.warn(
      '[auth0] Token Vault: GitHub token unavailable:',
      (err as Error).message,
    );
    return undefined;
  }
}
