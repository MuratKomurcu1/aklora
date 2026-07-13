# Contributing to Aklora

Thank you for helping improve Aklora.

## Development Workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Keep credentials in `.env.local` only.
4. Make one coherent change per pull request.
5. Run all validation commands before submitting.

```bash
npm run type-check
npm run lint
npm run build
```

## Pull Requests

Describe what changed, why it changed, and how it was tested. Include screenshots
for interface changes at desktop and mobile widths. Keep unrelated formatting or
dependency changes out of the pull request.

## Code Style

- Use strict TypeScript types.
- Keep components and functions focused.
- Preserve keyboard navigation and visible focus states.
- Use existing design tokens before adding new colors or dimensions.
- Do not expose model credentials to client components.
- Avoid adding analytics or telemetry without an explicit project decision.

## Brand Assets

Contributions do not grant permission to use the Aklora name, logo, or visual
identity outside this project. See [TRADEMARKS.md](TRADEMARKS.md).
