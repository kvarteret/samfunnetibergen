# Enable the event heart counter

Scheduled public event pages show a small heart and the combined number of clicks for that event. Each accepted click adds one to the total. The heart stops accepting clicks when it is full. The heart fills over twelve personal taps, follows the cursor with its eyes, plays a soft tap sound, and emits a small confetti burst when it first fills. Reduced-motion preferences disable movement and confetti. The normal interface has no explanatory copy, stepped indicator, undo or information control; loading and saving are announced accessibly, while errors expose retry.

The website validates published events through `apps/web/src/features/events/server/public-events.ts`, then calls its same-origin `apps/web/src/app/api/event-interest/[slug]/route.ts`. `apps/web/src/features/event-interest/server/store.ts` signs requests to the sibling `kvarteret-personal` backend. That backend owns click persistence in `app/domain/event_interest/`. Event content remains in Sanity.

## Configure and deploy

Requires the updated backend PR #69. Apply its migrations `20261001_1400` and `20261001_1500` before enabling this website change. The second migration creates `public.event_interest_clicks`, copies previously recorded taps with their original expiry, enables row-level security without public policies, and revokes public access. Use the backend's existing owner/service database connection.

Set the same random server-only `EVENT_INTEREST_SECRET` (at least 32 characters) in both services. Generate it with `openssl rand -hex 32`; never expose it in `NEXT_PUBLIC_*` or Git. Set `PERSONAL_APP_BASE_URL` on the website; it defaults to `https://personal.samfunnetibergen.no`. Deploy the backend before this website revision. The new `{clicks, batch_id}` write contract and `{taps, count}` response replace the unmerged weighted-response implementation; coordinate both revisions rather than mixing old and new clients.

Schedule the backend's `uv run python -m scripts.cleanup_event_interest` daily. It removes expired batches and legacy response rows. Reads exclude expired batches even before cleanup; active writes also prune expired batches for their event.

## Request contract and retries

GET `/api/event-interest/[slug]?locale=nb` returns `{taps, count}`. `taps` is this event-specific browser source's click count and `count` is the combined total. Reads do not set cookies. POST `{initialize:true}` creates or preserves the event-specific signed cookie without recording clicks. Actual writes send `{clicks:4, batch_id:"<UUID v4>"}`. Each batch contains 1–1000 requested clicks. The backend accepts only the remaining clicks up to twelve per event-specific browser source. This limit is atomic across tabs.

The component groups rapid taps, saves batches serially and retains the same batch ID on failure. Clicks made while saving queue behind the in-flight batch. The backend uniquely identifies batches by event ID and batch ID, so a lost response and retry do not double-count; independent tabs sharing a cookie have different IDs, so both contribute. The displayed number includes pending local clicks and reconciles to the backend total on acknowledgement. A save error stays visible until retry succeeds. At twelve taps the heart is full, confetti fires and the button becomes disabled; further clicks cannot increase the count. Totals refresh on load and each acknowledged write, rather than streaming other visitors' clicks.

The website signs POSTs to `/api/v1/event-interest/read` and `/response`. Bodies carry `event_id`, `source_hash` (nullable for reads), and `clicks` plus `batch_id` for writes. HMAC-SHA256 authenticates `event-interest-v1`, timestamp, UUID nonce, method, path and SHA256 body digest joined with newlines. Headers are `X-Kvarteret-Timestamp`, `X-Kvarteret-Nonce`, and `X-Kvarteret-Signature: v1=<hex>`. The backend rejects stale/replayed authentication requests and rate-limits traffic. A transport retry has a fresh authentication nonce but the same click-batch ID. All responses use `private, no-store`.

## Retention and interpretation

Counts are clicks retained for 90 days, not people, attendance or registrations. Every batch expires 90 days after creation. Previously stored taps keep their original expiry when migrated. Historical clicks beyond the old twelve-tap cap were never stored and cannot be recovered.

The event-specific cookie is created on explicit interaction, scoped to `/api/event-interest`, HttpOnly, SameSite=Strict, and Secure on HTTPS. It lasts at most 90 days and stores a random signed token. The database stores only the event ID, source HMAC digest, random batch ID, click quantity and expiry. No account ID, IP address, browser fingerprint or event-to-event browser identity is collected by this feature. Existing hosting logs and analytics have their own policies. Cookie grouping restores personal fill state and enforces the twelve-click limit. Clearing cookies or using another browser creates a separate source. The interface has no removal control.

## Verify

Run `npm run route-typegen`, `npm run typecheck`, `npm test`, and `npm run build`. Backend checks are `uv run pytest tests/api/event_interest`, with `EVENT_INTEREST_TEST_DATABASE_URL` set to a disposable PostgreSQL database for real persistence tests.

With both services running locally, open a scheduled event. Try tapping twenty times: the heart fills at twelve, emits confetti, and the total increases by exactly twelve. Further clicks do nothing. Reload after saving and expect the same count and full heart. A second browser contributes to the same event total; two tabs sharing a cookie share the same twelve-click limit. Retry a lost response and expect no duplicate contribution. Verify keyboard tapping, compact mobile layout, no unsolicited sound on load, and reduced-motion behavior.

The heart is original SVG, with CSS/Web Animations and synthesized Web Audio. Animation design was inspired by Josh Comeau's [CSS and JavaScript animation explanation](https://www.joshwcomeau.com/animation/css-vs-javascript/); no private source or artwork was copied.


## PostHog tracking

`apps/web/src/features/event-interest/components/analytics.ts` uses the existing website PostHog browser client. Every event includes `event_slug` and `locale`; filter or break down by these properties to compare events or languages.

| Event | When it fires | Additional properties |
| --- | --- | --- |
| `event_interest_loaded` | A valid load completes, including reloads and successful load retries | `taps`, `count` |
| `event_interest_tapped` | The enabled heart accepts a local tap | `taps` (optimistic personal fill) |
| `event_interest_full` | A local tap first fills the heart | `taps` |
| `event_interest_batch_saved` | A batch receives a valid backend acknowledgement | `requested_clicks`, `taps`, `count` |
| `event_interest_failed` | Loading, cookie initialization, or saving fails | `phase`: `load`, `initialize`, or `save` |
| `event_interest_retried` | The visitor presses retry | `phase`: `load` or `save` |

For engagement, trend `event_interest_tapped` by event slug. For a funnel, use loaded → tapped → full. To inspect saving reliability, compare failed and retried events by phase with batch acknowledgements. Full-heart events describe optimistic local interaction and do not fire when a full heart is restored from storage. Loaded events count successful loads, not unique visitors or visibility impressions.

A saved-batch event reports requested clicks and the backend's current totals; the backend can clamp a batch when another tab has already filled the shared source. Do not sum `requested_clicks`, `taps`, or `count` to calculate authoritative event totals. Those remain in PostgreSQL. Lost-response retries emit a saved-batch event only after acknowledgement, but analytics can be blocked or lost independently of persistence.

The helper sends no source cookie, source hash, batch UUID, account identifier, or error payload. It sets `$ip` to null to prevent IP enrichment for these events. The existing PostHog client still attaches its standard analytics identity and browser properties; this tracking does not change site-wide analytics or replay settings. Analytics failures cannot interrupt the heart. Localhost tracking remains disabled unless `NEXT_PUBLIC_POSTHOG_ENABLE_LOCALHOST=true` is explicitly set.
