# Set up Codex for remote work

This repository includes a checked-in Codex local environment at
`.codex/environments/environment.toml`. It gives each new Codex-managed
worktree the pinned Node toolchain, installs the npm dependency graph from
`package-lock.json`, and adds buttons for the common website commands.

The repository uses Node `24.16.0` and npm as its package manager and command
runner. `package-lock.json` is authoritative, and Bun is intentionally not
part of the current local, CI, or production setup.

## Local worktrees and Remote Control

Open `/Users/kluvin/dev/kvarteret/samfunnetibergen` as the local Codex project
on the host Mac. When Codex creates a managed worktree, it reads the tracked
`.codex/environments/environment.toml` from that project and runs its setup
script at the worktree root.

The setup performs these idempotent steps:

    cd "$CODEX_WORKTREE_PATH"
    mise trust --yes mise.toml
    mise install
    mise exec -- npm ci

If `mise` is not available but Node and npm are already installed by the
environment, the setup uses `npm ci` directly. It does not require the sibling
`infra` checkout or copy `.env.local`.

The available actions are:

- `Website`: `npm run dev:web` at `http://localhost:3187`
- `Studio`: `npm run dev:studio` at the Sanity Studio development URL
- `Test`: `npm run test`
- `Lint`: `npm run lint`
- `Build`: `npm run build` (website followed by Studio)

The cleanup script removes only `.cache/tmp` from the current worktree. This
repository has no Docker Compose development stack, so the environment does not
run a Docker cleanup command.

Remote Control uses the selected Mac project and its local tools, credentials,
and permissions. It does not create a separate cloud checkout. Keep the
desktop app running and the Mac awake and online while using the mobile Remote
connection.

## Project-scoped agents

The project also defines two custom subagents under `.codex/agents/`:

- `luna`: fast, focused work such as exploration, routine checks, and
  straightforward edits, using `gpt-5.6-luna` with medium reasoning.
- `luna-max`: focused work that benefits from extra analysis, using
  `gpt-5.6-luna` with maximum reasoning.
- `sol`: deeper implementation and review work, using `gpt-5.6-sol` with medium
  reasoning.

Ask Codex to delegate a bounded task to `luna` or `sol` when parallel or
specialized work is useful. Model availability still depends on the signed-in
account and workspace configuration.

## Codex Cloud

Create or select an environment for `kvarteret/samfunnetibergen` in Codex
settings. Pin these package versions:

    Node 24.16.0
    npm 11.13.0

Use the following setup and maintenance commands:

    npm ci

Cloud checks out only this repository, so do not run an `../infra` bootstrap
there. The repository's public Sanity identifiers have safe fallbacks in
`apps/web/src/lib/sanity/env.ts` and `apps/studio/src/env.ts`; the baseline
tests and lint do not require a copied secret file. A production build may
contact published Sanity content through `apps/web/src/lib/sanity/client.ts`,
so allow the relevant Sanity hosts in the Cloud
environment if the build is run with restricted agent internet access.

Do not add `.env.local` to `.worktreeinclude` by default. Do not commit values
from local Downloads or from a personal checkout. If a task genuinely needs a
secret, supply it through the appropriate local or Cloud environment and keep
it out of the repository and agent-visible files.

After changing the environment setup, reset the Codex Cloud cache before
starting a task so an older dependency cache cannot mask the new lockfile.

## Verify a new environment

From the repository root, run:

    npm ci
    npm run format:check
    npm run lint
    npm run route-typegen
    npm run sanity:typegen
    npm run typecheck
    npm run test
    npm run build:web
    npm run build:studio

Start `npm run dev:web`, request `http://localhost:3187/nb`, and expect HTTP
200. Start `npm run dev:studio` separately when Studio behavior is in scope.
Stop the server when finished. GitHub Actions and the production release
workflow run the same npm install and check commands before Vercel deployment.
