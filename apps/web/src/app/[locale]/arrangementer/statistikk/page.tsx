import type { Metadata } from "next"
import { Suspense } from "react"

import { Tag } from "@/components/ui/tag"
import { EventStatisticsTable } from "@/features/event-statistics/components/EventStatisticsTable"
import { GroupStatisticsCards } from "@/features/event-statistics/components/GroupStatisticsCards"
import {
  DailyTrendChart,
  TopListChart,
} from "@/features/event-statistics/components/StatisticsChart"
import {
  AccessNotice,
  accentText,
  displayHeading,
  EmptyState,
  FremhevetDefinition,
  Kpi,
  KpiGrid,
  Panel,
  PeriodNav,
  Section,
  UnavailableNotice,
} from "@/features/event-statistics/components/StatisticsLayout"
import {
  formatDuration,
  parsePeriod,
  type StatisticsPeriod,
  type StatisticsReport,
} from "@/features/event-statistics/domain/statistics"
import {
  resolveStatisticsAccess,
  type StatisticsViewer,
} from "@/features/event-statistics/server/access"
import { isPostHogQueryConfigured } from "@/features/event-statistics/server/posthog-query"
import { buildStatisticsReport } from "@/features/event-statistics/server/statistics"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { emitOperationalEvent } from "@/lib/observability"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arrangementstatistikk",
  robots: { index: false, follow: false, nocache: true },
}

const _numberFormatter = new Intl.NumberFormat("nb-NO")

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ periode?: string | string[] }>
}

export default async function ArrangementStatistikkPage({
  params,
  searchParams,
}: PageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const period = parsePeriod((await searchParams).periode)
  const access = await resolveStatisticsAccess()

  if (access.status !== "granted" || !isPostHogQueryConfigured()) {
    return access.status === "granted" ? (
      <UnavailableNotice />
    ) : (
      <AccessNotice access={access} />
    )
  }

  let report: StatisticsReport
  try {
    report = await buildStatisticsReport(access.viewer, period)
  } catch (error) {
    emitOperationalEvent("event_statistics.report.failed", {
      failure_stage: "report",
      error_category: error instanceof Error ? error.message : "unknown",
    })
    if (process.env.NODE_ENV === "development") console.error(error)
    return <UnavailableNotice />
  }

  const isAdmin = access.viewer.groups === null
  return (
    <div className="flex w-full flex-col gap-16 pb-12 sm:gap-20">
      <StatisticsHeader
        viewer={access.viewer}
        period={period}
        local={access.local}
      />

      <Section id="arrangementer" title="Arrangementer">
        <KpiGrid>
          <Kpi
            caption="Ganger en arrangementsside ble åpnet."
            featured
            label="Visninger"
            value={report.eventTotals.views}
          />
          <Kpi
            caption="Ulike personer som åpnet minst én arrangementsside."
            label="Unike besøkende"
            value={report.eventTotals.visitors}
          />
          <Kpi
            caption="Separate besøk på nettsiden som var innom en arrangementsside."
            label="Unike økter"
            value={report.eventTotals.sessions}
          />
          <Kpi
            caption="Klikk på billettknappen videre til billettsalget."
            label="Billettklikk"
            value={report.eventTotals.ticketClicks}
          />
          <Kpi
            caption="Klikk på lenken til Facebook-arrangementet."
            label="Facebook-klikk"
            value={report.eventTotals.facebookClicks}
          />
          <Kpi
            caption="Hvor lenge et typisk besøk ble på arrangementssiden."
            label="Tid på siden (median)"
            text={formatDuration(report.eventTotals.medianSeconds)}
          />
        </KpiGrid>

        {report.events.length === 0 ? (
          <EmptyState>
            {isAdmin
              ? "Ingen arrangementer har fått besøk i denne perioden."
              : "Ingen av gruppenes arrangementer har fått besøk i denne perioden."}
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Panel
                caption="Visninger og unike besøkende på arrangementssidene hver dag."
                title="Besøk per dag"
              >
                <DailyTrendChart
                  key={`events-${period}`}
                  label={`Visninger og unike besøkende per dag de siste ${period} dagene`}
                  days={report.eventDaily.map(point => point.day)}
                  series={[
                    {
                      name: "Visninger",
                      values: report.eventDaily.map(point => point.views),
                    },
                    {
                      name: "Unike besøkende",
                      values: report.eventDaily.map(point => point.visitors),
                    },
                  ]}
                />
              </Panel>
              <Panel
                caption="Arrangementene med flest visninger i perioden."
                title="Mest sett"
              >
                <TopListChart
                  key={`top-${period}`}
                  label="De mest sette arrangementene i perioden"
                  valueName="Visninger"
                  items={report.events.slice(0, 8).map(event => ({
                    name: event.title,
                    value: event.views,
                  }))}
                />
              </Panel>
            </div>
            <FremhevetDefinition />
            <Suspense>
              <EventStatisticsTable
                events={report.events}
                period={period}
                today={getOsloDateString()}
              />
            </Suspense>
          </>
        )}
      </Section>

      <Section
        id="gruppesider"
        title={isAdmin ? "Gruppesider" : "Gruppesiden din"}
      >
        <KpiGrid>
          <Kpi
            caption="Ganger en gruppeside ble åpnet."
            featured
            label="Visninger"
            value={report.groupTotals.views}
          />
          <Kpi
            caption="Ulike personer som åpnet minst én gruppeside."
            label="Unike besøkende"
            value={report.groupTotals.visitors}
          />
          <Kpi
            caption="Separate besøk på nettsiden som var innom en gruppeside."
            label="Unike økter"
            value={report.groupTotals.sessions}
          />
        </KpiGrid>
        {report.groups.length === 0 ? (
          <EmptyState>
            {isAdmin
              ? "Ingen gruppesider har fått besøk i denne perioden."
              : "Du er ikke gruppeadmin for noen aktive grupper ennå."}
          </EmptyState>
        ) : (
          <>
            <Panel
              caption="Visninger og unike besøkende på gruppesidene hver dag."
              title="Besøk per dag"
            >
              <DailyTrendChart
                key={`groups-${period}`}
                label={`Visninger og unike besøkende på gruppesider per dag de siste ${period} dagene`}
                days={report.groupDaily.map(point => point.day)}
                series={[
                  {
                    name: "Visninger",
                    values: report.groupDaily.map(point => point.views),
                  },
                  {
                    name: "Unike besøkende",
                    values: report.groupDaily.map(point => point.visitors),
                  },
                ]}
              />
            </Panel>
            <GroupStatisticsCards groups={report.groups} />
          </>
        )}
      </Section>
    </div>
  )
}

function StatisticsHeader({
  viewer,
  period,
  local,
}: {
  viewer: StatisticsViewer
  period: StatisticsPeriod
  local: boolean
}) {
  return (
    <header className="flex flex-col gap-8 pt-4 sm:pt-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Tag variant="accent">{viewer.role}</Tag>
          {viewer.groups?.map(group => (
            <Tag
              key={group.slug}
              className="normal-case tracking-normal"
              variant="outline"
            >
              {group.name}
            </Tag>
          ))}
          {local && (
            <Tag className="normal-case tracking-normal" variant="outline">
              Lokal utvikling
            </Tag>
          )}
        </div>
        <h1 className={cn(displayHeading, "text-5xl sm:text-6xl lg:text-7xl")}>
          Slik går det med
          <span className={cn("block", accentText)}>arrangementene</span>
          <span className={cn("block", accentText)}>våres.</span>
        </h1>
      </div>
      <PeriodNav basePath="/arrangementer/statistikk" period={period} />
    </header>
  )
}
