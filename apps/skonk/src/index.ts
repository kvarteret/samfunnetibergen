import { getAgentByName } from "agents"
import type { Env } from "./agent"
import {
  routeEvent,
  type SlackEnvelope,
  SlackSignatureError,
  threadKey,
  verifySlackRequest,
} from "./slack"

export { SkonkThread } from "./agent"

export function allowedChannels(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map(channel => channel.trim())
      .filter(Boolean),
  )
}

async function slackEvents(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  let body: string
  try {
    body = await verifySlackRequest(request, env.SLACK_SIGNING_SECRET)
  } catch (error) {
    if (error instanceof SlackSignatureError)
      return new Response("Unauthorized", { status: 401 })
    throw error
  }
  const envelope = JSON.parse(body) as SlackEnvelope
  if (envelope.type === "url_verification")
    return Response.json({ challenge: envelope.challenge })
  if (envelope.type !== "event_callback") return new Response(null)

  const input = routeEvent(envelope, allowedChannels(env.ALLOWED_CHANNELS))
  if (!input) return new Response(null)
  // Slack wants an answer within three seconds. The agent only stores the
  // message here and answers from its own alarm.
  ctx.waitUntil(
    getAgentByName(env.SkonkThread, threadKey({ ...envelope.event }))
      .then(thread => thread.receive(input))
      .catch(error =>
        console.error(
          "skonk delivery failed",
          error instanceof Error ? error.name : "unknown",
        ),
      ),
  )
  return new Response(null)
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url)
    if (pathname === "/health") return new Response("ok")
    if (pathname === "/slack/events" && request.method === "POST")
      return slackEvents(request, env, ctx)
    return new Response("Not found", { status: 404 })
  },
} satisfies ExportedHandler<Env>
