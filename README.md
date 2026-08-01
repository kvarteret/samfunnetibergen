# Samfunnet i Bergen

This repository contains a Next.js website and a Sanity Studio managed as npm
workspaces. The runnable applications live in `apps/web` and `apps/studio`;
the root package only orchestrates checks and builds.

## Getting Started

Install the single root lockfile and run the website development server:

```bash
npm ci
npm run dev:web
```

Open [http://localhost:3187](http://localhost:3187) with your browser. Run
`npm run dev:studio` in another terminal to start the local Studio.

The website source is under `apps/web/src`. Studio source, Sanity
configuration, and Sanity-only scripts are under `apps/studio`. Pure event
generation and inheritance logic shared by both applications is under
`packages/content-domain`.

The repository uses Node 24.16.0 and npm for dependency installation and
command execution. `package-lock.json` is the authoritative dependency
lockfile; Bun is not part of the current local, CI, or production setup.

## Remote Codex development

See [Set up Codex for remote work](docs/how-to/codex-environments.md) for the
repository-specific setup for local worktrees, Remote Control, and Codex Cloud.

## Deployment

The website Vercel project uses `apps/web` as its Root Directory. Studio is a
separate static deployment rooted at `apps/studio`; see the release guides for
the external cutover and promotion steps.
