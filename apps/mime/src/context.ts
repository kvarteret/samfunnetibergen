import {
  createMCPClient,
  type ListToolsResult,
  type MCPClient,
} from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

/**
 * Sanity Context MCP: Sanity's hosted, read-only MCP server for agents.
 * Its endpoint is configured in the Context app (sources, perspective,
 * instructions, groqFilter), so the URL carries no parameters:
 * https://api.sanity.io/v2026-11-03/context/organizations/<orgId>/mcp/<name>
 *
 * The server only reads, but Mime still offers just the tools below, renamed
 * with a `context_` prefix so they never clash with the Sanity MCP tools in
 * sanity.ts. Tools the server adds later are not shown until listed here.
 */
export const CONTEXT_PREFIX = "context_"

/** Server tool name → what Mime tells the model about when to use it. */
export const CONTEXT_TOOLS: Readonly<Record<string, string>> = {
  // GROQ mode (a dataset source).
  initial_context:
    "Sanity Context: oversikt over skjemaet og husreglene for spørringer mot innholdet på samfunnetibergen.no. Kall den én gang før første context_groq_query i en tråd.",
  groq_query:
    "Sanity Context: kjør en GROQ-spørring mot det publiserte innholdet, med tekst- og semantisk søk (score() med match/text::query og, når det er slått på, text::semanticSimilarity). Foretrekk denne når du ikke kjenner tittelen eller id-en, for løse spørsmål som «finn arrangementet om X», «hva skjer med improteater i november» eller spørsmål om hva innholdet sier. Den ser bare publiserte dokumenter (ikke utkast). For eksakte oppslag på kjente id-er, utkast og alt som skal endres: bruk query_documents/get_document.",
  schema_explorer:
    "Sanity Context: detaljert skjema for én dokumenttype (felter, referanser). Bruk den før du filtrerer på felter du ikke har sett.",
  array_field_reader:
    "Sanity Context: les lange array- og Portable Text-felter (f.eks. beskrivelser) fra ett dokument når context_groq_query kutter dem.",
  // Knowledge Base mode (only if the endpoint also serves Knowledge Bases).
  knowledge_base_search:
    "Sanity Context: nøkkelordsøk i kunnskapsbasene. Bruk når spørsmålet gjelder hvordan noe fungerer, ikke ett bestemt dokument.",
  knowledge_base_read:
    "Sanity Context: les hele oppføringer i en kunnskapsbase, med id og stier fra context_initial_context eller context_knowledge_base_search.",
}

/**
 * Keeps only the allowlisted tools and puts Mime's guidance in front of the
 * server's own description. Names stay as the server knows them: the client
 * calls the server by the definition's name, so renaming happens afterwards
 * (see prefixTools).
 */
export function contextDefinitions(
  listed: ListToolsResult,
  allowed: Readonly<Record<string, string>> = CONTEXT_TOOLS,
): ListToolsResult {
  return {
    ...listed,
    tools: listed.tools
      .filter(tool => Object.hasOwn(allowed, tool.name))
      .map(tool => ({
        ...tool,
        description: tool.description
          ? `${allowed[tool.name]}\n\n${tool.description}`
          : allowed[tool.name],
      })),
  }
}

/** Renames every tool to `context_<name>`. */
export function prefixTools(
  tools: ToolSet,
  prefix: string = CONTEXT_PREFIX,
): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [`${prefix}${name}`, tool]),
  )
}

/**
 * The connection options, or undefined when Context is not configured (Mime
 * then simply runs without it). Both values are secrets in Infisical /mime.
 */
export function contextOptions(env: {
  SANITY_CONTEXT_MCP_URL?: string
  SANITY_CONTEXT_TOKEN?: string
}): { url: string; token: string } | undefined {
  const url = env.SANITY_CONTEXT_MCP_URL?.trim()
  const token = env.SANITY_CONTEXT_TOKEN?.trim()
  if (!url || !token) return undefined
  return { url, token }
}

async function listAllTools(client: MCPClient): Promise<ListToolsResult> {
  let page = await client.listTools()
  const tools = [...page.tools]
  while (page.nextCursor != null) {
    page = await client.listTools({ params: { cursor: page.nextCursor } })
    tools.push(...page.tools)
  }
  return { ...page, tools }
}

/**
 * Connects to a Sanity Context MCP endpoint. `token` must be an
 * organization API token with the Context Viewer role; project tokens are
 * refused with 403 contextGrantRequired.
 */
export async function connectContext(options: { url: string; token: string }) {
  const client = await createMCPClient({
    // As for mcp.sanity.io: negotiate in initialize, skip the discovery probe.
    protocolVersionDiscovery: false,
    transport: {
      type: "http",
      url: options.url,
      // workerd rejects fetch's redirect: "error", which is this transport's default.
      redirect: "follow",
      headers: { Authorization: `Bearer ${options.token}` },
    },
  })
  try {
    const definitions = contextDefinitions(await listAllTools(client))
    const tools = prefixTools(client.toolsFromDefinitions(definitions))
    return { tools, definitions, close: () => client.close() }
  } catch (error) {
    await client.close()
    throw error
  }
}
