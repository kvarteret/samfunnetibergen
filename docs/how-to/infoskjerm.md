# How to keep the Scala events screen updated

Load the standalone portrait screen at `https://www.samfunnetibergen.no/infoskjerm` in Scala's webpage or iframe content. The player must support JavaScript and allow the iframe to fetch from its own origin and navigate its own document. If an iframe sandbox is used, enable `allow-scripts` and `allow-same-origin`.

1. Use the stable production URL above so new releases replace the version at that address. A URL for one specific Vercel deployment will keep serving that deployment.
2. Add optional footer text with `?message=...`, URL-encoding the text.
3. After first deploying the automatic-update feature, reload the existing Scala webpage once to load the new polling code. Subsequent deployments are detected automatically.
4. Verify a later release on the actual player: leave the screen open, promote a new production deployment, and expect the iframe to reload within approximately one hour while visible and online. The footer query parameter survives the reload; event rotation starts over.

The screen checks `/api/v1/infoskjerm/version` on load, every hour, on visibility restoration, and on network reconnection. A valid deployment ID different from the initial document's ID triggers a full reload of the iframe itself. Ordinary event content continues to refresh every minute and at Oslo midnight. Unavailable, invalid, or timed-out version responses leave the current screen displayed and are retried later.

If releases are not appearing, verify that `/api/v1/infoskjerm/version` returns HTTP 200, `Cache-Control: no-store`, and a nonempty `deploymentId`. Vercel must provide `VERCEL_DEPLOYMENT_ID` during build and runtime; locally, no ID means deployment polling is disabled. Browser requests must reach the endpoint without a login page or browser challenge. Hidden or suspended players may delay timers until playback resumes. Actual Scala player behavior still needs verification on the installed version.

Implementation evidence: [deployment monitor](../../apps/web/src/features/infoskjerm/domain/deployment.ts), [screen lifecycle](../../apps/web/src/features/infoskjerm/domain/useInfoScreen.ts), [version endpoint](../../apps/web/src/app/api/v1/infoskjerm/version/route.ts), and [deployment configuration](../../apps/web/next.config.ts).
