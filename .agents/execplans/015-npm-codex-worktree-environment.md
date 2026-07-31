# Make Samfunnet worktrees reproducible with Node, npm, and Codex

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

A new Codex-managed Samfunnet worktree should become usable without manually
copying a local environment, guessing which package manager is authoritative,
or depending on a sibling checkout. After this change, selecting the checked-in
Codex local environment will install the pinned Node/npm toolchain, install the
dependency graph from `package-lock.json`, expose useful development actions,
and clean only disposable files owned by this checkout. GitHub Actions and the
production release workflow will use the same npm lockfile and commands.

The current decision is deliberately conservative: use Node 24.16.0 and npm
everywhere for local worktrees, CI, release checks, and the Vercel build. Bun
can be reconsidered later, but it is not part of this setup and there must not
be two committed JavaScript lockfiles competing for authority.

## Progress

- [x] Read the repository agent guidance and inspect the app, Codex, and sibling
  infra conventions.
- [x] Add a tracked Codex local environment with npm setup and common actions.
- [x] Add a repository-specific Codex/Cloud worktree runbook.
- [x] Make the package manifest, workflows, and active command documentation
  npm-only.
- [x] Retain `package-lock.json`, remove `bun.lock`, and declare the direct Zod
  dependency used by the application.
- [x] Complete a clean npm install and the verification matrix.

## Surprises & Discoveries

- The app imports `zod` directly from several source modules but did not list it
  as a direct dependency. The package manifest now declares it explicitly so a
  clean npm install does not rely on transitive hoisting.
- The repository pins Node 24.16.0 through `mise.toml`; npm 11.13.0 is the npm
  version paired with that toolchain and is recorded in `package.json`.
- The app-level `mise.toml` previously installed Bun alongside Node. That pin is
  now removed; the sibling `infra` repository keeps its own infrastructure
  tooling independently.
- The app repository does not contain `requirements.txt`, `run/setup.sh`, or a
  Docker Compose development stack. The Codex setup therefore installs only the
  JavaScript dependencies and cleanup removes only `.cache/tmp`.
- The sibling `infra` checkout has its own pre-existing changes and is not
  required for a Codex-managed app worktree. It was not modified by this plan.

## Decision Log

- **Decision:** Use Node 24.16.0 and npm as the only active JavaScript toolchain.
  **Rationale:** Matching local development, CI, and release commands removes
  dependency-manager and runtime ambiguity while the Bun option remains open for
  a later deliberate migration.
- **Decision:** Keep `package-lock.json` and remove `bun.lock`.
  **Rationale:** One lockfile makes fresh worktrees and automated installs
  deterministic and prevents tools from choosing different dependency graphs.
- **Decision:** Keep the Next scripts as `next dev`, `next build`, and
  `next start`; run them through npm scripts.
  **Rationale:** This keeps the application on the standard Node runtime path
  and avoids making the Vercel Bun runtime part of the current release decision.
- **Decision:** Track only `.codex/environments/environment.toml` under
  `.codex/`.
  **Rationale:** The environment definition is useful repository configuration;
  other Codex-local files should remain ignored.
- **Decision:** Do not copy `.env.local` or require `../infra` during setup.
  **Rationale:** Credentials remain environment-owned, and a worktree should
  bootstrap from the repository it actually checks out.

## Outcomes & Retrospective

The worktree now has a checked-in npm/Node environment that runs `npm ci` and
exposes Dev, Studio, Test, Lint, and Build actions. Node 24.16.0/npm 11.13.0
verification passed: route type generation, formatting, lint, TypeScript,
288 tests, the production build, and a `/nb` development smoke request with
HTTP 200. No secret file or sibling checkout was needed.

## Context and Orientation

The working repository is
`/Users/kluvin/.codex/worktrees/13f3/samfunnetibergen`, a detached Codex-managed
worktree of `kvarteret/samfunnetibergen`. It is a Next.js App Router site with an
embedded Sanity Studio. `package.json` owns the commands, `package-lock.json`
owns the dependency graph, `.codex/environments/environment.toml` owns local
Codex worktree setup, `.github/workflows/ci.yml` validates pull requests, and
`.github/workflows/release-production.yml` validates and deploys the production
artifact.

