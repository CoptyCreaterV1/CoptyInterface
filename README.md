# COPTY V1 — Full Starter

This is a complete Netlify-ready CoptyV1 frontend + serverless AI gateway.

## 1. Install

```bash
npm install
npm run dev
```

## 2. Build

```bash
npm run build
```

## 3. Netlify

Import the project/repository into Netlify.

Build command:
`npm run build`

Publish directory:
`dist`

The included `netlify.toml` configures the Functions directory and `/api/*` routing.

## 4. Connect a real AI provider

Netlify -> Project configuration -> Environment variables:

`AI_API_URL`
`AI_API_KEY`
`AI_MODEL`

The provider should expose an OpenAI-compatible `/chat/completions` endpoint.

IMPORTANT: Do not place the API key in `src/main.js`.

## 5. Current account/memory behavior

This starter stores the demo profile, chats and memory in browser localStorage.

That means:
- no real account database yet
- data is device/browser-specific
- clearing browser storage removes it
- the demo Ultra switch is NOT a payment system

For real public accounts, use a database/auth provider and server-side subscription verification.

## 6. Ultra payments

Do not trust a browser-side `plan=ultra` flag for real paid access.

Production flow should be:

payment provider -> webhook -> server/database -> subscription status -> AI gateway

The AI gateway must check the database before granting Ultra-only limits.

## 7. Ollama

Your local Ollama at `127.0.0.1:11434` is useful for local development, but a public Netlify Function cannot normally reach your home PC.

For public CoptyV1, inference needs an internet-accessible AI provider/server.

## Included

- responsive Copty UI
- chat sessions
- local profile
- local memory
- settings
- Free usage counter
- Ultra UI
- file picker UI
- Netlify Functions gateway
- environment variable setup
- Netlify routing
- production notes
