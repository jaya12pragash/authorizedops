export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="mb-8 text-gray-600">
          Welcome to AuthorizedOps.
        </p>

        <section className="mb-6 rounded-lg border p-5">
          <h2 className="mb-3 text-xl font-semibold">Connected Apps</h2>
          <p className="text-sm text-gray-600">Google Calendar: Not connected yet</p>
          <p className="text-sm text-gray-600">GitHub: Not connected yet</p>
          <p className="text-sm text-gray-600">Slack: Not connected yet</p>
        </section>

        <section className="mb-6 rounded-lg border p-5">
          <h2 className="mb-3 text-xl font-semibold">Ask AuthorizedOps</h2>
          <textarea
            className="w-full rounded-lg border p-3"
            rows={5}
            placeholder="Example: Prepare my daily engineering update"
          />
          <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Run Agent
          </button>
        </section>

        <section className="rounded-lg border p-5">
          <h2 className="mb-3 text-xl font-semibold">Approval Preview</h2>
          <p className="mb-2">
            <strong>Planned action:</strong> Draft a Slack update
          </p>
          <p className="mb-2">
            <strong>Data sources:</strong> Google Calendar, GitHub
          </p>
          <div className="rounded-lg bg-gray-100 p-4 text-sm">
            Today’s update:
            <br />- 2 meetings on the calendar
            <br />- 1 PR awaiting review
            <br />- Focus: complete Auth0 Token Vault integration
          </div>

          <div className="mt-4 flex gap-3">
            <button className="rounded-lg bg-green-600 px-5 py-2 text-white">
              Approve
            </button>
            <button className="rounded-lg border px-5 py-2">
              Reject
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}