The app's `mise.toml` pins Node 24.16.0 and also contains shared-tool metadata.
The Codex setup trusts that exact file and installs the tools locally when mise
is available, but it does not assume that a sibling repository exists at a
particular relative path.

## Plan of Work

First, keep `.codex/` ignored except for the tracked environment definition.
The setup script enters `CODEX_WORKTREE_PATH`, trusts and installs the pinned
mise tools when available, and runs `npm ci`. Its fallback runs `npm ci` with
the environment's existing Node/npm. Actions invoke the package scripts with
`npm run`. Cleanup removes only `.cache/tmp`.

Next, make `package.json` explicitly npm-authoritative, retain the direct Zod
dependency, and restore the normal Node-backed Next scripts. Restore and
regenerate `package-lock.json` so it represents the manifest exactly, then
remove `bun.lock`.

Then, update CI and the production release workflow to use setup-node 24.16.0,
npm caching, `npm ci`, `npm run`, `npx --no-install`, and npm's global Vercel
CLI installation. Preserve the existing release metadata, secrets, staged
deployment, smoke tests, promotion, tags, and GitHub release behavior.

Finally, keep active README, ADR, RFC, and script instructions consistent with
npm, and maintain the Codex runbook for local worktrees, Remote Control, and
Codex Cloud. Historical ExecPlans remain historical records and are not
rewritten as part of this change.

## Concrete Steps

1. Add `.codex/environments/environment.toml` and update `.gitignore` so only
   that environment file is tracked.
2. Update `package.json`, README, the Codex runbook, active command examples,
   CI, and release configuration to use Node/npm.
3. Restore `package-lock.json`, run `npm install` once to record the direct Zod
   dependency, then verify the frozen path with `npm ci`.
4. Run type generation, formatting, lint, TypeScript, tests, and production
   build under Node/npm.
5. Start the development server on port 3187, request `/nb`, and stop it after
   confirming HTTP 200.
6. Review `git diff --check`, package-manager references, and worktree status.

## Validation and Acceptance Criteria

- `.codex/environments/environment.toml` parses and setup uses `npm ci`.
- `package.json` records `npm@11.13.0`, while `package-lock.json` is the only
  committed JavaScript lockfile.
- `npm ci` succeeds without modifying the lockfile.
- `npm run format:check`, `npm run lint`, `npx --no-install next typegen`,
  `npx --no-install tsc --noEmit`, `npm run test`, and `npm run build` succeed.
- `npm run dev` serves `/nb` with HTTP 200 on port 3187.
- Active setup, CI, release, README, ADR, and RFC instructions contain no Bun
  command or lockfile dependency.
- Existing release secrets, Vercel commands, smoke paths, promotion behavior,
  and tagging behavior remain unchanged apart from the package-manager commands.

## Idempotence and Recovery

The setup is safe to rerun: `mise trust` is idempotent, `mise install`
reconciles pinned tools, and `npm ci` recreates dependencies from the lockfile.
The cleanup script targets only a disposable directory under the current
worktree. If network access prevents installation, preserve the lockfile and
report the failed npm command; do not fall back to Bun or copy secret files.

## Artifacts and Interfaces

The relevant tracked artifacts are:

- `.codex/environments/environment.toml`
- `.gitignore`
- `mise.toml`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.github/workflows/release-production.yml`
- `README.md`
- `docs/how-to/codex-environments.md`

The package-manager contract is npm 11.13.0 with Node 24.16.0 and the root
`package-lock.json`. The app continues to expose port 3187 for development and
the release workflow continues to use Vercel CLI 48 with the existing Vercel,
Sanity, PostHog, smoke-test, promotion, tag, and GitHub-release interfaces.

Revision note (2026-07-31): The initial implementation explored a Bun-based
environment after confirming Bun could run the app. The direction was then
explicitly changed to npm/Node to avoid local configuration mismatch and
dependency-manager mixing; this plan records the final npm-only decision.
