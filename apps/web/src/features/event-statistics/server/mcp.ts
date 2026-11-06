import "server-only"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { resolveSiteUrl } from "@/lib/site-url"
import {
  aggregateSeries,
  type EventDetail,
  type EventStatistic,
  matchesSearch,
  type StatisticsPeriod,
  type StatisticsReport,
  type StatisticsScope,
} from "../domain/statistics"
import { cachedEventDetail, cachedStatisticsReport } from "./cached"

/*
 * The /arrangementer/statistikk numbers as MCP tools, for internal agents
 * (the Slack bot). Same queries and the same cache as the page, Admin scope.
 * Only aggregates leave this server: counts per arrangement, group, day,
 * channel or device, never anything about a single visitor.
 */

const ADMIN: StatisticsScope = { groups: null }

const PERIOD = z
  .union([z.literal(7), z.literal(30), z.literal(90)])
  .optional()
  .describe("Antall dager bakover, med i dag. 7, 30 (standard) eller 90.")

function statsUrl(siteUrl: string, slug: string, period: StatisticsPeriod) {
  return `${siteUrl}/arrangementer/statistikk/${encodeURIComponent(slug)}?periode=${period}`
}

function eventRow(
  event: EventStatistic,
  siteUrl: string,
  period: StatisticsPeriod,
) {
  return {
    title: event.title,
    slug: event.slug,
    series: event.series?.title ?? null,
    instances: event.instanceCount,
    organizer: event.organizerName,
    firstDate: event.firstDate,
    lastDate: event.lastDate,
    cancelled: event.isCancelled,
    soldOut: event.isSoldOut,
    promoted: event.isPromoted,
    views: event.views,
    visitors: event.visitors,
    sessions: event.sessions,
    ticketClicks: event.ticketClicks,
    facebookClicks: event.facebookClicks,
    hasTicketLink: event.hasTicketLink,
    medianSecondsOnPage: event.medianSeconds,
    websiteUrl: `${siteUrl}/arrangementer/${encodeURIComponent(event.slug)}`,
    statsUrl: statsUrl(siteUrl, event.slug, period),
  }
}

export type EventStatsInput = {
  period?: StatisticsPeriod
  text?: string
  organizer?: string
  sort?: "views" | "ticketClicks" | "visitors"
  limit?: number
  perDate?: boolean
}

export function eventStatsResult(
  report: StatisticsReport,
  input: EventStatsInput,
  siteUrl: string,
) {
  const period = report.period
  const rows = (
    input.perDate ? report.events : aggregateSeries(report.events)
  ).filter(
    event =>
      (!input.text || matchesSearch(event, input.text)) &&
      (!input.organizer ||
        (event.organizerName ?? "")
          .toLocaleLowerCase("nb")
          .includes(input.organizer.trim().toLocaleLowerCase("nb"))),
  )
  const sort = input.sort ?? "views"
  rows.sort((a, b) => b[sort] - a[sort] || b.views - a.views)
  const limit = Math.min(Math.max(input.limit ?? 15, 1), 50)
  const sum = (key: "views" | "ticketClicks" | "facebookClicks") =>
    rows.reduce((total, event) => total + event[key], 0)
  return {
    period,
    matched: rows.length,
    // Visitors and sessions are unique counts and cannot be summed across
    // events; the site-wide totals cover every arrangement.
    matchedTotals: {
      views: sum("views"),
      ticketClicks: sum("ticketClicks"),
      facebookClicks: sum("facebookClicks"),
    },
    siteTotals: report.eventTotals,
    events: rows.slice(0, limit).map(row => eventRow(row, siteUrl, period)),
    groups:
      input.text || input.organizer
        ? undefined
        : report.groups.slice(0, 10).map(group => ({
            name: group.name,
            slug: group.slug,
            views: group.views,
            visitors: group.visitors,
          })),
    overviewUrl: `${siteUrl}/arrangementer/statistikk?periode=${period}`,
  }
}

