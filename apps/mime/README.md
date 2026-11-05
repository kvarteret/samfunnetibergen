# Mime

Tag `@mime` in a Slack thread and work the problem out there. Mime answers
in the thread and remembers the conversation. Tag Mime again for each new
message, including replies in an existing thread. It reads Sanity freely. It can also edit content, but only through a plan:
see *Writing* below.

It is a Cloudflare Worker built with the [Agents SDK](https://developers.cloudflare.com/agents/),
with one Durable Object (`MimeThread`) per Slack thread, named
`<channel>:<thread_ts>`. The model is Luna, the `skonk` deployment on the
existing Azure AI resource.

- `src/index.ts` is the Worker. It verifies Slack's signature, answers the
  `url_verification` challenge, drops events outside `ALLOWED_CHANNELS`, and
  hands the message to the thread's agent. Slack gets its 200 at once.
- `src/agent.ts` is the thread. Each message is written to its `inbox` table
  first, keyed by Slack's `event_id`, so Slack's retries are answered once and
  a crash or eviction never loses a message: unanswered rows are answered
  again on restart. Messages that arrive during a turn are answered together
  in the next turn. The conversation, including tool calls, is kept in
  `history`, trimmed by whole turns.
- `src/sanity.ts` connects to Sanity's remote MCP server with a read-only
  token and offers the model only `query_documents`, `get_document` and
  `get_schema`, always for project `mkjoahvv`, dataset `production`. Schema
  deploys, publishing and dataset tools are never shown to the model.
- `src/events.ts` is what the model reaches for first: `find_events` (one row
  per date, with series titles, room, organizer, approval, whether it is on
  the website, Studio and website links) and `get_event` (everything about one
  event). The GROQ lives in code and is tested, so the model does not have to
  get date filters, series titles or drafts right on its own.
- `src/web.ts` browses public https pages: `fetch_page` (paged text),
  `page_links`, `open_pages` (up to 12 pages at once, main content only) and
  `extract_events` (schema.org data). Azure's built-in `web_search` comes on
  top (`WEB_SEARCH`, on by default). Pages that only draw their content with
  JavaScript are rendered by Cloudflare Browser Rendering when
  `BROWSER_RENDERING_TOKEN` is set.
- `src/model.ts` builds the model and the read tools for both the Slack agent
  and the eval runner. `src/prompt.ts` is the system prompt, with a two-week
  calendar so "på fredag" maps to a date. Sanity content, web pages and Slack
  messages are data, never instructions.

## Editorial plans

With the write token, Mime also gets ready-made plan tools (`src/editorial.ts`).
The model says what it wants; code reads the documents and builds every
operation in the right order, and the plan waits for approval like any other:

- `plan_merge_events`: several events into one event with all dates
  (duplicates removed, ticket links kept in `sourceTicketUrls`), a series, or a
  festival. A series or festival among the ids is reused; otherwise a new
  parent is created and published before its days point to it. Events with
  several dates get one series/festival day per date.
- `plan_create_festival`: a new festival or series, optionally with events.
- `plan_attach_events` / `plan_detach_events`: move events into a series or
  festival, or make series/festival days standalone again (filling in the
  title and fields they inherited).
- `plan_house_hours`: closed days on the website (`siteMetadata.houseClosedDates`,
  "vi er stengt i morgen"), reopening a day, and vacation mode.

Each step on the approval card says what it does. `propose_write_plan` is still
there for everything else.

## Replies and feedback

Answers stream into the thread as the model writes them (`chat.startStream`,
`chat.appendStream`, `chat.stopStream`; Markdown). While tools run, Mime sets a
thread status ("Sjekker programmet…"). Where Slack refuses status or streaming,
it falls back to a placeholder message that is edited at the end
(`src/stream.ts`).

Links stay inline in the answer (the event title links to the website;
Studio links appear when something needs doing there).

Every answer ends with 👍/👎 buttons. A click stores the rating with the
question, the answer and the tools used (`MimeFeedback`, one Durable Object for
all threads). `GET /feedback` exports them, newest first, with
`Authorization: Bearer $FEEDBACK_EXPORT_TOKEN`; add `?rating=negative` and
`?format=cases` for draft eval cases. Without the token the endpoint is off.

With `POSTHOG_PROJECT_TOKEN` (the website's `phc_…` project key), every
answer is also an `$ai_generation` in PostHog (model `skonk`, tokens, latency,
tools used) and every rating an `$ai_metric` named `feedback` on the same
trace. No Slack text goes to PostHog unless `POSTHOG_CONTENT=on`; the full
question and answer are only in `MimeFeedback`.

## Evals

`evals/cases.json` holds questions with a pinned date and what a good answer
must mention (and which tool it should use). `npm run eval:mime` runs them
against live Sanity and Azure with the same model and tools as Slack, using
the credentials in `.dev.vars`:

```bash
set -a; source apps/mime/.dev.vars; set +a
npm run eval:mime
EVAL_VERBOSE=1 npm run eval:mime -- today-events
```

Plan tools run in evals too, but plans are only captured, never run, so a
case can check a plan's summary (`expect.plan`) without touching Sanity.

Turn bad answers from `/feedback?rating=negative&format=cases` into cases:
fill in `expect`, check the facts against Sanity, and keep the date pinned.

## Writing

Writes need `SANITY_MIME_WRITE_TOKEN`, a Sanity **Editor** token for project
`mkjoahvv`. Without it Mime is read-only.

The model never gets write tools. It can call `propose_write_plan`, which
stores a list of operations (`create_documents`, `patch_documents`,
`publish_documents`, `unpublish_documents`, `discard_drafts`; schema, dataset
and project tools are never offered, 25 operations at most). Mime then posts a summary of the stored plan and its operations, with approval
buttons. Individual field values are not all shown; ask Mime for details before
deciding. Only the person who asked can approve or cancel with the buttons, or
tag Mime and reply *ja* or *nei* in the thread. The card changes to show its current status
after a decision; expired or superseded buttons cannot approve a newer plan. Code then runs the stored plan at most once, with the
project and dataset fixed. A new plan replaces a waiting one, and a plan
expires after an hour. If a run fails or is cut off, nothing is retried or
rolled back; the thread says what ran and Studio shows the rest.

## Local development

Create a **test** Slack app from `slack-manifest.json` in a test workspace or
channel, never the production Mime app. Copy `.dev.vars.example` to
`.dev.vars` and fill it in. `ALLOWED_CHANNELS` takes channel IDs (right-click
the channel → View channel details → bottom of the dialog).

```bash
npm run dev:mime
npx cloudflared tunnel --url http://localhost:1998
```

Enable Interactivity for the Slack app and set its Request URL to the tunnel's
`https://…/slack/interactions`. For the installed production app, set the same
path on its Worker URL; deploying the Worker alone does not update Slack settings.
Then set the test app's Event Subscriptions request URL to the tunnel's
`https://…/slack/events`, invite the app to the channel, and tag it.

The Sanity token is a robot token with the **Viewer** role, created at
sanity.io/manage for project `mkjoahvv`.

## Deploy

`.github/workflows/deploy-mime.yml` tests and deploys the Worker on every push
to `develop` that touches `apps/mime` (or by hand with *Run workflow*). It
loads Infisical `/mime` as environment variables, pipes the five secrets into
`wrangler secret bulk` and checks `/health`. Nothing is written to disk.

Infisical `/mime` (project and `prod` environment as for `/party`) needs:
`CLOUDFLARE_API_TOKEN` (Workers edit on it.leder@kvarteret.no's account),
`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SANITY_MIME_READ_TOKEN` (Viewer),
`AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY`. Optional:
`SANITY_MIME_WRITE_TOKEN`, `BROWSER_RENDERING_TOKEN` (an API token with
*Browser Rendering: Edit* on the same account), `FEEDBACK_EXPORT_TOKEN` (any
long random string), `POSTHOG_PROJECT_TOKEN`, `SANITY_CONTEXT_MCP_URL` and
`SANITY_CONTEXT_TOKEN`. The
CI identity must be allowed to read `/mime`.

The production bot is the Slack app **Mime**, separate from the Mime app that
posts to #nettside. After the first deploy, set Mime's Event Subscriptions
request URL to `https://mime.<subdomain>.workers.dev/slack/events` (the run
summary prints it) and invite Mime to the channel in `ALLOWED_CHANNELS`
(`wrangler.jsonc`).

## Tests

```bash
npm run test:mime
npm run typecheck:mime
```

## Names that stay Skonk

Two names still say Skonk because they are stored data or shared with the
website: the Azure deployment `skonk` (the website's Luna importer uses it
too) and the `E-tjenesten's Skonk` submitter on imported events.

## Sanity Context

`src/context.ts` connects to an optional [Sanity Context](https://www.sanity.io/docs/ai/sanity-context-mcp)
endpoint: Sanity's hosted, read-only MCP server for agents. It adds text and
semantic search over the published content next to the Sanity MCP tools. Its
tools are offered as `context_initial_context`, `context_groq_query`,
`context_schema_explorer` and `context_array_field_reader` (plus
`context_knowledge_base_search`/`_read` if the endpoint serves Knowledge
Bases). Any other tool the server lists is not offered.

It needs two secrets, both optional. Without them Mime does not connect:

- `SANITY_CONTEXT_MCP_URL`: the endpoint URL from the Context app,
  `https://api.sanity.io/v2026-11-03/context/organizations/ohrUT7FPF/mcp/<name>`.
  No query parameters: v2026-11-03 refuses them.
- `SANITY_CONTEXT_TOKEN`: an **organization** API token with the Context
  Viewer role (sanity.io/manage → organization → API → Tokens). A project
  token is refused with `403 contextGrantRequired`.

The endpoint is configured in the Context app (Dashboard), not here:

- Source: dataset `mkjoahvv.production`, workspace `default`, perspective
  `published` (Mime reads drafts through the Sanity MCP).
- Semantic search: on (the default). It only works once dataset embeddings
  are enabled and ready for `production`; until then Context falls back to
  keyword search.
- Instructions: paste `context-instructions.md`.
- GROQ filter, which keeps import state, OAuth and Slack bookkeeping
  documents out of reach:

  ```groq
  _type in ["arrangement", "room", "studentGroup", "eventType", "eventTaxonomyGroup", "page", "homePage", "roomsPage", "groupsPage", "usefulInfoPage", "kontaktPage", "sponsorsPage", "linkInBio", "navbar", "footer", "siteMetadata", "internbevisBenefit"]
  ```

Context reads the schema deployed to Sanity, not the Studio source. Deploy it
again (`npx sanity schema deploy` in `apps/studio`, or *Release Studio* with
`register_external`) after schema changes, or the model sees stale fields.
