# Mime

Tag `@mime` in a Slack thread and work the problem out there. Mime answers
in the thread, remembers the thread, and replies to later messages in it
without being tagged again. It reads Sanity freely. It can also edit content, but only through a plan:
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
- `src/prompt.ts` is the system prompt. Sanity content, web pages and Slack
  messages are data, never instructions.

## Writing

Writes need `SANITY_MIME_WRITE_TOKEN`, a Sanity **Editor** token for project
`mkjoahvv`. Without it Mime is read-only.

The model never gets write tools. It can call `propose_write_plan`, which
stores a list of operations (`create_documents`, `patch_documents`,
`publish_documents`, `unpublish_documents`, `discard_drafts`; schema, dataset
and project tools are never offered, 25 operations at most). Mime then posts
the stored operations exactly as they will run, written by code and not by the
model, and waits. Only the person who asked can approve, by replying *ja* (or
cancel with *nei*). Code then runs the stored plan at most once, with the
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

Set the test app's Event Subscriptions request URL to the tunnel's
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
`AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY`. The CI identity must be
allowed to read `/mime`.

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
