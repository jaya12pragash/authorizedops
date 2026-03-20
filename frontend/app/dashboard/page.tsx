import { getSession } from "@auth0/nextjs-auth0";
import { getGitHubToken } from "@/lib/auth0";
import AgentSection from "@/components/AgentSection";
import { fetchPullRequestsSafe, getTopPriority } from "@/lib/github";

async function ConnectedAppsSection() {
  // Retrieve the GitHub token from Auth0 Token Vault for the logged-in user.
  const token = await getGitHubToken();
  const { pulls, unavailable } = await fetchPullRequestsSafe(token);
  const topPR = getTopPriority(pulls);
  // `tokenConnected` is true only when Token Vault returned a real token.
  const tokenConnected = !unavailable && token !== undefined;

  return (
    <section className="mb-6 rounded-lg border p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Connected Apps</h2>
      <ul className="space-y-2">
        <li className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 font-medium text-gray-700 w-36">Google Calendar</span>
          <span className="text-gray-500">Not connected</span>
        </li>
        <li className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 font-medium text-gray-700 w-36">GitHub</span>
          {!tokenConnected ? (
            <span className="text-amber-600">Not connected / token unavailable</span>
          ) : (
            <span className="space-y-0.5">
              <span className="font-medium text-green-600">Connected via Token Vault ✓</span>
              <span className="block text-gray-500">
                PRs: {pulls.length}
              </span>
              {topPR && (
                <span className="block text-gray-500">
                  Top PR: #{topPR.number} — {topPR.title}
                </span>
              )}
            </span>
          )}
        </li>
        <li className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 font-medium text-gray-700 w-36">Slack</span>
          <span className="text-gray-500">Not connected</span>
        </li>
      </ul>
    </section>
  );
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-3xl rounded-lg border p-6">
          <h1 className="mb-3 text-2xl font-bold">Not logged in</h1>
          <p className="mb-4 text-gray-600">
            Please log in to access the AuthorizedOps dashboard.
          </p>
          <a
            href="/api/auth/login"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Login with Auth0
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {session.user.name || session.user.email || "User"}.
            </p>
          </div>

          <a
            href="/api/auth/logout?returnTo=/"
            className="rounded-lg border border-red-300 px-4 py-2 text-xs text-red-600 hover:bg-red-50"
          >
            Logout
          </a>
        </div>

        <ConnectedAppsSection />

        <AgentSection />
      </div>
    </main>
  );
}
