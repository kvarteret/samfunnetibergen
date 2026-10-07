import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import type { ReactNode } from "react"
import { selectionControlVariants } from "@/components/ui/selection-control"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip } from "@/components/ui/tooltip"
import { StatusTags } from "@/features/event-statistics/components/EventStatisticsTable"
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
  Notice,
  Panel,
  PeriodNav,
  Section,
  UnavailableNotice,
} from "@/features/event-statistics/components/StatisticsLayout"
import {
  campaignDuration,
  clickRate,
  clickThroughRate,
  type EventDetail,
  formatDateRange,
  formatDuration,
  isExpired,
  PLACEMENT_TRACKING_START,
  parsePeriod,
} from "@/features/event-statistics/domain/statistics"
import { resolveStatisticsAccess } from "@/features/event-statistics/server/access"
import { buildEventDetail } from "@/features/event-statistics/server/event-detail"
import { isPostHogQueryConfigured } from "@/features/event-statistics/server/posthog-query"
import { Link } from "@/i18n/navigation"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { emitOperationalEvent } from "@/lib/observability"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arrangementstatistikk",
  robots: { index: false, follow: false, nocache: true },
}

const numberFormatter = new Intl.NumberFormat("nb-NO")
const count = (value: number) => numberFormatter.format(value)
const averageFormatter = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 1,
})
const formatAverage = (value: number | null) =>
  value === null ? "–" : averageFormatter.format(value)

type PageProps = {
  params: Promise<{ locale: string; event: string }>
  searchParams: Promise<{
    periode?: string | string[]
    kampanje?: string | string[]
  }>
}

