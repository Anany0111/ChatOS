# chatOS ⚡

A real-time chat app with **ARIA** — an AI assistant powered by Claude.

![chatOS preview](https://img.shields.io/badge/built%20with-React%20%2B%20Vite-00ffcc?style=flat-square&labelColor=0a0a0f)
![license](https://img.shields.io/badge/license-MIT-00ffcc?style=flat-square&labelColor=0a0a0f)

## Features

- 💬 **Multi-channel chat** — `#general`, `#random`, `#dev-talk`
- 🤖 **ARIA AI assistant** — powered by Claude claude-sonnet-4
- 👥 **Simulated live users** — bots send messages in real time
- ⌨️ **Typing indicators** — animated dots when users/AI are typing
- 🎨 **Dark terminal aesthetic** — monospace fonts, cyan accents

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How to Talk to ARIA

- Start your message with `@aria` or `@ai`
- Or just ask any question ending with `?`

Examples:
```
@aria what's the best way to learn React?
what is the capital of France?
@ai explain how promises work in JavaScript
```

## Project Structure

```
chatos/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        # Main chat component
│   ├── index.css      # Global styles
│   └── main.jsx       # React entry point
├── index.html
├── package.json
└── vite.config.js
```

## Tech Stack

- **React 18** — UI framework
- **Vite** — build tool
- **Anthropic API** — Claude claude-sonnet-4 for AI responses

## ⚠️ Important Note on API Key

This app calls the Anthropic API **directly from the browser**. This is fine for local development and demos but **not recommended for production** as it exposes your API key.

For production, move the API call to a backend (Node.js/Express, Next.js API routes, etc.) and keep the key server-side.

## Deploy

**Vercel (recommended):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

## License

MIT
