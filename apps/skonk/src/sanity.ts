import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

export const SANITY_MCP_URL = "https://mcp.sanity.io"

/**
 * The only Sanity MCP tools Skonk may call. Everything else the server offers
 * (schema deploys, publishing, datasets, projects) is never shown to the
 * model. Writes go through Skonk's own tools, which call Nettside.
 */
export const READ_TOOLS = new Set([
  "query_documents",
  "get_document",
  "get_schema",
])

// The project and dataset are fixed; the model is never asked for them.
const SCOPE_PARAMS = ["projectId", "dataset"] as const

type ListedTools = Awaited<ReturnType<MCPClient["listTools"]>>
type ListedTool = ListedTools["tools"][number]

export function withoutScopeParams(tool: ListedTool): ListedTool {
  const schema = tool.inputSchema
  const properties = { ...(schema.properties ?? {}) }
  for (const name of SCOPE_PARAMS) delete properties[name]
  return {
    ...tool,
    inputSchema: {
      ...schema,
      properties,
      required: ((schema.required as string[] | undefined) ?? []).filter(
        name => !(SCOPE_PARAMS as readonly string[]).includes(name),
      ),
    },
  }
}

export function allowedDefinitions(listed: ListedTools): ListedTools {
  return {
    ...listed,
    tools: listed.tools
      .filter(tool => READ_TOOLS.has(tool.name))
      .map(withoutScopeParams),
  }
}

/** Wraps each tool so every call carries the fixed project and dataset. */
export function scopeTools<T extends ToolSet>(
  tools: T,
  scope: { projectId: string; dataset: string },
): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      {
        ...tool,
        execute: tool.execute
          ? (args: Record<string, unknown>, options: unknown) =>
              // biome-ignore lint/style/noNonNullAssertion: checked above
              tool.execute!({ ...args, ...scope }, options as never)
          : undefined,
      },
    ]),
  ) as ToolSet
}

export async function connectSanity(options: {
  token: string
  projectId: string
  dataset: string
}) {
  const client = await createMCPClient({
    // mcp.sanity.io only speaks up to 2025-11-25 and rejects the discovery probe.
    protocolVersionDiscovery: false,
    transport: {
      type: "http",
      url: SANITY_MCP_URL,
      // workerd rejects fetch's redirect: "error", which is this transport's default.
      redirect: "follow",
      headers: { Authorization: `Bearer ${options.token}` },
    },
  })
  const definitions = allowedDefinitions(await client.listTools())
  const tools = scopeTools(client.toolsFromDefinitions(definitions), options)
  return { tools, close: () => client.close() }
}
