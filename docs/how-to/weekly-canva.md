# Generate Ukas post with Skonk

Skonk reads next week's approved public events from `/api/v1/events` and prepares them as a Canva review draft and sends its edit link to `#nettside`. Luna shortens event titles and descriptions; code preserves the source dates, rooms and times. Editors still review the design before publishing it.

## Schedule and activation

TicketCo imports run Wednesday at 06:00 and Saturday at 18:00 Europe/Oslo. These are 3½ calendar days apart; daylight-saving transitions change the elapsed hours between them. Imported events remain pending until approved by editors. Sunday's Canva run therefore includes only approved events, including approved TicketCo imports.

The Canva workflow targets Sunday at 18:00 Europe/Oslo and prepares the following Monday–Sunday. GitHub Actions schedules can start late or be missed, so this is a target time, not an exact delivery guarantee. Both UTC equivalents are scheduled; the application rejects an early run and records one delivery per Monday date. Scheduled workflows run from the default branch, currently `develop`.

**Canva activation is deferred.** An individual Canva account with MFA and Autofill access must be connected first. Leave the repository Actions variable `WEEKLY_CANVA_ENABLED` unset or `false` until a manual generation has been verified. Manual dry runs can prepare copy without a Canva connection.

## Template

The reusable [Ukas post design](https://www.canva.com/d/5qaqDkw775jdbqN) (`DAHXWWAf59c`) is a separate copy of Ukens post 41. Its autofill labels were saved and verified. The original design is unchanged.

The job uses page 1 as the cover, repeats page 2 in chronological groups of up to two events on the same day, then appends page 7 as the volunteer ending. Days without events are omitted; weekend and overflow events get additional pages. Intermediate seven-page copies remain in Canva so interrupted work can resume. The final design is titled `Ukas post <week> (<year>)`.

The template requires these exact data fields:

| Fields | Type |
| --- | --- |
| `week_number`, `day_heading` | text |
| `event_1_title`, `event_2_title` | text |
| `event_1_description`, `event_2_description` | text |
| `event_1_location_time`, `event_2_location_time` | text |
| `event_1_image`, `event_2_image` | image |
| `cover_image_1`, `cover_image_2`, `cover_image_3` | image |

Titles are limited to 22 characters and summaries to 95 characters. These bounds reduce overflow but do not replace visual review: font metrics, long words and image framing can still require edits. Source images must be hosted on Sanity CDN. Missing images and unused event slots use the template's background image (`MAHTehiy2v4`), replacing historical event images. All event slots are filled or cleared. If no approved public events exist, Slack receives an empty-week notice and no design is created.

## Connect an individual Canva account

Give the account access to the Ukas post design and a plan with Autofill access. Enable MFA on that account. In [Canva Developer Portal](https://www.canva.com/developers/apps), create a `Skonk` app. Private apps require Enterprise; a Public app can remain unpublished during development. Under **Outside Canva**, select **Start integrating**, then enable **Canva REST APIs**. Request only `design:content:read`, `design:content:write`, `design:meta:read`, `asset:read`, and `asset:write`. Set the exact redirect URL `http://127.0.0.1:8789/callback`.

The Merge and URL asset upload endpoints are preview APIs. Confirm that the app can call them before enabling the schedule; preview APIs can change without a version bump and are not eligible for public app review. This implementation uses autofill from an existing labeled design, so publishing a Brand Template is not required.

Store `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, and `CANVA_TOKEN_ENCRYPTION_KEY` in the Infisical production `/nettside` folder. The encryption key must be 32 random bytes encoded as 64 hexadecimal characters; generate and store it through secure secret tooling, without putting it in Git, terminal logs or chat. Declare the three consumer names in `infra/secrets/nettside-prod/fnox.toml` when activating, and synchronize the same values to the GitHub `production` environment. Existing Sanity, Azure Skonk, PostHog and `SLACK_NETTSIDE_WEBHOOK` values are reused.

With these values available to the explicit production secret runner, run from the application checkout:

    mise run secrets:exec -- npm --workspace @samfunnet/web run canva:connect

The helper listens only on loopback port 8789 for up to ten minutes and prints a Canva consent URL. Open it using the individual account and approve the requested scopes. The helper verifies the callback's state and PKCE proof, exchanges the code, then stores encrypted tokens in Sanity. The browser displays `Canva connected. You can close this tab.` No token is printed.

Canva refresh tokens are single-use. The job saves the replacement immediately under a global revision-checked lease. Tokens in the public-readable Sanity dataset are encrypted with AES-256-GCM; the encryption key stays in production secrets. Keep that key stable. Changing it or losing it requires reconnecting the account. An interrupted token refresh marks the connection for reconnection instead of blindly reusing a possibly consumed token.

## Validate and enable

Run the next-week copy preview:

    mise run secrets:exec -- npm --workspace @samfunnet/web run events:weekly:canva -- --dry-run

Or select an explicit Monday:

    mise run secrets:exec -- npm --workspace @samfunnet/web run events:weekly:canva -- --dry-run --week 2026-10-12

A dry run reads the public events API and calls Luna, including PostHog analytics when configured. It creates no designs, rotates no Canva tokens, writes no receipt and sends no Slack message. Timed API timestamps are converted to Europe/Oslo; date-only schedules explicitly show Tid ikke oppgitt; failed copy validation does not silently truncate or omit events.

After connecting, run the **Generate Ukas post with Skonk** workflow manually with `dry_run: false`. Verify the final Canva design's date range, titles, images, chronological pages and Slack edit link. Repeating the same week returns `already-delivered`. Set `WEEKLY_CANVA_ENABLED=true` as a repository Actions variable only after this succeeds. An optional repository variable `CANVA_WEEKLY_TEMPLATE_DESIGN_ID` selects another compatible labeled design. Do not set an environment-only activation variable: the workflow gate is evaluated before entering the production environment.

## Retry failures

The receipt `weekly-canva-<Monday date>` records the prepared pages, image IDs, autofill job IDs, merge progress, final design link and Slack delivery time. Rerun the same Monday to resume after a polling or Slack failure; the final design is saved before notification. Normal repeated runs do not resend it. Slack cannot make webhook acceptance and receipt saving atomic, so a crash between those steps can duplicate the notification.

A Canva request that creates a job is never retried automatically. If Canva accepted a request but the response or subsequent Sanity save was lost, an unrecorded intermediate design or duplicate inserted page is possible. Inspect the Canva copies and receipt before retrying such an ambiguous failure. The helper and runner share a global lease to prevent concurrent OAuth refresh. The workflow has a 40-minute timeout, and an interrupted runner's 45-minute lease expires before another run can resume.

Local checks:

    mise exec -- npm run test:web -- src/features/weekly-canva src/features/events/integrations/ticketco
    mise exec -- npm run typecheck

Production activation and end-to-end Canva layout verification remain deferred until the individual account is available.
