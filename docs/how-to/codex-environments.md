# Set up Codex for remote work

This runbook prepares `samfunnetibergen` for both ways of doing unattended or
remote Codex work:

- **Local worktrees** run on a developer Mac through the ChatGPT desktop app.
  Remote Control from a phone uses that Mac's files, tools, credentials, and
  permissions.
- **Codex Cloud** checks out the GitHub repository in an OpenAI-managed
  container. It does not inherit anything from a developer machine or clone the
  sibling `infra` repository.

The repository pins Node `24.16.0` and Bun `1.3.14` in `mise.toml`. Use
`npm ci` for reproducible environment setup. Both `bun.lock` and
`package-lock.json` are tracked, so automatic package-manager detection is
ambiguous; the npm lockfile is the maintained clean-install path on
`develop`.

## Local worktrees and Remote Control

### Host prerequisites

Clone `infra` and `samfunnetibergen` as siblings, then install the shared
toolchain:

```text
kvarteret/
├── infra/
└── samfunnetibergen/
```

```bash
cd ../infra
mise install
mise run doctor
```

The sibling `infra` repository owns the shared toolchain and builds the `kv`
developer CLI. The website's `mise.toml` pins the matching Node and Bun
versions for commands run directly in this repository.

### Create the local environment

Local environments are configured in the ChatGPT desktop app and apply when
Codex creates a managed worktree. Open this repository as a Codex project, open
the project's local-environment settings, and use:

Setup script:

```bash
mise trust --yes mise.toml
mise install
mise exec -- npm ci
```

Maintenance script:

```bash
mise exec -- npm ci
```

Each managed worktree has a different path, so the setup explicitly trusts the
checked-in `mise.toml` before loading its tool and path configuration. The
maintenance script makes a resumed cached worktree match a newer lockfile. It
is safe to rerun.

Add these optional actions in the same settings:

| Action | Command | Result |
| --- | --- | --- |
| Website | `npm run dev` | Next.js at `http://localhost:3187` |
| Studio | `npm run studio` | Sanity Studio at `http://localhost:3333` |
| Test | `npm run test` | Vitest suite with coverage |
| Lint | `npm run lint` | Formatting check and ESLint |
| Build | `npm run build` | Production Next.js build |

Do not add `.env.local` to `.worktreeinclude` by default. The published Sanity
dataset has safe source defaults, so ordinary website, test, lint, and build
work does not need a copied secret file. If a narrowly scoped task genuinely
requires an ignored local file, add only that path to `.worktreeinclude`, avoid
committing credentials, and remove the entry when it is no longer needed.

### Enable Remote Control

In the ChatGPT desktop app on the host Mac, select **Set up Remote** and scan
the QR code with the ChatGPT mobile app. Both devices must use the same ChatGPT
account and workspace. Keep the desktop app running and the Mac awake and
online.

Remote Control does not create another execution environment. Prompts sent
from the phone continue to use the selected local checkout or managed
worktree, including its sandbox, approvals, tools, and signed-in services.

See OpenAI's documentation for
[local environments](https://learn.chatgpt.com/docs/environments/local-environment),
[worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees), and
[Remote Control](https://learn.chatgpt.com/docs/remote-connections).

## Codex Cloud

### Create the environment

Open [Codex environment settings](https://chatgpt.com/codex/settings/environments),
create an environment for `kvarteret/samfunnetibergen`, and select the
repository through the GitHub connection.

Set the package versions to:

```text
Node 24.16.0
Bun 1.3.14
```

Use this setup script:

```bash
npm ci
```

Use this maintenance script:

```bash
npm ci
```

Do not run the sibling `infra` bootstrap in Cloud. A Cloud checkout contains
only this repository, so `../infra` is not available. The Cloud environment
already pins the two runtimes this application needs.

### Environment variables

Set the public Sanity identifiers explicitly:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=mkjoahvv
NEXT_PUBLIC_SANITY_DATASET=production
```

They match the fallbacks in `src/lib/sanity/env.ts`. Explicit values make the
Cloud environment understandable without changing behavior.

Leave the following credentials unset for the baseline development
environment:

- `SANITY_API_READ_TOKEN`
- `POSTHOG_API_KEY` and `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `POSTHOG_CLI_API_KEY` and `POSTHOG_CLI_PROJECT_ID`
- Vercel deployment credentials
- production `kvarteret-personal` credentials

Codex Cloud secrets are available to the setup script but are removed before
the agent phase. Consequently, storing `SANITY_API_READ_TOKEN` as a Cloud
secret does not make it available to an agent-run build or Sanity command.
Keep the baseline environment read-only and credential-free. Use the existing
GitHub Actions release workflow for production deployment.

### Agent internet access

Setup scripts already have internet access for dependency installation. Enable
limited agent internet access with these hosts when tasks must run the
production build or inspect live published content:

```text
mkjoahvv.apicdn.sanity.io
mkjoahvv.api.sanity.io
cdn.sanity.io
personal.kvarteret.no
```

The site reads published content through the Sanity client in
`src/lib/sanity/client.ts`. The homepage and public API routes can also read the
public Personal service through
`src/lib/integrations/kvarteret-personal/now-playing.ts`,
`src/app/api/volunteer-prospects/route.ts`, and
`src/app/api/feedback/route.ts`.

Do not allow PostHog or Vercel hosts merely to make a build pass. Source-map
upload is disabled when PostHog CLI credentials are absent, and production
release remains owned by `.github/workflows/release-production.yml`.

See OpenAI's documentation for
[Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment)
and [agent internet access](https://learn.chatgpt.com/docs/cloud/internet-access).

### Verify the environment

After saving or changing a Cloud environment, reset its cache and start a task
from `develop` with:

```text
Run npm run test and npm run lint. Do not change files. Report failures.
```

Then verify the network allowlist and production compilation:

```text
Run npm run build. Do not change files. If network access is blocked, report
the exact hostname instead of changing source or requesting broad internet
access.
```

Successful setup means the dependency installation, tests, lint, and build can
run in a fresh checkout without a sibling repository or production
credentials.