export default async function EventStatisticsPage({
  params,
  searchParams,
}: PageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const { event: slug } = await params
  const query = await searchParams
  const period = parsePeriod(query.periode)
  const access = await resolveStatisticsAccess()

  if (access.status !== "granted" || !isPostHogQueryConfigured()) {
    return access.status === "granted" ? (
      <UnavailableNotice />
    ) : (
      <AccessNotice access={access} />
    )
  }

  let detail: EventDetail | null
  try {
    detail = await buildEventDetail(access.viewer, slug, period, query.kampanje)
  } catch (error) {
    emitOperationalEvent("event_statistics.detail.failed", {
      failure_stage: "detail",
      error_category: error instanceof Error ? error.message : "unknown",
    })
    if (process.env.NODE_ENV === "development") console.error(error)
    return <UnavailableNotice />
  }

  if (!detail) {
    return (
      <Notice
        title="Fant ikke arrangementet."
        action={<BackLink period={period} />}
      >
        Arrangementet finnes ikke, eller det hører til en gruppe du ikke har
        tilgang til.
      </Notice>
    )
  }

  const { event, totals, partOf, exposure } = detail
  const isSeries = detail.instances.length > 0
  const noTicketLink = !event.hasTicketLink && totals.ticketClicks === 0
  const noFacebookLink = !event.hasFacebookLink && totals.facebookClicks === 0
  const today = getOsloDateString()
  const campaignNote = exposure.campaigns?.length
    ? " Skraverte felt er fremhevingskampanjer, merket med hvor lenge de varte."
    : ""
  const campaignHighlights = (exposure.campaigns ?? []).map(campaign => ({
    from: campaign.from,
    until: campaign.until ?? today,
    label: campaignDuration(campaign, today),
  }))
  const selected =
    exposure.selectedCampaign === null
      ? null
      : exposure.campaigns?.[exposure.selectedCampaign]

  return (
    <div className="flex w-full flex-col gap-16 pb-12 sm:gap-20">
      <div className="flex flex-col gap-8 pt-4 sm:pt-8">
        <BackLink period={period} />
        <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {event.imageUrl && (
              <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-base bg-secondary-50 sm:w-72">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 288px"
                  src={sanityImageUrl(event.imageUrl, {
                    width: 576,
                    height: 360,
                  })}
                  unoptimized={shouldLoadImageDirectly(event.imageUrl)}
                />
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-4">
              <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-foreground-muted">
                <StatusTags event={event} expired={isExpired(event, today)} />
                {isSeries && (
                  <span className="font-mono text-[0.8rem]">
                    Serie · {detail.instances.length}{" "}
                    {detail.instances.length === 1 ? "dato" : "datoer"}
                  </span>
                )}
                {event.organizerName && <span>{event.organizerName}</span>}
                {event.firstDate && (
                  <span className="font-mono text-[0.8rem]">
                    {formatDateRange(event.firstDate, event.lastDate)}
                  </span>
                )}
              </p>
              <h1
                className={cn(
                  displayHeading,
                  "text-4xl wrap-break-word sm:text-5xl lg:text-6xl",
                )}
              >
                {event.title}
              </h1>
              <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link
                  href={`/arrangementer/${event.slug}`}
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  Se arrangementssiden
                  <ArrowUpRight aria-hidden className="size-3.5" />
                </Link>
                {partOf && (
                  <Link
                    href={`/arrangementer/statistikk/${partOf.slug}?periode=${period}`}
                    className={cn(
                      "inline-flex items-center gap-1 underline-offset-4 hover:underline",
                      accentText,
                    )}
                  >
                    Hele serien: {partOf.title}
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </Link>
                )}
              </p>
            </div>
          </div>
          <PeriodNav
            basePath={`/arrangementer/statistikk/${event.slug}`}
            period={period}
          />
        </header>
      </div>

      {totals.views === 0 && totals.ticketClicks === 0 ? (
        <EmptyState>
          Ingen har besøkt arrangementet de siste {period} dagene.
        </EmptyState>
      ) : (
        <>
          <KpiGrid>
            <Kpi
              caption="Ganger arrangementssiden ble åpnet."
              featured
              label="Visninger"
              value={totals.views}
            />
            <Kpi
              caption="Ulike personer som åpnet siden."
              label="Unike besøkende"
              value={totals.visitors}
            />
            <Kpi
              caption="Klikk på billettknappen videre til billettsalget."
              label="Billettklikk"
              text={noTicketLink ? "N/A" : count(totals.ticketClicks)}
            />
            <Kpi
              caption="Billettklikk delt på unike besøkende."
              label="Billettklikk per besøkende"
              text={
                noTicketLink
                  ? "N/A"
                  : clickRate(totals.ticketClicks, totals.visitors)
              }
            />
            <Kpi
              caption="Klikk på lenken til Facebook-arrangementet."
              label="Facebook-klikk"
              text={noFacebookLink ? "N/A" : count(totals.facebookClicks)}
            />
            <Kpi
              caption="Hvor lenge et typisk besøk ble på siden."
              label="Tid på siden (median)"
              text={formatDuration(totals.medianSeconds)}
            />
          </KpiGrid>

          <Section id="over-tid" title="Over tid">
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel
                caption={`Visninger og unike besøkende på siden hver dag.${campaignNote}`}
                title="Besøk per dag"
              >
                <DailyTrendChart
                  key={`views-${period}`}
                  label={`Visninger og unike besøkende per dag de siste ${period} dagene`}
                  days={detail.daily.map(point => point.day)}
                  highlights={campaignHighlights}
                  series={[
                    {
                      name: "Visninger",
                      values: detail.daily.map(point => point.views),
                    },
                    {
                      name: "Unike besøkende",
                      values: detail.daily.map(point => point.visitors),
                    },
                  ]}
                />
              </Panel>
              <Panel
                caption={`Klikk på billettknappen og Facebook-lenken hver dag.${campaignNote}`}
                title="Klikk per dag"
              >
                <DailyTrendChart
                  key={`clicks-${period}`}
                  label={`Billett- og Facebook-klikk per dag de siste ${period} dagene`}
                  days={detail.dailyClicks.map(point => point.day)}
                  highlights={campaignHighlights}
                  series={[
                    {
                      name: "Billettklikk",
                      values: detail.dailyClicks.map(point => point.ticket),
                    },
                    {
                      name: "Facebook-klikk",
                      values: detail.dailyClicks.map(point => point.facebook),
                    },
                  ]}
                />
              </Panel>
            </div>
          </Section>

          <Section id="hvor-fra" title="Hvor de kom fra">
            <div className="grid gap-6 lg:grid-cols-3">
              <BreakdownPanel
                caption="Hvordan besøkende kom til nettsiden."
                items={detail.channels}
                title="Kanaler"
              />
              <BreakdownPanel
                caption="Nettsteder som sendte besøkende hit."
                items={detail.sites}
                title="Nettsteder"
              />
              <BreakdownPanel
                caption="Visninger fordelt på type enhet."
                items={detail.devices}
                title="Enheter"
              />
            </div>
          </Section>

          <Section id="synlighet" title="Synlighet på nettsiden">
            <FremhevetDefinition />
            {exposure.campaigns && (
              <CampaignNav
                basePath={`/arrangementer/statistikk/${event.slug}`}
                exposure={exposure}
                period={period}
                today={today}
              />
            )}
            <KpiGrid>
              <Kpi
                caption="Besøk der arrangementet var blant de tre fremhevede øverst på forsiden."
                featured
                label="Sett som fremhevet"
                value={exposure.highlightedImpressions}
              />
              <Kpi
                caption="Klikk på arrangementet blant de tre fremhevede."
                label="Klikk som fremhevet"
                value={exposure.highlightedClicks}
              />
              <Kpi
                caption="Klikk delt på besøk som så det fremhevet."
                label="Klikkrate som fremhevet"
                text={clickThroughRate(
                  exposure.highlightedClicks,
                  exposure.highlightedImpressions,
                )}
              />
              <Kpi
                caption="Klikk fra listen «Arrangementer» lenger ned på forsiden."
                label="Klikk fra Arrangementer på forsiden"
                value={exposure.upcomingClicks}
              />
              <Kpi
                caption={
                  selected
                    ? selected.until
                      ? "Dager kampanjen varte."
                      : "Dager kampanjen har vart så langt."
                    : exposure.campaigns
                      ? "Dager i perioden arrangementet var fremhevet."
                      : "Dager arrangementet ble vist fremhevet."
                }
                label="Dager i fremhevingskampanje"
                value={exposure.promotedDays}
              />
              <Kpi
                caption={
                  selected
                    ? "Snitt per dag i kampanjen, mot like mange dager rett før."
                    : exposure.campaigns
                      ? "Snitt per dag som fremhevet, mot andre dager den var ute."
                      : "Snitt per dag som fremhevet, mot andre dager, fra 6. oktober."
                }
                label="Visninger per dag"
                text={`${formatAverage(exposure.viewsPerPromotedDay)} mot ${formatAverage(exposure.viewsPerOtherDay)}`}
              />
            </KpiGrid>
            {exposure.placements.length > 0 ? (
              <Panel
                caption="Besøk der arrangementet ble vist fremhevet, etter hvor på nettsiden."
                title={
                  <Tooltip content="aka: haldningskampanje">
                    <span className="cursor-help">Fremhevingskampanje</span>
                  </Tooltip>
                }
              >
                <TopListChart
                  items={exposure.placements.map(placement => ({
                    name: placement.name,
                    value: placement.impressions,
                  }))}
                  label="Visninger i fremhevingskampanjen etter sted"
                  valueName="Sett"
                />
              </Panel>
            ) : (
              <EmptyState>
                {selected?.until && selected.until < PLACEMENT_TRACKING_START
                  ? "Kampanjen var før vi begynte å måle visninger på forsiden 6. oktober 2026."
                  : selected
                    ? "Arrangementet ble ikke vist fremhevet i denne kampanjen. Dette måles fra 6. oktober 2026."
                    : "Arrangementet har ikke vært i noen fremhevingskampanje i perioden. Dette måles fra 6. oktober 2026."}
              </EmptyState>
            )}
            {exposure.reach.length > 0 && (
              <Panel
                caption="Personer som så arrangementet fremhevet hver dag, og hvor mange av dem som så det for første gang. Når nye personer faller mot null, når kampanjen stort sett de samme folkene igjen."
                title="Nye personer nådd"
              >
                <DailyTrendChart
                  key={`reach-${period}-${exposure.selectedCampaign}`}
                  label="Personer som så arrangementet fremhevet per dag, og hvor mange som så det for første gang"
                  days={exposure.reach.map(point => point.day)}
                  series={[
                    {
                      name: "Første gang",
                      values: exposure.reach.map(point => point.firstTime),
                    },
                    {
                      name: "Alle som så det",
                      values: exposure.reach.map(point => point.people),
                    },
                  ]}
                />
              </Panel>
            )}
          </Section>

          <Section id="hvor-pa-nettsiden" title="Hvor på nettsiden">
            <Table className="min-w-[44rem]">
              <caption className="sr-only">
                Sett, klikk og besøk per sted på nettsiden
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Sted</TableHead>
                  <TableHead numeric>Sett</TableHead>
                  <TableHead numeric>Klikk</TableHead>
                  <TableHead numeric>Klikkrate</TableHead>
                  <TableHead numeric>Sidevisninger</TableHead>
                  <TableHead numeric>Billettklikk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposure.surfaces.map(surface => (
                  <TableRow key={surface.name}>
                    <TableCell className="font-heading">
                      {surface.name}
                    </TableCell>
                    <TableCell numeric>
                      {surface.seen === null ? "–" : count(surface.seen)}
                    </TableCell>
                    <TableCell numeric>
                      {surface.clicks === null ? "–" : count(surface.clicks)}
                    </TableCell>
                    <TableCell numeric>
                      {surface.seen === null || surface.clicks === null
                        ? "–"
                        : clickThroughRate(surface.clicks, surface.seen)}
                    </TableCell>
                    <TableCell numeric>{count(surface.views)}</TableCell>
                    <TableCell numeric>{count(surface.ticketClicks)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="max-w-3xl text-sm leading-6 text-foreground-muted">
              Sett: sidevisninger der arrangementet var synlig. Sidevisninger og
              billettklikk telles på stedet besøkeren klikket seg inn fra.
            </p>
          </Section>

          <Section id="nar" title="Når folk så arrangementet">
            <Panel
              caption="Visninger etter hvor mange dager før arrangementet de skjedde, de siste 180 dagene."
              title="Dager før arrangementet"
            >
              <TopListChart
                items={detail.leadTime}
                label="Visninger etter dager før arrangementet"
                valueName="Visninger"
              />
            </Panel>
          </Section>
        </>
      )}

      {isSeries && (
        <Section id="datoer" title="Datoer i serien">
          <Table className="min-w-[44rem]">
            <caption className="sr-only">Statistikk per dato i serien</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Dato</TableHead>
                <TableHead numeric>Visninger</TableHead>
                <TableHead numeric>Besøkende</TableHead>
                <TableHead numeric>Billettklikk</TableHead>
                <TableHead numeric>Facebook</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.instances.map(instance => (
                <TableRow
                  key={instance.id}
                  className={cn(
                    (isExpired(instance, today) || instance.isCancelled) &&
                      "text-foreground-muted",
                  )}
                >
                  <TableCell>
                    <Link
                      href={`/arrangementer/statistikk/${instance.slug}?periode=${period}`}
                      className="font-mono text-[0.95rem] underline-offset-4 hover:underline"
                    >
                      {instance.firstDate
                        ? formatDateRange(instance.firstDate, instance.lastDate)
                        : instance.title}
                    </Link>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 text-sm text-foreground-muted">
                      <StatusTags
                        event={instance}
                        expired={isExpired(instance, today)}
                      />
                    </span>
                  </TableCell>
                  <TableCell numeric>{count(instance.views)}</TableCell>
                  <TableCell numeric>{count(instance.visitors)}</TableCell>
                  <TableCell numeric>
                    {instance.hasTicketLink || instance.ticketClicks > 0
                      ? count(instance.ticketClicks)
                      : "N/A"}
                  </TableCell>
                  <TableCell numeric>
                    {instance.hasFacebookLink || instance.facebookClicks > 0
                      ? count(instance.facebookClicks)
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}
    </div>
  )
}

/** Campaign chips; choosing one limits the visibility sections to it. */
function CampaignNav({
  basePath,
  exposure,
  period,
  today,
}: {
  basePath: string
  exposure: EventDetail["exposure"]
  period: number
  today: string
}) {
  const campaigns = exposure.campaigns ?? []
  if (campaigns.length === 0) {
    return (
      <p className="-mt-2 text-foreground-muted">
        Har ikke vært promotert på forsiden.
      </p>
    )
  }
  const chip = (selected: boolean) =>
    cn(
      selectionControlVariants({ selected, size: "default" }),
      "gap-2 rounded-full px-5",
    )
  return (
    <nav
      aria-label="Vis synlighet for"
      className="-mt-2 flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-foreground-muted">Vis</span>
        <Link
          aria-current={exposure.selectedCampaign === null ? "page" : undefined}
          className={chip(exposure.selectedCampaign === null)}
          href={`${basePath}?periode=${period}#synlighet`}
          scroll={false}
        >
          Siste {period} dager
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-foreground-muted">
          eller en fremhevingskampanje
        </span>
        {campaigns.map((campaign, index) => {
          const isSelected = exposure.selectedCampaign === index
          const status =
            campaign.until !== null
              ? null
              : exposure.shownNow === false
                ? "i kø"
                : "vises nå"
          return (
            <Link
              aria-current={isSelected ? "page" : undefined}
              className={chip(isSelected)}
              href={`${basePath}?periode=${period}&kampanje=${index + 1}#synlighet`}
              key={campaign.from}
              scroll={false}
            >
              <span>
                {formatDateRange(campaign.from, campaign.until ?? today)}
              </span>
              <span className="font-sans text-sm font-normal text-foreground-muted">
                {campaignDuration(campaign, today)}
                {status && (
                  <span className={cn(status === "vises nå" && accentText)}>
                    {" "}
                    · {status}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function BackLink({ period }: { period: number }) {
  return (
    <Link
      href={`/arrangementer/statistikk?periode=${period}`}
      className="inline-flex w-fit items-center gap-2 text-sm text-foreground-muted underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Alle arrangementer
    </Link>
  )
}

function BreakdownPanel({
  title,
  caption,
  items,
}: {
  title: string
  caption: string
  items: { name: string; value: number }[]
}): ReactNode {
  return (
    <Panel caption={caption} title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">Ingen data ennå.</p>
      ) : (
        <TopListChart
          label={`${title}: visninger`}
          valueName="Visninger"
          items={items}
        />
      )}
    </Panel>
  )
}
