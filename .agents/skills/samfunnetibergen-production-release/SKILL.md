---
name: samfunnetibergen-production-release
description: Release Samfunnet i Bergen to production through GitHub Actions, Vercel staging, smoke tests, promotion, and production tags.
---

# Samfunnet i Bergen production release

Use this skill when releasing a merged branch, tag, or commit to production,
checking a release workflow, or diagnosing why a production release has not
completed.

## Source of truth

The release workflow is `.github/workflows/release-production.yml`. It accepts:

- `ref`: branch, tag, or SHA to check out and release;
- `promote`: whether to promote the staged deployment;
- `smoke_paths`: space-separated paths checked before promotion.

The normal release source is `develop`.

## Release workflow

Dispatch the workflow with an explicit source ref and smoke paths:

    gh workflow run release-production.yml --ref develop \
      -f ref=develop \
      -f promote=true \
      -f smoke_paths='/nb /nb/rom /nb/rom/book'

Find the run and watch it until it exits:

    run_id="$(gh run list --workflow release-production.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
    gh run watch "$run_id" --exit-status

Do not report a release as deployed when it has only been dispatched. A
successful release must complete repository checks, build and deploy a staged
Vercel artifact, pass smoke tests, promote the artifact, and create the
production tag and GitHub release.

## Verification

Inspect the completed workflow and release list:

    gh run view "$run_id" --json status,conclusion,headSha,url
    gh release list --limit 5

Expect `status` to be `completed` and `conclusion` to be `success`.

## Failure boundaries

The workflow requires production-environment secrets for Vercel, Sanity,
PostHog, and protected-deployment smoke tests. For Vercel access failures,
check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. For protected
smoke-test failures, check `VERCEL_AUTOMATION_BYPASS_SECRET` and the requested
paths. Fix the source or environment configuration, then rerun the workflow
for the intended ref.

Keep release documentation generic: feature-specific implementation skills
should explain how to verify their own behavior, while this skill owns the
release procedure.
