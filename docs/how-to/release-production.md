# How to release to production

This guide describes the repository's production release process. It is
independent of any individual feature or page. Releases are run from GitHub
Actions and deploy a Vercel production artifact after the repository checks and
staged smoke tests pass.

## Prerequisites

- The source to release is available on a branch, tag, or commit. The normal
  release source is the merged `develop` branch. Changes normally reach
  `develop` through a reviewed pull request whose repository checks and Vercel
  Preview deployment have passed.
- GitHub CLI is authenticated for `kvarteret/samfunnetibergen`.
- The repository's production environment secrets are configured. The workflow
  uses Vercel credentials, Sanity build variables, PostHog source-map
  variables, and `VERCEL_AUTOMATION_BYPASS_SECRET` for protected smoke-test
  deployments.
- The website Vercel project has a server-only
  `VOLUNTEER_PROSPECT_HMAC_SECRET` of at least 32 characters, matching Personal's
  active value, and a separate server-only
  `VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET` of at least 32 characters used only to
  pseudonymize client IP addresses. Do not prefix either with `NEXT_PUBLIC_`.
  Personal does not receive or need the client-key secret. Before releasing the
  website's v2 signer, deploy Personal support for the v2 canonical request;
  Personal may retain v1 verification temporarily during this rollout. During
  later request HMAC secret rotations, update Personal to accept the new and
  previous values before switching the website.

Pull-request-specific Vercel Preview deployments are the normal place to review
changes before merging. The release workflow still provides the integration
gate for the complete `develop` state: it rebuilds `apps/web` as a production
artifact, deploys the artifact without assigning the public domain, smoke-tests
it, and promotes that exact artifact. Studio has a separate release workflow
and is not moved by this website workflow.

## Release the merged `develop` branch

Dispatch the workflow with the source ref and the paths to smoke-test:

```bash
gh workflow run release-production.yml \
  --ref develop \
  -f ref=develop \
  -f promote=true \
  -f smoke_paths='/nb /nb/rom /nb/rom/book'
```

The `ref` input controls the checked-out release source. `promote=true` makes
the workflow promote the staged deployment after smoke tests. Use
`promote=false` only when an unpromoted staged deployment is explicitly wanted.

## Watch the release to completion

A successful dispatch only means that the workflow started. Find the run and
wait for its final result:

```bash
run_id="$(gh run list \
  --workflow release-production.yml \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')"

gh run watch "$run_id" --exit-status
```

The workflow must finish successfully. It runs, in order:

1. format, lint, route and Sanity TypeGen, workspace TypeScript, and test checks;
2. Vercel production environment pull and production build;
3. staged Vercel deployment;
4. HTTP smoke tests for the supplied paths;
5. promotion of the staged deployment;
6. creation of the `prod-YYYY.MM.DD.N` Git tag and GitHub release.

The tag and GitHub release are created only when promotion is enabled and has
succeeded.

## Verify the result

Inspect the completed run and recent production releases:

```bash
gh run view "$run_id" \
  --json status,conclusion,headSha,url
gh release list --limit 5
```

The run should report `status: completed` and `conclusion: success`. The
workflow summary and GitHub release contain the source commit, production tag,
staged deployment URL, and promotion result.

## Troubleshoot a failed release

- If repository checks fail, fix the source and dispatch the workflow again for
  the corrected ref.
- If Vercel access fails, verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and
  `VERCEL_PROJECT_ID` in the website production environment. The Studio
  project uses its own credentials and is never selected by this workflow.
- If smoke tests receive a protected-deployment response, verify
  `VERCEL_AUTOMATION_BYPASS_SECRET` and the requested paths.
- If the workflow is still running, keep watching it; do not treat dispatch or
  an intermediate green step as a completed release.

The workflow definition at
`.github/workflows/release-production.yml` is the source of truth for inputs,
checks, secrets, deployment behavior, and release-tag creation.
