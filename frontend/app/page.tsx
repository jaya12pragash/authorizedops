import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">AuthorizedOps</h1>
        <h2 className="mb-4 text-2xl font-semibold">
          Secure AI Agent with Token Vault
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          Welcome to AuthorizedOps — your secure agentic AI application for
          performing real tasks across integrated apps.
        </p>

        <div className="mb-10 flex gap-4">
         <a
  href="/api/auth/login?returnTo=/dashboard"
  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
>
  Login
</a>

          <Link
            href="#features"
            className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
          >
            Learn More
          </Link>
        </div>

        <div id="features" className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-5">
            <h3 className="mb-2 text-xl font-semibold">AI Agent</h3>
            <p className="text-sm text-gray-600">
              Performs real tasks, not just suggestions.
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <h3 className="mb-2 text-xl font-semibold">Secure</h3>
            <p className="text-sm text-gray-600">
              Uses Auth0 and Token Vault for secure handling.
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <h3 className="mb-2 text-xl font-semibold">Multi-App</h3>
            <p className="text-sm text-gray-600">
              Connect Google, GitHub, Slack, and more.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}