// The model and the read-only tools, shared by the Slack agent and the eval
// runner so both answer with exactly the same setup.

import { createAzure } from "@ai-sdk/azure"
import type { ToolSet } from "ai"
import { connectContext, contextOptions } from "./context"
import { eventTools } from "./events"
import { connectSanity } from "./sanity"
import { connectStats, statsOptions } from "./stats"
import { type BrowserRendering, webTools } from "./web"

export type ModelEnv = {
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  STUDIO_URL: string
  SITE_URL?: string
  AZURE_OPENAI_LUNA_DEPLOYMENT: string
  AZURE_OPENAI_ENDPOINT: string
  AZURE_OPENAI_API_KEY: string
  SANITY_MIME_READ_TOKEN: string
  /** "off" turns off Azure's built-in web search. On by default. */
  WEB_SEARCH?: string
  /** Browser Rendering for JavaScript-drawn pages; both or neither. */
  CLOUDFLARE_ACCOUNT_ID?: string
  BROWSER_RENDERING_TOKEN?: string
  SANITY_CONTEXT_MCP_URL?: string
  SANITY_CONTEXT_TOKEN?: string
  /** Website statistics MCP. URL defaults to SITE_URL + /api/mcp/statistikk. */
  STATISTICS_MCP_URL?: string
  STATISTICS_SIGNING_KEY?: string
}

export function osloToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function azureFor(env: ModelEnv) {
  return createAzure({
    baseURL: `${env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "").replace(/\/openai(\/v1)?$/, "")}/openai`,
    apiKey: env.AZURE_OPENAI_API_KEY,
  })
}

export function createModel(env: ModelEnv) {
  return azureFor(env).responses(env.AZURE_OPENAI_LUNA_DEPLOYMENT)
}

export function webSearchEnabled(env: ModelEnv) {
  return env.WEB_SEARCH !== "off"
}

export function browserRendering(env: ModelEnv): BrowserRendering | undefined {
  return env.CLOUDFLARE_ACCOUNT_ID && env.BROWSER_RENDERING_TOKEN
    ? {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        token: env.BROWSER_RENDERING_TOKEN,
      }
    : undefined
}

/**
 * Sanity (events, GROQ, optional Context search) and the web. The caller
 * closes the MCP connections with `close`.
 */
export function sanityScope(env: ModelEnv) {
  return {
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    token: env.SANITY_MIME_READ_TOKEN,
    studioUrl: env.STUDIO_URL,
    siteUrl: env.SITE_URL,
  }
}

export async function readTools(env: ModelEnv, today: () => string) {
  const scope = sanityScope(env)
  const contextConfig = contextOptions(env)
  const statsConfig = statsOptions(env)
  const [sanity, context, stats] = await Promise.all([
    connectSanity({
      token: env.SANITY_MIME_READ_TOKEN,
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
    }),
    // Context is an extra; Mime still answers if it is down.
    contextConfig
      ? connectContext(contextConfig).catch(error => {
          console.error(
            "mime context unavailable",
            error instanceof Error ? error.name : "unknown",
          )
          return undefined
        })
      : undefined,
    // Statistics too: without them Ludvig says it cannot see the numbers.
    statsConfig
      ? connectStats(statsConfig).catch(error => {
          console.error(
            "mime statistics unavailable",
            error instanceof Error ? error.name : "unknown",
          )
          return undefined
        })
      : undefined,
  ])
  const tools: ToolSet = {
    ...sanity.tools,
    ...(context?.tools ?? {}),
    ...(stats?.tools ?? {}),
    ...eventTools(scope, today),
    ...webTools({ browser: browserRendering(env) }),
    ...(webSearchEnabled(env)
      ? {
          web_search: azureFor(env).tools.webSearch({
            searchContextSize: "medium",
            userLocation: {
              type: "approximate",
              country: "NO",
              city: "Bergen",
              timezone: "Europe/Oslo",
            },
          }),
        }
      : {}),
  }
  return {
    tools,
    context: Boolean(context),
    stats: Boolean(stats),
    close: async () => {
      await sanity.close().catch(() => undefined)
      await context?.close().catch(() => undefined)
      await stats?.close().catch(() => undefined)
    },
  }
}

/** What Mime shows while a tool runs. */
export function toolStatus(name: string) {
  if (name === "find_events") return "Sjekker programmet…"
  if (name === "get_event") return "Leser arrangementet…"
  if (name === "event_stats" || name === "event_stats_detail")
    return "Teller besøk…"
  if (name === "web_search") return "Søker på nettet…"
  if (
    ["fetch_page", "page_links", "open_pages", "extract_events"].includes(name)
  )
    return "Leser nettsider…"
  if (name === "read_thread") return "Leser tråden…"
  if (name === "propose_write_plan" || name.startsWith("plan_"))
    return "Lager et forslag…"
  return "Slår opp i Sanity…"
}