export function eventDetailResult(
  detail: EventDetail,
  period: StatisticsPeriod,
  siteUrl: string,
) {
  const { event, exposure } = detail
  return {
    period,
    title: event.title,
    slug: event.slug,
    organizer: event.organizerName,
    partOf: detail.partOf?.title ?? null,
    firstDate: event.firstDate,
    lastDate: event.lastDate,
    cancelled: event.isCancelled,
    soldOut: event.isSoldOut,
    hasTicketLink: event.hasTicketLink,
    totals: detail.totals,
    daily: detail.daily,
    dailyClicks: detail.dailyClicks,
    channels: detail.channels,
    entrySurfaces: detail.entrySurfaces,
    referringSites: detail.sites,
    devices: detail.devices,
    viewsByDaysBeforeEvent: detail.leadTime,
    instances: detail.instances.map(instance => ({
      firstDate: instance.firstDate,
      views: instance.views,
      ticketClicks: instance.ticketClicks,
    })),
    frontPage: {
      campaigns: exposure.campaigns,
      shownNow: exposure.shownNow,
      promotedDays: exposure.promotedDays,
      viewsPerPromotedDay: exposure.viewsPerPromotedDay,
      viewsPerOtherDay: exposure.viewsPerOtherDay,
      highlightedImpressions: exposure.highlightedImpressions,
      highlightedClicks: exposure.highlightedClicks,
      upcomingClicks: exposure.upcomingClicks,
    },
    statsUrl: statsUrl(siteUrl, event.slug, period),
  }
}

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] }
}

export function createStatisticsMcpServer() {
  const siteUrl = resolveSiteUrl()
  const server = new McpServer({
    name: "samfunnetibergen-statistikk",
    version: "1.0.0",
  })

  server.registerTool(
    "event_stats",
    {
      title: "Arrangementsstatistikk",
      description:
        "Besøksstatistikk for arrangementssidene på samfunnetibergen.no (PostHog), de samme tallene som /arrangementer/statistikk: visninger, unike besøkende, økter, klikk på billettlenke og Facebook-arrangement, og median tid på siden, per arrangement (serier slått sammen). Filtrer på ord i tittelen eller arrangør. Tallene er hurtigbufret i opptil 15 minutter; generatedAt sier hvor ferske de er.",
      inputSchema: {
        period: PERIOD,
        text: z
          .string()
          .optional()
          .describe("Ord fra tittelen eller serien, f.eks. 'quiz'."),
        organizer: z
          .string()
          .optional()
          .describe("Ord fra arrangørens navn, f.eks. 'Immaturus'."),
        sort: z
          .enum(["views", "ticketClicks", "visitors"])
          .optional()
          .describe("Sorter etter. Standard: views."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Antall rader. Standard 15."),
        perDate: z
          .boolean()
          .optional()
          .describe("Én rad per dato i serier i stedet for én per serie."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async input => {
      const period = input.period ?? 30
      const cached = await cachedStatisticsReport(ADMIN, period)
      return json({
        generatedAt: cached.generatedAt,
        ...eventStatsResult(cached.value, input, siteUrl),
      })
    },
  )

  server.registerTool(
    "event_stats_detail",
    {
      title: "Statistikk for ett arrangement",
      description:
        "Detaljert statistikk for ett arrangement eller én serie (slug fra event_stats eller nettsiden): totaler, visninger og klikk per dag, kanaler og nettsider besøkende kom fra, enheter, hvor mange dager før arrangementet folk så siden, datoene i serien, og hvordan forsidefremheving virket. Hurtigbufret i opptil 15 minutter.",
      inputSchema: {
        slug: z.string().min(1).max(200).describe("Arrangementets slug."),
        period: PERIOD,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ slug, period = 30 }) => {
      const cached = await cachedEventDetail(ADMIN, slug, period)
      if (!cached.value)
        return json({ error: `Fant ikke arrangementet «${slug}».` })
      return json({
        generatedAt: cached.generatedAt,
        ...eventDetailResult(cached.value, period, siteUrl),
      })
    },
  )

  return server
}
