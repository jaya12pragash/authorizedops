# AuthorizedOps Setup Guide

## Project Structure

```
authorizedops/
├── frontend/          # Next.js web application
│   ├── app/          # Next.js app directory
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── backend/          # Node.js Express server
│   ├── server.js
│   ├── package.json
│   └── ...
├── package.json      # Root workspace package.json
├── .env.local        # Environment variables (copy from .env.example)
└── README.md
```

## Prerequisites

- Node.js 18+ 
- npm 9+

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend (using npm workspaces).

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
OPENAI_API_KEY=your-openai-key
```

Also update `frontend/.env.local` with your Auth0 configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
AUTH0_SECRET=your-secret-key
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

And `backend/.env` with your API keys:

```bash
PORT=5000
OPENAI_API_KEY=your-openai-key
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

## Development

### Run All Services

```bash
npm run dev
```

This will start both frontend (Next.js on :3000) and backend (Express on :5000) in watch mode.

### Run Frontend Only

```bash
npm run frontend
```

Frontend will be available at `http://localhost:3000`

### Run Backend Only

```bash
npm run backend
```

Backend will be available at `http://localhost:5000`

## Building

```bash
npm run build
```

## Features to Implement

- [ ] Auth0 authentication setup
- [ ] Token Vault integration
- [ ] Google Calendar API integration
- [ ] GitHub API integration
- [ ] Slack API integration
- [ ] AI Agent logic
- [ ] Approval workflow UI
- [ ] Audit logging

## Useful Links

- [Auth0 for AI Agents](https://auth0.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [OpenAI API](https://platform.openai.com/docs)

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use, update the configuration in:
- Frontend: `frontend/package.json` (dev script)
- Backend: `backend/server.js` (port variable)

### Module Not Found

Run `npm install` in the root directory to ensure all workspace dependencies are installed.
