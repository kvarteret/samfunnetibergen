# Import TicketCo events and notify editors

The TicketCo job searches `https://ticketco.events/no/nb?pattern=kvarter`, extracts complete Norwegian and English submissions with the existing Azure `gpt-6-luna` deployment, and creates `arrangement` documents with `approvalStatus: pending`. It uses the same document builder and validation as `/arrangementer/ny`.

Luna editorializes concert titles to artist names only, preserving co-headliners while removing venue, organizer, promotional labels and support-act wording. Support acts remain in the description.

The submitter is always `E-tjenesten's Skonk`, with `it.leder@kvarteret.no`. No email is sent by this importer. Ticket URLs are normalized to Norwegian locale without tracking parameters or fragments; a SHA-256 hash of that canonical link provides a stable Sanity document ID. Existing pending, rejected, approved, or draft arrangements with the same canonical ticket link are skipped. Repeated imports never overwrite editor changes.

## Runtime configuration

Infisical `/nettside` owns `SANITY_WRITE_TOKEN`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `AZURE_OPENAI_ENDPOINT`, and `AZURE_OPENAI_API_KEY`. The Azure endpoint is the resource root; `/openai/v1` is also accepted. `AZURE_OPENAI_BASE_URL` is accepted for existing local environments. `AZURE_OPENAI_LUNA_DEPLOYMENT` defaults to `gpt-6-luna`; use an alias only when it serves that Luna deployment.

The GitHub `production` environment needs copies of those five named runtime values as secrets. The dedicated incoming webhook `SLACK_NETTSIDE_WEBHOOK` must target `#nettside`; Slack incoming webhooks determine the channel, so the application cannot redirect a webhook bound to another channel. Store this webhook in Infisical, declare it in `infra/secrets/nettside-prod/fnox.toml`, and synchronize it to the website runtime and GitHub production environment. The Skonk webhook supplied for this integration is configured in Infisical and the GitHub production environment. Its URL is never stored in Git.

Scheduled workflows run from the repository's default branch, currently `develop`. `.github/workflows/import-ticketco.yml` checks daily at 05:17 UTC. A Sanity state document enforces at least 72 hours since the last fully successful run. Partial failures do not advance that timestamp; the next daily check retries failed events while skipping already imported links. A 30-minute revision-checked lease protects concurrent jobs, and GitHub limits the job to 25 minutes. GitHub may delay schedules.

## Preview and run

From the repository root, preview with:

    mise run secrets:exec -- npm --workspace @samfunnet/web run events:import:ticketco -- --dry-run

Dry-run performs source and model requests and reads Sanity, but writes no events, images, Slack notifications, or scheduler state. The report distinguishes discovered, skipped, validated imports, and failures. A validated dry-run entry is counted under `imported` but is not persisted.

Run an actual import with:

    mise run secrets:exec -- npm --workspace @samfunnet/web run events:import:ticketco

`--force` bypasses the 72-hour due check while preserving deduplication and the concurrency lease. Both flags are available on the GitHub manual workflow, which defaults to dry-run.

Luna reads displayed Norwegian local dates and times because TicketCo JSON-LD can incorrectly append `Z` to displayed civil timestamps. Door opening and closing times take precedence over performance times. Standard and private Crescat calendars supply overlapping bookings linked to Sanity through `crescatRoomId`. A matching event title can identify a room. When Teglverket is booked together with its bundled support spaces Støy/Stillhet for the same Crescat event, Teglverket is selected; unrelated simultaneous bookings and hidden titles cannot. Luna must select an existing room reference; location free text is always cleared. When the first extraction has no room, the importer recomputes Crescat overlaps using the validated door times and retries Luna with those bookings if title matching is inconclusive. A retry can only choose a room in that overlap. If no room is established, import fails before any event or image is created. Admission prices are read from TicketCo purchase-form rows, excluding separate fees and merchandise. Explicit TicketCo “Utsolgt” or “no tickets available” evidence sets `isSoldOut`, shown on the public event card and detail page. Sold-out events may have no remaining price; other paid events with no identifiable price are reported for retry. A missing price alone never means sold out. Facebook event links found in the ticket source are imported; organizer profiles are excluded. Missing required times fail validation rather than producing made-up schedules. A closing time before opening denotes the next day. Source images are uploaded best effort only from TicketCo's observed S3 upload hosts, with the form's supported types and 10 MB limit. Missing images do not block import.

## Pending requests in Slack

Public form submissions and new TicketCo imports attempt an immediate notification. `.github/workflows/sync-pending-slack.yml` also checks all pending arrangements hourly at minute 37, covering Studio-created requests and retrying delivery failures. Messages contain title, date, submitter, and a direct Studio review link. TicketCo imports also include: “Dette arrangementet var automatisk generert fra {ticket_link}. Se nøye gjennom!”, with their source ticket URL. The first sync includes existing pending requests that have no receipt.

Run the sweep with:

    mise run secrets:exec -- npm --workspace @samfunnet/web run events:sync:pending-slack

Separate `pendingSlackDelivery` receipt documents prevent ordinary duplicates without editing arrangement revisions. Published and draft versions share one receipt. A short revision-checked lease prevents concurrent sends. Delivery is at least once: a process failure after Slack accepts a message but before the receipt is committed can result in one retry duplicate. Re-entering pending after a prior successful notification does not resend the request.

## Verification

Run `npm run test`, `npm run sanity:typegen`, `npm run route-typegen`, `npm run typecheck`, `npm run format:check`, `npm run lint`, and `npm run build` through `mise exec --`. Importer tests cover URL variants, existing editorial documents, dry-run writes, overnight room overlaps, hidden/ambiguous calendar titles, required times, and the 72-hour boundary. Slack tests cover safe text rendering, Studio links, delivered receipts, and retry after failure.

Door opening and closing are mandatory for each dated submission row and in the Studio date schema. Blank optional rows remain ignored. Existing records are not migrated; editors must fill missing times before publishing edited records.

## Luna analytics

Each Luna request sends an awaited `$ai_generation` event to the existing Samfunnet i Bergen PostHog project. Events include the public TicketCo source, validated extracted fields, model, token counts, latency, source URL and safe failure labels. Internal calendar inputs and the model's booking evidence are omitted. Multiple extraction attempts share a trace, and a final validation span records the resolved room or fatal validation failure; provisional model output is not the import outcome. PostHog failures do not fail event imports. `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` configure capture and are supplied by the GitHub production environment. Dry-runs still use Luna and record analytics; they do not create arrangements or Slack messages. PostHog estimates costs when it recognizes the model/provider; token counts remain useful even if custom Luna pricing is unavailable. See https://posthog.com/docs/ai-observability/installation/manual-capture.
