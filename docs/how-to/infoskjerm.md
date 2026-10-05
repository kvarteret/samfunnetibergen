# How to keep the Scala events screen updated

Load the standalone portrait screen at `https://www.samfunnetibergen.no/infoskjerm` in Scala's webpage or iframe content. The player must support JavaScript and allow the iframe to fetch from its own origin and navigate its own document. If an iframe sandbox is used, enable `allow-scripts` and `allow-same-origin`.

1. Use the stable production URL above so new releases replace the version at that address. A URL for one specific Vercel deployment will keep serving that deployment.
2. Add optional footer text with `?message=...`, URL-encoding the text.
3. After first deploying the automatic-update feature, reload the existing Scala webpage once to load the new polling code. Subsequent deployments are detected automatically.
4. Verify a later release on the actual player: leave the screen open, promote a new production deployment, and expect the iframe to reload within approximately one hour while visible and online. The footer query parameter survives the reload; event rotation starts over.

The screen checks `/api/v1/infoskjerm/version` on load, every hour, on visibility restoration, and on network reconnection. A valid deployment ID different from the initial document's ID triggers a full reload of the iframe itself. Ordinary event content continues to refresh every minute and at Oslo midnight. Unavailable, invalid, or timed-out version responses leave the current screen displayed and are retried later.

If releases are not appearing, verify that `/api/v1/infoskjerm/version` returns HTTP 200, `Cache-Control: no-store`, and a nonempty `deploymentId`. Vercel must provide `VERCEL_DEPLOYMENT_ID` during build and runtime; locally, no ID means deployment polling is disabled. Browser requests must reach the endpoint without a login page or browser challenge. Hidden or suspended players may delay timers until playback resumes. Actual Scala player behavior still needs verification on the installed version.

Implementation evidence: [deployment monitor](../../apps/web/src/features/infoskjerm/domain/deployment.ts), [screen lifecycle](../../apps/web/src/features/infoskjerm/domain/useInfoScreen.ts), [version endpoint](../../apps/web/src/app/api/v1/infoskjerm/version/route.ts), and [deployment configuration](../../apps/web/next.config.ts).

## Norwegian footer messages in Scala

Use a complete URL with the message already encoded as UTF-8. For example:

```text
https://www.samfunnetibergen.no/infoskjerm?message=sp%C3%B8r%20driftsleder
```

This displays `spør driftsleder`. Generate new URLs from the original text, encoding once:

```js
const url = new URL("https://www.samfunnetibergen.no/infoskjerm")
url.searchParams.set("message", "spør driftsleder")
```

If Scala shows `spÃ¸r`, check the URL saved in its webpage/webclip configuration and the final URL requested by the player. The UTF-8 encoding of `ø` is `%C3%B8`; `%C3%83%C2%B8` encodes the already-corrupted text `Ã¸`. Paste the complete encoded URL into Scala's URL field, save it, and reload the webpage content on the player. Compare the same URL in a regular browser.

This is character-encoding corruption, rather than missing font glyphs. A font change cannot turn `Ã¸` back into `ø`. The page applies a narrow compatibility patch after Next.js decodes the `message` parameter: the known Latin-1/Windows-1252 corruptions of `æøåÆØÅ` are replaced with the intended letters. Correct Norwegian text, emoji and literal URL escapes are preserved. There is no additional URL-decoding pass and the saved URL is not rewritten.

After the patch reaches production, test both the correctly encoded URL above and a legacy URL containing `message=sp%C3%83%C2%B8r%20driftsleder`; both should show `spør driftsleder`. Reloading preserves the saved query string, so correcting the URL stored in Scala remains the lasting fix. The compatibility patch handles the known corruption pattern; the installed player still needs verification on the actual screen.

Implementation evidence: [footer message input](../../apps/web/src/app/infoskjerm/page.tsx), [message compatibility patch](../../apps/web/src/features/infoskjerm/domain/message.ts), and [footer renderer](../../apps/web/src/features/infoskjerm/components/InfoScreen.tsx).
