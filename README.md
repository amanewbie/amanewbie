# NOVA AI

A mobile-friendly AI assistant built with Node.js, Express, and the OpenAI API.

## Setup
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your OpenAI API key.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Environment variables
- `OPENAI_API_KEY` — required.
- `OPENAI_MODEL` — optional; defaults to `gpt-4.1-mini`.
- `PORT` — optional; defaults to `3000`.

Keep API keys on the server. Never put them in frontend JavaScript. ChatGPT subscriptions and OpenAI API billing are separate.
