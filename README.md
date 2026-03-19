
## 🔗 Quick Links
- 🎥 Demo: https://youtube.com/your-video
- 💻 Repo: https://github.com/jaya12pragash/authorizedops
- 🌐 Live: (if deployed)

# AuthorizedOps: Secure AI Agent with Token Vault

AuthorizedOps lets authenticated users instruct an AI agent to take action across connected apps — GitHub, Slack, Google Calendar, and Gmail. The agent reads live context, builds a plan, gets your approval, and then executes.

Built with **Auth0 for AI Agents and Token Vault** as the authentication and token-management layer.

---

## 🚀 Features

- 🤖 **Prompt-driven planning** — describe what you want; the agent infers intent and returns a structured, reviewable plan
- 🔍 **Live GitHub context** — open PRs are fetched and ranked by priority before the plan is generated
- ✅ **Approval before execution** — the agent never acts without explicit user confirmation
- ⚡ **Execution tracking** — approved plans are dispatched and results (status, message, timestamp) are shown immediately
- 🔐 **Auth0-protected routes** — every API endpoint checks the session; unauthenticated requests get a 401
- 🗝️ **Token Vault ready** — the architecture is designed to store per-user third-party tokens via Auth0 Token Vault
- 📊 **Connected Apps panel** — the dashboard shows live GitHub connection status, PR count, and top-priority PR

---

## 🧠 How It Works

```
1. User enters a prompt (e.g. "summarise open pull requests")

2. POST /api/agent/plan
   - Validates Auth0 session
   - Detects intent: update / meeting / review / deploy / email / status
   - Fetches GitHub PRs for relevant intents
   - Returns: summary, plannedAction, dataSources, draftOutput

3. User reviews the plan in the UI (ApprovalCard)
   - Full plan is visible before anything runs
   - User clicks Approve or Reject

4a. Approve → POST /api/agent/execute
    - Validates session and plan fields
    - Returns: status, message, executedAt
    - UI shows the execution result

4b. Reject → plan is discarded, form resets
```

---

## 🏗️ Architecture

```
frontend/
├── app/
│   ├── api/
│   │   ├── auth/[auth0]/route.ts      # Auth0 login / logout / callback
│   │   ├── agent/
│   │   │   ├── plan/route.ts          # POST — intent detection + plan generation
│   │   │   └── execute/route.ts       # POST — execute an approved plan
│   │   └── github/
│   │       └── pulls/route.ts         # GET  — open pull requests
│   └── dashboard/page.tsx             # Protected server component
├── components/
│   ├── AgentSection.tsx               # Manages the full plan → review → execute flow
│   ├── ApprovalCard.tsx               # Renders the plan and handles approve/reject
│   └── PromptForm.tsx                 # Prompt input with character limit and loading state
├── lib/
│   └── github.ts                      # GitHub service — mock data now, real API swap-ready
└── types/
    └── agent.ts                       # Shared TypeScript interfaces
```

The plan and execute routes are separate by design: planning is cheap and reversible; execution is not. Keeping them as distinct API calls makes the approval boundary explicit and auditable.

---

## 🔄 Intent → Action Mapping

| Prompt keywords | Intent | Data sources |
|---|---|---|
| update, status update, daily update | `daily-update` | Calendar · GitHub PRs · Jira · Slack |
| meeting, schedule, calendar, sync | `meeting` | Google Calendar · Contacts · Slack |
| pr, pull request, code review, merge | `review` | GitHub PRs · Commit history · Jira |
| deploy, release, ship, pipeline | `deploy` | GitHub Actions · Vercel · Slack |
| email, send, compose, mail | `email` | Gmail · Contacts · GitHub PRs |
| _(default)_ | `status` | All connected apps |

---

## 🛡️ Why Approval Before Execution

The agent has access to real app integrations. A plan that looks reasonable from a prompt can have unintended consequences when executed — posting to the wrong channel, creating a duplicate calendar event, or triggering a deployment at the wrong time.

The approval step exists so users stay in control. The agent proposes; the user decides. Nothing runs without an explicit "Approve" click.

---

## 🔬 What's Real vs Mocked

| Component | Status |
|---|---|
| Auth0 authentication | ✅ Real |
| Agent plan API (intent detection, context) | ✅ Real |
| GitHub PR fetch | ✅ Real (falls back to mock without token) |
| Execute API (session check, validation, response) | ✅ Real |
| Slack message posting | 🟡 Mocked |
| Google Calendar event creation | 🟡 Mocked |
| Gmail sending | 🟡 Mocked |
| Auth0 Token Vault (per-user token storage) | 🟡 Architecture in place, not wired |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Auth:** Auth0 (`@auth0/nextjs-auth0`)
- **External data:** GitHub REST API (mock by default; see setup to enable)
- **AI layer:** Rule-based intent engine — the integration point for a real LLM is clearly marked

---

## ⚙️ Getting Started

See [SETUP.md](./SETUP.md) for full environment variable and Auth0 configuration details.

```bash
git clone https://github.com/jaya12pragash/authorizedops
cd authorizedops/frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## 🔌 Enabling Live GitHub Data

1. Create a GitHub personal access token with `repo` scope
2. Add to `frontend/.env.local`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_REPO=org/repo
   ```
3. In `lib/github.ts`, uncomment the live fetch block inside `fetchPullRequests()`

Without a token the app uses mock PR data and all other features work normally.

---

## 🔮 Roadmap

- [ ] Auth0 Token Vault — store per-user GitHub / Slack / Google tokens
- [ ] Real Slack execution — post approved messages to a channel
- [ ] Real GitHub execution — post review comments on PRs
- [ ] Real Google Calendar integration — create events from approved plans
- [ ] Execution audit log — persist a record of approved and executed plans
- [ ] Multi-step agent plans

