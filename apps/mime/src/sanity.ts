import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

export const SANITY_MCP_URL = "https://mcp.sanity.io"

/**
 * The Sanity MCP tools the model may call: reads only. Everything else the
 * server offers is never shown to the model.
 */
export const READ_TOOLS = new Set([
  "query_documents",
  "get_document",
  "get_schema",
])

/**
 * Content editing only. Schema deploys, datasets, projects, CORS and media
 * library tools are never offered. The model never receives these tools: a
 * human-approved plan is executed by code (see writes.ts).
 */
export const WRITE_TOOLS = new Set([
  "create_documents",
  "patch_documents",
  "publish_documents",
  "unpublish_documents",
  "discard_drafts",
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

export function allowedDefinitions(
  listed: ListedTools,
  allowed: ReadonlySet<string> = READ_TOOLS,
): ListedTools {
  return {
    ...listed,
    tools: listed.tools
      .filter(tool => allowed.has(tool.name))
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
  allowed?: ReadonlySet<string>
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
  const definitions = allowedDefinitions(
    await client.listTools(),
    options.allowed,
  )
  const tools = scopeTools(client.toolsFromDefinitions(definitions), options)
  return { tools, definitions, close: () => client.close() }
}
