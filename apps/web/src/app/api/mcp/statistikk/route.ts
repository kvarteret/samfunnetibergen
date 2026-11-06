import { timingSafeEqual } from "node:crypto"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createStatisticsMcpServer } from "@/features/event-statistics/server/mcp"
import { isPostHogQueryConfigured } from "@/features/event-statistics/server/posthog-query"

/*
 * Read-only MCP endpoint (Streamable HTTP, stateless) with the event
 * statistics tools. Internal agents only: requests need
 * `Authorization: Bearer $STATISTICS_MCP_TOKEN`. Without the token set, the
 * endpoint does not exist.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// A cold report runs a dozen PostHog queries.
export const maxDuration = 120

function authorized(request: Request) {
  const token = process.env.STATISTICS_MCP_TOKEN?.trim()
  if (!token) return false
  const sent = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1]
  if (!sent) return false
  const a = Buffer.from(sent)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function handle(request: Request) {
  if (!process.env.STATISTICS_MCP_TOKEN?.trim())
    return new Response("Not found", { status: 404 })
  if (!authorized(request))
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    })
  if (!isPostHogQueryConfigured())
    return new Response("Statistics are not configured", { status: 503 })

  const server = createStatisticsMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    // JSON responses are complete once handleRequest returns.
    await server.close()
  }
}

export { handle as DELETE, handle as GET, handle as POST }
