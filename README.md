# CHARA AI — Live AI starter

This project connects the existing CHARA AI mobile-friendly interface to a real model through a private Node.js backend.

## Requirements
- Node.js 20 or newer
- An OpenAI API key with API billing enabled

## Setup
1. Extract this folder on a computer.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to a new file named `.env`.
4. Open `.env` and replace `put_your_key_here` with your API key.
5. Run `npm start`.
6. Open `http://localhost:3000` in a browser.

Do not paste your API key into `public.html`, share it in chat, or commit `.env` to a public repository. The key belongs only on the server.

## What is connected
- The chat sends the selected character's bio, personality, behaviour, reactions, initiative setting, and recent conversation.
- The backend builds character instructions and calls the OpenAI Responses API.
- The last 24 messages are supplied on each request so the character can respond with context.
- Chat history and character profiles continue to be saved in the browser's local storage.

## Important
- This is a backend starter, not a deployed public website. The backend must be running for live replies.
- A real API key is not included. API usage may cost money.
- General and Teen settings both remain age-appropriate; there is no 18+ mode.
- For a public launch, add authentication, per-user rate limits, abuse monitoring, database-backed accounts, and deployment HTTPS before sharing it widely.
