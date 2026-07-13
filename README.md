<div align="center">
  <img src="app/icon.svg" width="72" height="72" alt="Aklora logo" />
  <h1>Aklora</h1>
  <p><strong>A focused, private-by-design AI workspace for thoughtful conversations.</strong></p>

  <p>
    <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-167d57.svg" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-191d1a.svg" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6.svg" />
  </p>
</div>

## Overview

Aklora is an independent, open-source AI chat workspace developed under the
Murat Kömürcü brand. It combines a calm writing environment with persistent
conversation history and a provider-neutral model gateway.

The application connects to any service implementing the OpenAI-compatible
`/chat/completions` streaming interface. API credentials stay on the server and
are never exposed to the browser.

## Features

- Streaming AI responses
- Persistent, searchable conversation history
- Markdown, tables, lists, and syntax-friendly code rendering
- Plain-text, Markdown, JSON, and CSV attachments
- Conversation export as Markdown
- Responsive desktop and mobile interface
- Light and dark themes
- Configurable model endpoint, model name, and system prompt
- Server-side API key handling
- Turkish-first interface

## Technology

| Layer | Technology |
| --- | --- |
| Application | Next.js App Router |
| Interface | React and TypeScript |
| Content | React Markdown and GitHub Flavored Markdown |
| Icons | Lucide React |
| Persistence | Browser local storage |
| Model gateway | OpenAI-compatible streaming HTTP API |

## Getting Started

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- An API key for an OpenAI-compatible model provider

### Installation

```bash
git clone https://github.com/MuratKomurcu1/aklora.git
cd aklora
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Add your provider credentials to `.env.local`, then start the development
server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without an API key, Aklora starts in preview mode so the interface can still be
reviewed safely.

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `AI_API_KEY` | Yes | None | Server-side provider credential |
| `AI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible API base URL |
| `AI_MODEL` | No | `gpt-4.1-mini` | Provider model identifier |
| `AI_SYSTEM_PROMPT` | No | Aklora assistant prompt | Instruction applied to every conversation |

Never commit `.env.local` or any production credential. Environment files are
excluded by `.gitignore`.

## Available Commands

```bash
npm run dev         # Start the local development server
npm run build       # Create a production build
npm run start       # Run the production build
npm run lint        # Run ESLint
npm run type-check  # Validate TypeScript without emitting files
```

## Privacy and Data

Conversation history is stored in the user's browser local storage. Messages
are sent to the configured model provider only when the user submits them.
Aklora does not include analytics, advertising trackers, or a hosted database.

The selected model provider may process submitted messages under its own terms
and privacy policy. Review that provider before using sensitive information.

## Security

API keys are read only by the server route. The browser communicates with
`/api/chat` and never receives the provider credential. Request size and message
count are bounded before upstream forwarding.

For vulnerability reports, see [SECURITY.md](SECURITY.md).

## Project Principles

- Keep the interface quiet, direct, and fast.
- Keep provider credentials on the server.
- Prefer transparent behavior over hidden automation.
- Treat accessibility and responsive behavior as release requirements.
- Avoid coupling the product to a single model vendor.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening
an issue or pull request.

## Brand

Aklora is a product of Murat Kömürcü. The source code is available under the MIT
License, but the Aklora name, logo, and visual identity are not granted for use
by that license. See [TRADEMARKS.md](TRADEMARKS.md).

## License

Copyright © 2026 Murat Kömürcü. Source code is licensed under the
[MIT License](LICENSE).
