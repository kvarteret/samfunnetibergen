# How to release to production

This guide describes the repository's production release process. It is
independent of any individual feature or page. Releases are run from GitHub
Actions and deploy a Vercel production artifact after the repository checks and
staged smoke tests pass.

## Prerequisites

- The source to release is available on a branch, tag, or commit. The normal
  release source is the merged `develop` branch.
- GitHub CLI is authenticated for `kvarteret/samfunnetibergen`.
- The repository's production environment secrets are configured. The workflow
  uses Vercel credentials, Sanity build variables, PostHog source-map
  variables, and `VERCEL_AUTOMATION_BYPASS_SECRET` for protected smoke-test
  deployments.

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

1. format, lint, route type generation, TypeScript, and test checks;
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
  `VERCEL_PROJECT_ID` in the production environment.
- If smoke tests receive a protected-deployment response, verify
  `VERCEL_AUTOMATION_BYPASS_SECRET` and the requested paths.
- If the workflow is still running, keep watching it; do not treat dispatch or
  an intermediate green step as a completed release.

The workflow definition at
`.github/workflows/release-production.yml` is the source of truth for inputs,
checks, secrets, deployment behavior, and release-tag creation.
