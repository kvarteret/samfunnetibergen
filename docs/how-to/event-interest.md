# Enable event enthusiasm responses

Event detail pages show a character that fills as a visitor taps it: `kommer kanskje` at 1–3 taps, `kommer!` at 4–7, and `JEG KOMMER` at 8–12. These levels contribute 0.25, 0.75, and 1 point. Additional taps still animate after the cap. The displayed mood is a weighted signal, not a headcount or a registration.

The website validates published public event slugs through `apps/web/src/features/events/server/public-events.ts`. It groups browser taps, then proxies requests through `apps/web/src/app/api/event-interest/[slug]/route.ts` and `apps/web/src/features/event-interest/server/store.ts`. The sibling `kvarteret-personal` backend owns the response table and database transactions in `app/domain/event_interest/`. Event content remains in Sanity; this feature does not restore the backend's retired event-content API.

## Configure the services

Apply the backend's additive Alembic migration `migrations/versions/20261001_1400_event_interest.py` through its normal migration process before enabling the website. This creates `public.event_interest`, enables row-level security without public policies, and revokes public access. The backend's existing database owner/service connection accesses the table.

Set the same random `EVENT_INTEREST_SECRET` (at least 32 characters) in both services. Generate one with `openssl rand -hex 32`. Keep it server-side, outside Git and `NEXT_PUBLIC_*`. The website uses `PERSONAL_APP_BASE_URL`, defaulting to `https://personal.kvarteret.no`. The website does not need a Postgres driver or database credentials. Deploy the backend first, then the website. Until configured, the control shows an unavailable state with retry instead of pretending responses were saved.

Schedule the backend cleanup script daily using its existing job runner:

    uv run python -m scripts.cleanup_event_interest

Run it with the backend's normal environment and database credentials. It removes expired response rows; repeated runs are safe. Reads exclude expired rows even before cleanup. Active writes also prune expired rows for the current event.

## Verify the interaction

Start the backend and website with matching secrets and point `PERSONAL_APP_BASE_URL` to the local backend. Open any scheduled public event. Tap once and expect 0.25 additional points; tap four times in total and expect 0.75; tap eight or more times and expect 1. Reload and expect the same expression and contribution. Select `Fjern svaret mitt` to remove it. English pages use English labels and share the same event response.

GET `/api/event-interest/[slug]?locale=nb` returns `{taps, score}` without setting a cookie. POST `{initialize:true}` creates or preserves an event-specific browser cookie without storing a response. The client completes initialization before sending POST `{taps:4}`. This makes a lost first response safe to retry before any contribution is inserted. Subsequent writes send absolute cumulative counts, serialize in the browser, and preserve the greatest saved count in Postgres. POST `{taps:0}` deletes the response and cookie. All responses use `private, no-store`.

The website sends signed POST requests to backend `/api/v1/event-interest/read` and `/response`. Bodies carry `event_id`, `source_hash` (nullable for reads), and `taps` for writes. HMAC-SHA256 authenticates the `event-interest-v1`, timestamp, UUID nonce, method, path, and SHA256 body digest, joined with newline characters. The signature header is `X-Kvarteret-Signature: v1=<hex>`, alongside `X-Kvarteret-Timestamp` and `X-Kvarteret-Nonce`. The backend accepts timestamps within five minutes, rejects reused nonces, and applies a shared request limit. No signing secret reaches the browser.

## Source grouping and retention

The cookie is created only after an explicit interaction, scoped to the event-response API, HttpOnly, SameSite=Strict, and Secure on HTTPS. Each event has its own cookie containing a random token, issue time, and an event-bound signature. Postgres stores only its HMAC digest, event ID, capped tap count, and expiry. Cookies and contributions have a fixed 90-day lifetime; repeat taps do not extend it. Removing a response deletes its row and expires its cookie. The reset control becomes available after pending writes finish.

No IP address, fingerprint, account ID, or event-to-event browser identifier is collected by this feature. Existing hosting/access logs and site analytics have their own policies. Cookie-based grouping is approximate: a shared browser is one source, another browser or cleared cookie is another, and it cannot prevent determined manipulation. Secret rotation invalidates existing cookies; old contributions remain until expiry, so coordinated rotation can temporarily allow repeat contributions. Review the site's privacy notice and retention operations before production rollout.

## Tests

Run `npm run test:web`, `npm run typecheck`, and `npm run build` in this repository. Run the personal backend's API and PostgreSQL tests:

    EVENT_INTEREST_TEST_DATABASE_URL=postgresql+asyncpg://... uv run pytest tests/api/event_interest

Use a disposable database for that test. It creates the response table if needed and removes its synthetic event rows. Tests cover weighted levels, bounded inputs, signed source cookies, same-origin writes, source initialization, auth/replay rejection, coalescing, concurrency, event isolation, deletion, and expiry.

The animation is original SVG, CSS, and Web Animations, inspired by Josh Comeau's [cursor interaction and particle explanations](https://whimsy.joshwcomeau.com/). His [blog source is closed](https://www.joshwcomeau.com/blog/why-my-blog-is-closed-source/); no heart artwork or private source was copied.
