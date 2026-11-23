# NOVA AI

A mobile-friendly AI assistant built with Node.js, Express, and the Groq API.

## Setup
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your Groq API key.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Environment variables
- `GROQ_API_KEY` — required.
- `GROQ_MODEL` — optional; defaults to `openai/gpt-oss-120b`.
- `PORT` — optional; defaults to `3000`.

Keep API keys on the server. Never put them in frontend JavaScript.
