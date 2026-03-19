# AuthorizedOps — Setup Guide

## Project Structure

```
authorizedops/
├── frontend/                          # Next.js 14 App Router application
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[auth0]/          # Auth0 login / logout / callback handler
│   │   │   ├── agent/plan/            # POST — generate agent plan from prompt
│   │   │   ├── agent/execute/         # POST — execute approved plan
│   │   │   └── github/pulls/          # GET  — open pull requests
│   │   └── dashboard/                 # Protected dashboard page
│   ├── components/
│   │   ├── AgentSection.tsx           # Client — full plan → review → execute flow
│   │   ├── ApprovalCard.tsx           # Client — plan review UI
│   │   └── PromptForm.tsx             # Client — prompt input
│   ├── lib/
│   │   └── github.ts                  # GitHub service layer (mock + real API)
│   ├── types/
│   │   └── agent.ts                   # Shared TypeScript interfaces
│   ├── .env.local                     # Frontend environment variables
│   └── package.json
├── backend/                           # Node.js Express server (future use)
│   ├── server.js
│   └── package.json
├── README.md
└── SETUP.md
```

---

## Prerequisites

- Node.js 18+
- npm 9+
- An Auth0 account with a Regular Web Application configured

---

## Installation

```bash
cd frontend
npm install
```

---

## Environment Variables

Create `frontend/.env.local` with the following:

```bash
# Auth0  (required)
AUTH0_SECRET=a-long-random-secret-at-least-32-chars
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<your-auth0-domain>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>

# GitHub  (optional — mock data used when absent)
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_REPO=org/repo
```

Auth0 **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`  
Auth0 **Allowed Logout URLs**: `http://localhost:3000`

---

## Development

```bash
cd frontend
npm run dev
```

App runs at `http://localhost:3000`.

---

## Agent Flow — API Routes

### `POST /api/agent/plan`

Requires Auth0 session. Accepts:
```json
{ "prompt": "summarise open pull requests" }
```
Returns an `AgentPlan` with `summary`, `plannedAction`, `dataSources`, and `draftOutput`.
Fetches live GitHub PR data for `review`, `daily-update`, and `status` intents.  
Degrades gracefully if GitHub is unavailable.

### `POST /api/agent/execute`

Requires Auth0 session. Accepts:
```json
{
  "planId": "<uuid>",
  "plannedAction": "...",
  "draftOutput": "..."
}
```
Returns `{ result: { status, message, executedAt } }`.

### `GET /api/github/pulls`

Requires Auth0 session. Returns `{ pulls: GitHubPullRequest[] }` from GitHub (or mock data).

---

## Enabling Live GitHub Data

1. Create a GitHub personal access token (`repo` scope)
2. Set `GITHUB_TOKEN` and `GITHUB_REPO` in `frontend/.env.local`
3. In `lib/github.ts`, uncomment the live fetch block inside `fetchPullRequests()`

Without a token the app uses realistic mock PR data.

---

## Building for Production

```bash
cd frontend
npm run build
npm start
```

---

## Roadmap

- [x] Auth0 authentication
- [x] Agent plan API route with intent detection
- [x] Human-in-the-loop approval UI
- [x] Agent execute API route with result tracking
- [x] Live GitHub PR context in plans
- [x] Connected Apps dashboard panel
- [ ] Auth0 Token Vault integration
- [ ] Real Slack execution (post to channel)
- [ ] Real GitHub execution (post review comment)
- [ ] Real Google Calendar integration
- [ ] Execution audit log

---

## Troubleshooting

**Port 3000 in use** — change the port in `frontend/package.json` dev script.

**Auth0 callback mismatch** — make sure `AUTH0_BASE_URL` in `.env.local` exactly matches the Allowed Callback URL configured in your Auth0 application.

**GitHub data not showing** — check that `GITHUB_TOKEN` is set and the token has `repo` scope. The app falls back to mock data silently on any fetch error.

