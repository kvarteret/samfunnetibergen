// Ask a locally running Mime a question in Slack, without a tunnel and
// without touching the Slack app's settings: this signs an app_mention the
// way Slack does and posts it to `npm run dev:mime`. The answer is posted to
// Slack by the bot token in .dev.vars, so it shows up in the channel.
//
//   npm run dev:mime                                    (terminal 1)
//   npm run ask:mime -- "arrangement i dag?"            (terminal 2: new thread)
//   npm run ask:mime -- "og i morgen?" --thread 1793797242.903499
//
// Needs in .dev.vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, ALLOWED_CHANNELS,
// and MIME_TEST_USER (your Slack member ID: profile → ⋮ → Copy member ID).
// MIME_TEST_CHANNEL picks the channel (default: the first allowed one); use
// a private test channel so tests don't land in #nettside.

import { createHmac } from "node:crypto"
import { readFileSync } from "node:fs"

const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .map(line => line.replace(/\s+#.*$/, "").trim())
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
) as Record<string, string>

const args = process.argv.slice(2)
const flag = (name: string) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args.splice(index, 2)[1] : undefined
}
const thread = flag("thread")
const channel =
  flag("channel") ??
  vars.MIME_TEST_CHANNEL ??
  vars.ALLOWED_CHANNELS?.split(",")[0]?.trim()
const user = flag("user") ?? vars.MIME_TEST_USER
const port = flag("port") ?? "1998"
const question = args.join(" ").trim()

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

if (!question) fail('Usage: npm run ask:mime -- "spørsmål" [--thread <ts>]')
if (!channel) fail("Set MIME_TEST_CHANNEL or ALLOWED_CHANNELS in .dev.vars.")
if (!user)
  fail("Set MIME_TEST_USER (your Slack member ID) in apps/mime/.dev.vars.")
if (!vars.SLACK_BOT_TOKEN || !vars.SLACK_SIGNING_SECRET)
  fail("SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET must be in .dev.vars.")

async function slack(method: string, body: Record<string, string>) {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${vars.SLACK_BOT_TOKEN}` },
    body: new URLSearchParams(body),
  })
  const json = (await response.json()) as Record<string, unknown>
  if (!json.ok) fail(`Slack ${method}: ${json.error}`)
  return json
}

const auth = (await slack("auth.test", {})) as {
  user_id: string
  team_id: string
  url: string
}

// A new question gets its own thread, started by the bot.
const threadTs =
  thread ??
  ((
    await slack("chat.postMessage", {
      channel,
      text: `🧪 Lokal test: ${question}`,
    })
  ).ts as string)

const now = Date.now() / 1000
const body = JSON.stringify({
  type: "event_callback",
  event_id: `EvLocal${Math.round(now * 1000)}`,
  team_id: auth.team_id,
  authorizations: [{ user_id: auth.user_id, is_bot: true }],
  event: {
    type: "app_mention",
    channel,
    user,
    text: `<@${auth.user_id}> ${question}`,
    ts: now.toFixed(6),
    thread_ts: threadTs,
  },
})
const timestamp = String(Math.floor(now))
const signature = `v0=${createHmac("sha256", vars.SLACK_SIGNING_SECRET)
  .update(`v0:${timestamp}:${body}`)
  .digest("hex")}`

const response = await fetch(`http://localhost:${port}/slack/events`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-slack-request-timestamp": timestamp,
    "x-slack-signature": signature,
  },
  body,
}).catch(() => fail(`Nothing on localhost:${port}. Start npm run dev:mime.`))
if (!response.ok) fail(`Local Mime answered ${response.status}.`)

console.log(`Sent. Mime answers in the thread:`)
console.log(
  `${auth.url}archives/${channel}/p${threadTs.replace(".", "")}  (--thread ${threadTs})`,
)
