import { createMCPClient } from "@ai-sdk/mcp"

/**
 * Event statistics from the website's MCP endpoint (/api/mcp/statistikk):
 * the same PostHog numbers and cache as /arrangementer/statistikk. Only the
 * tools below are offered; anything the server adds later stays hidden until
 * it is listed here.
 */
export const STATS_TOOLS = new Set(["event_stats", "event_stats_detail"])

/**
 * Connection options, or undefined when statistics are not configured
 * (Ludvig then answers without them). STATISTICS_MCP_TOKEN is a secret in
 * Infisical /mime and must match the website's.
 */
export function statsOptions(env: {
  SITE_URL?: string
  STATISTICS_MCP_URL?: string
  STATISTICS_MCP_TOKEN?: string
}): { url: string; token: string } | undefined {
  const token = env.STATISTICS_MCP_TOKEN?.trim()
  const url =
    env.STATISTICS_MCP_URL?.trim() ||
    (env.SITE_URL
      ? `${env.SITE_URL.replace(/\/+$/, "")}/api/mcp/statistikk`
      : undefined)
  if (!url || !token) return undefined
  return { url, token }
}

export async function connectStats(options: { url: string; token: string }) {
  const client = await createMCPClient({
    protocolVersionDiscovery: false,
    transport: {
      type: "http",
      url: options.url,
      // workerd rejects fetch's redirect: "error", this transport's default.
      redirect: "follow",
      headers: { Authorization: `Bearer ${options.token}` },
    },
  })
  try {
    const listed = await client.listTools()
    const definitions = {
      ...listed,
      tools: listed.tools.filter(tool => STATS_TOOLS.has(tool.name)),
    }
    return {
      tools: client.toolsFromDefinitions(definitions),
      close: () => client.close(),
    }
  } catch (error) {
    await client.close()
    throw error
  }
}
