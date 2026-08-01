# Release Sanity Studio to production

This guide releases the static Sanity Studio independently of the public
website. Both applications remain in this repository and use the same Sanity
project and dataset, but each Vercel project receives its own immutable staged
artifact, smoke test, promotion, logs, and rollback history.

The canonical editor URL is
`https://studio.samfunnetibergen.no`. The website's old `/studio` paths are
permanent redirects for bookmarks; they are not a second Studio runtime.

## One-time Vercel setup

The Vercel project is named `studio` and lives in the same Vercel scope as the
website. Its Root Directory is `apps/studio`, its Framework Preset is Sanity,
and source files outside the root are enabled for the npm workspace. Keep
`apps/studio/vercel.json` checked in: it pins `npm run build`, the `dist` output,
the SPA deep-link fallback, and the frame policy required by Sanity Dashboard.

The project id is stored in the GitHub Actions `studio-production` environment
as `STUDIO_VERCEL_PROJECT_ID`. Keep `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and the
automation bypass secret separate from website-only credentials. Studio does
not need PostHog source-map keys or website server tokens.

Attach `studio.samfunnetibergen.no` to this project only after a temporary
deployment succeeds. The DNS record must point at Vercel, and Vercel must show
the domain as assigned to this Studio project with a valid certificate. Do not
move the apex or `www` domains.

## One-time Sanity setup

The project already allows `https://studio.samfunnetibergen.no` as a CORS
origin with credentials. Verify it before changing anything:

    npx sanity cors list --project-id "$NEXT_PUBLIC_SANITY_PROJECT_ID"

If it is missing, add exactly the origin (not a path and not a wildcard):

    npx sanity cors add https://studio.samfunnetibergen.no \
      --project-id "$NEXT_PUBLIC_SANITY_PROJECT_ID" --credentials

Use a Sanity token with permission to register an external Studio. The
workflow accepts it as the GitHub Actions `SANITY_AUTH_TOKEN` secret only for a
manual run with `register_external=true`; it is never committed or printed.
That step runs the installed CLI's supported command:

    npm --workspace @samfunnet/studio exec -- sanity deploy \
      --external --url https://studio.samfunnetibergen.no \
      --title "Samfunnet i Bergen Studio" --schema-required --yes

This registers the external application and publishes the schema manifest.
The command is intentionally opt-in because it mutates Sanity project
metadata. If the secret or Manage permission is absent, perform this command
from an authenticated operator shell before making the Studio URL canonical.

## Release a Studio artifact

The workflow runs automatically for `develop` pushes and can be dispatched for
an explicit branch, tag, or SHA. A manual run is the safe way to rehearse a
release before promotion:

    gh workflow run release-studio-production.yml \
      --ref develop \
      -f ref=develop \
      -f promote=false \
      -f register_external=false \
      -f smoke_paths='/ /structure/arrangement /static/manifest.webmanifest'

Watch the run and inspect its staged URL:

    run_id="$(gh run list --workflow release-studio-production.yml \
      --limit 1 --json databaseId --jq '.[0].databaseId')"
    gh run watch "$run_id" --exit-status
    gh run view "$run_id" --json status,conclusion,headSha,url

The workflow checks formatting, lint, route and Sanity TypeGen drift, all
workspace tests and typechecks, and the Studio production build. It then pulls
the Studio Vercel environment, builds from the checked-out SHA, deploys without
moving the production domain, and smoke-tests the root, a deep Studio route,
and the schema manifest. `promote=false` leaves that artifact unassigned so it
can be inspected before promotion.

After the temporary URL, custom domain, Sanity registration, and authenticated
editing checks pass, promote the exact source SHA:

    gh workflow run release-studio-production.yml \
      --ref develop \
      -f ref=develop \
      -f promote=true \
      -f register_external=true \
      -f smoke_paths='/ /structure/arrangement /static/manifest.webmanifest'

Successful promotion creates a `studio-prod-YYYY.MM.DD.N` tag and matching
GitHub release. A failed or unpromoted run creates neither. The workflow never
uses the website project id and cannot move the website domain.

## Verify the cutover

From a network allowed by the Vercel firewall, check TLS, root, and a deep
route:

    curl --silent --show-error --head https://studio.samfunnetibergen.no/
    curl --silent --show-error --head https://studio.samfunnetibergen.no/structure/arrangement
    curl --silent --show-error --location --head https://samfunnetibergen.no/studio
    curl --silent --show-error --location --head 'https://samfunnetibergen.no/studio/structure/arrangement?intent=edit'

The first two requests must use valid TLS and return a successful Studio
response. The legacy requests must redirect to the standalone origin without
duplicating `/studio`; their query strings must remain intact. Sign in, open a
document, make a harmless draft change, validate, publish, open Vision, and
open Presentation. Presentation's iframe must remain on
`https://samfunnetibergen.no`, and click-to-edit links must open the Studio
origin.

## Independent releases and rollback

A website-only release uses `release-production.yml` and must leave the Studio
deployment id unchanged. A Studio-only release uses this workflow and must
leave the website deployment id unchanged. If the Studio artifact is bad,
promote its previous good Vercel deployment and keep the website release
untouched. If a content-model change is involved, deploy readers that accept
both old and new shapes before the Studio writer; run migrations dry first and
contract only after all consumers are verified.

Do not create an atomic “release both” operation. If both applications need the
same source SHA, stage and smoke-test each artifact, then promote in
compatibility order. A Studio rollback cannot undo documents already written;
stop the writer first and restore a compatible website reader before changing
content.
