import "server-only"

import { unstable_cache } from "next/cache"
import type { StatisticsPeriod, StatisticsScope } from "../domain/statistics"
import { buildEventDetail } from "./event-detail"
import { buildStatisticsReport } from "./statistics"

/*
 * PostHog's query API can take tens of seconds. Reports are kept in the Data
 * Cache for STATISTICS_REVALIDATE seconds; after that the next viewer still
 * gets the cached report at once while a fresh one is built in the
 * background (stale-while-revalidate). The statistics page and the
 * statistics MCP endpoint share these entries.
 *
 * The scope is part of the cache key (the function's arguments are), so an
 * Admin report is never served to a Gruppeadmin.
 */
export const STATISTICS_REVALIDATE = 15 * 60
export const STATISTICS_CACHE_TAG = "event-statistics"

export type Cached<T> = { value: T; generatedAt: string }

const report = unstable_cache(
  async (
    scope: StatisticsScope,
    period: StatisticsPeriod,
  ): Promise<Cached<Awaited<ReturnType<typeof buildStatisticsReport>>>> => ({
    value: await buildStatisticsReport(scope, period),
    generatedAt: new Date().toISOString(),
  }),
  ["event-statistics-report"],
  { revalidate: STATISTICS_REVALIDATE, tags: [STATISTICS_CACHE_TAG] },
)

const detail = unstable_cache(
  async (
    scope: StatisticsScope,
    slug: string,
    period: StatisticsPeriod,
    campaign: string | null,
  ): Promise<Cached<Awaited<ReturnType<typeof buildEventDetail>>>> => ({
    value: await buildEventDetail(scope, slug, period, campaign ?? undefined),
    generatedAt: new Date().toISOString(),
  }),
  ["event-statistics-detail"],
  { revalidate: STATISTICS_REVALIDATE, tags: [STATISTICS_CACHE_TAG] },
)

/** Only the parts of the scope that change the report, in a stable order. */
function cacheScope(scope: StatisticsScope): StatisticsScope {
  return {
    groups:
      scope.groups === null
        ? null
        : [...scope.groups]
            .map(group => ({ slug: group.slug, name: group.name }))
            .sort((a, b) => a.slug.localeCompare(b.slug)),
  }
}

export function cachedStatisticsReport(
  scope: StatisticsScope,
  period: StatisticsPeriod,
) {
  return report(cacheScope(scope), period)
}

export function cachedEventDetail(
  scope: StatisticsScope,
  slug: string,
  period: StatisticsPeriod,
  campaignParam?: string | string[],
) {
  const campaign = Array.isArray(campaignParam)
    ? (campaignParam[0] ?? null)
    : (campaignParam ?? null)
  return detail(cacheScope(scope), slug, period, campaign)
}
