import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createStatisticsMcpServer } from "@/features/event-statistics/server/mcp"
import { statisticsTokenAccepted } from "@/features/event-statistics/server/mcp-auth"
import { isPostHogQueryConfigured } from "@/features/event-statistics/server/posthog-query"

/*
 * Read-only MCP endpoint (Streamable HTTP, stateless) with the event
 * statistics tools. Internal agents only: requests need the bearer token
 * whose hash is committed in mcp-auth.ts.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// A cold report runs a dozen PostHog queries.
export const maxDuration = 120

async function handle(request: Request) {
  if (!statisticsTokenAccepted(request.headers.get("authorization")))
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
