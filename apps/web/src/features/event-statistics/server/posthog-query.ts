import "server-only"

/**
 * Read-only HogQL access to the website's PostHog project.
 *
 * Requires a PostHog personal API key with only the `query:read` scope
 * (`POSTHOG_QUERY_API_KEY`) and the numeric project id. The project token used
 * for capture cannot read data.
 */

export class StatisticsNotConfiguredError extends Error {}

type HogQLResponse = {
  results?: unknown[][]
  columns?: string[]
}

function posthogQueryConfig() {
  const apiKey = process.env.POSTHOG_QUERY_API_KEY?.trim()
  const projectId =
    process.env.POSTHOG_QUERY_PROJECT_ID?.trim() ||
    process.env.POSTHOG_CLI_PROJECT_ID?.trim()
  const host = (
    process.env.POSTHOG_QUERY_HOST?.trim() || "https://eu.posthog.com"
  ).replace(/\/+$/, "")
  if (!apiKey || !projectId || !/^\d+$/.test(projectId)) return null
  return { apiKey, projectId, host }
}

export function isPostHogQueryConfigured(): boolean {
  return posthogQueryConfig() !== null
}

/** Quote an identifier-like value as a HogQL string literal. */
export function hogqlString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}

export function hogqlStringList(values: readonly string[]): string {
  return `(${values.map(hogqlString).join(", ")})`
}

export async function runHogQL<Row extends Record<string, unknown>>(
  query: string,
  name: string,
): Promise<Row[]> {
  const config = posthogQueryConfig()
  if (!config) throw new StatisticsNotConfiguredError()

  const response = await fetch(
    `${config.host}/api/projects/${config.projectId}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `arrangement-statistikk:${name}`,
        query: { kind: "HogQLQuery", query },
      }),
      // Statistics change slowly; cache shared results for five minutes.
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(20_000),
    },
  )
  if (!response.ok) {
    throw new Error(`PostHog query ${name} failed with ${response.status}`)
  }
  const payload = (await response.json()) as HogQLResponse
  const columns = payload.columns ?? []
  return (payload.results ?? []).map(
    row =>
      Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Row,
  )
}
