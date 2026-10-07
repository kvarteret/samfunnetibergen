"use client"

import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  type PaginationState,
  rowPaginationFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_text,
  tableFeatures,
  type Updater,
  useTable,
} from "@tanstack/react-table"
import { Search } from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"

import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import {
  ariaSort,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
} from "@/components/ui/table"
import { Tooltip } from "@/components/ui/tooltip"
import { EventFiltersControl } from "@/features/events/components/EventsPageFilters"
import {
  buildTaxonomyFromEvents,
  type EventFilters,
  filterEvents,
  parseEventFilters,
  serializeEventFilters,
} from "@/features/events/domain/eventUtils"
import { Link } from "@/i18n/navigation"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"
import {
  aggregateSeries,
  EVENT_STATUS_FILTERS,
  EVENTS_PER_PAGE,
  type EventStatistic,
  type EventStatusFilter,
  FREMHEVET_DEFINITION,
  formatDateRange,
  formatDuration,
  isExpired,
  matchesSearch,
  matchesStatus,
  parseSortParam,
  parseStatusFilter,
  periodStart,
  type SortParam,
  serializeSortParam,
  viewsPerLiveDay,
} from "../domain/statistics"
import { Sparkline } from "./Sparkline"

const numberFormatter = new Intl.NumberFormat("nb-NO")

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { text: sortFn_text },
})
const column = createColumnHelper<typeof features, EventStatistic>()
const NUMERIC = new Set([
  "visninger",
  "per-dag",
  "besokende",
  "okter",
  "billettklikk",
  "facebook",
  "tid",
])
const count = (value: number) => numberFormatter.format(value)
const perDay = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 })

/** "N/A" when the event has no such link to click. */
function countOrMissing(value: number | undefined) {
  return value === undefined ? (
    <span className="text-foreground-muted/70">N/A</span>
  ) : (
    count(value)
  )
}

type TableState = {
  search: string
  separateSeries: boolean
  filters: EventFilters
  status: EventStatusFilter
  sort: SortParam
  page: number
}

/** Table state lives in the URL so a filtered view can be shared or reloaded. */
function useTableState(): [TableState, (next: Partial<TableState>) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo<TableState>(
    () => ({
      search: searchParams.get("sok") ?? "",
      separateSeries: searchParams.get("serier") === "separat",
      filters: parseEventFilters(Object.fromEntries(searchParams.entries())),
      status: parseStatusFilter(searchParams.get("status")),
      sort: parseSortParam(searchParams.get("sorter")),
      page: Math.max(1, Number(searchParams.get("side")) || 1),
    }),
    [searchParams],
  )

  const update = useCallback(
    (next: Partial<TableState>) => {
      const merged = { ...state, page: 1, ...next }
      const params = new URLSearchParams(serializeEventFilters(merged.filters))
      const periode = searchParams.get("periode")
      if (periode) params.set("periode", periode)
      if (merged.status !== "alle") params.set("status", merged.status)
      if (merged.separateSeries) params.set("serier", "separat")
      if (merged.search.trim()) params.set("sok", merged.search.trim())
      const sort = serializeSortParam(merged.sort)
      if (sort) params.set("sorter", sort)
      if (merged.page > 1) params.set("side", String(merged.page))
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams, state],
  )

  return [state, update]
}

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(current)
    : updater
}

export function EventStatisticsTable({
  events,
  today,
  period,
}: {
  events: EventStatistic[]
  today: string
  period: number
}) {
  const start = periodStart(today, period)
  const [state, update] = useTableState()
  const taxonomy = useMemo(() => buildTaxonomyFromEvents(events), [events])
  const rows = useMemo(
    () => (state.separateSeries ? events : aggregateSeries(events)),
    [events, state.separateSeries],
  )

  // The box updates instantly; the URL follows once typing pauses.
  const [search, setSearch] = useState(state.search)
  const deferredSearch = useDeferredValue(search)
  useEffect(() => {
    if (search.trim() === state.search.trim()) return
    const timer = setTimeout(() => update({ search }), 300)
    return () => clearTimeout(timer)
  }, [search, state.search, update])

  const taxonomyFiltered = useMemo(
    () =>
      filterEvents(rows, state.filters).filter(event =>
        matchesSearch(event, deferredSearch),
      ),
    [rows, state.filters, deferredSearch],
  )
  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        EVENT_STATUS_FILTERS.map(option => [
          option.value,
          taxonomyFiltered.filter(event =>
            matchesStatus(event, option.value, today),
          ).length,
        ]),
      ) as Record<EventStatusFilter, number>,
    [taxonomyFiltered, today],
  )
  const data = useMemo(
    () =>
      taxonomyFiltered.filter(event =>
        matchesStatus(event, state.status, today),
      ),
    [taxonomyFiltered, state.status, today],
  )

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("title", {
          id: "tittel",
          header: "Arrangement",
          sortFn: "text",
          cell: ({ row }) => <EventCell event={row.original} today={today} />,
        }),
        column.accessor(row => row.firstDate ?? undefined, {
          id: "dato",
          header: "Dato",
          sortFn: "text",
          sortDescFirst: true,
          sortUndefined: "last",
          cell: ({ row }) =>
            row.original.firstDate
              ? formatDateRange(row.original.firstDate, row.original.lastDate)
              : "–",
        }),
        column.display({
          id: "trend",
          header: "Siste dager",
          enableSorting: false,
          cell: ({ row }) => (
            <Sparkline
              height={28}
              label={row.original.title}
              values={row.original.daily}
              width={96}
            />
          ),
        }),
        column.accessor("views", {
          id: "visninger",
          header: "Visninger",
          sortDescFirst: true,
          cell: info => count(info.getValue()),
        }),
        column.accessor(row => viewsPerLiveDay(row, start, today), {
          id: "per-dag",
          header: "Per dag",
          sortDescFirst: true,
          cell: info => perDay.format(info.getValue()),
        }),
        column.accessor("visitors", {
          id: "besokende",
          header: "Besøkende",
          sortDescFirst: true,
          cell: info => count(info.getValue()),
        }),
        column.accessor("sessions", {
          id: "okter",
          header: "Økter",
          sortDescFirst: true,
          cell: info => count(info.getValue()),
        }),
        column.accessor(
          row =>
            row.hasTicketLink || row.ticketClicks > 0
              ? row.ticketClicks
              : undefined,
          {
            id: "billettklikk",
            header: "Billettklikk",
            sortDescFirst: true,
            sortUndefined: "last",
            cell: info => countOrMissing(info.getValue()),
          },
        ),
        column.accessor(
          row =>
            row.hasFacebookLink || row.facebookClicks > 0
              ? row.facebookClicks
              : undefined,
          {
            id: "facebook",
            header: "Facebook",
            sortDescFirst: true,
            sortUndefined: "last",
            cell: info => countOrMissing(info.getValue()),
          },
        ),
        column.accessor(row => row.medianSeconds ?? undefined, {
          id: "tid",
          header: "Tid (median)",
          sortDescFirst: true,
          sortUndefined: "last",
          cell: info => formatDuration(info.getValue() ?? null),
        }),
      ]),
    [today, start],
  )

  const sorting: SortingState = [{ id: state.sort.id, desc: state.sort.desc }]
  const pagination: PaginationState = {
    pageIndex: state.page - 1,
    pageSize: EVENTS_PER_PAGE,
  }
  const table = useTable({
    features,
    columns,
    data,
    getRowId: row => row.id,
    state: { sorting, pagination },
    enableSortingRemoval: false,
    enableMultiSort: false,
    autoResetPageIndex: false,
    onSortingChange: updater => {
      const [next] = resolve(updater, sorting)
      if (next)
        update({ sort: parseSortParam(next.desc ? next.id : `-${next.id}`) })
    },
    onPaginationChange: updater =>
      update({ page: resolve(updater, pagination).pageIndex + 1 }),
  })

  const pageCount = table.getPageCount()
  const headers = table.getHeaderGroups()[0].headers

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-xl">
        <label className="sr-only" htmlFor="statistikk-sok">
          Søk etter arrangement eller arrangør
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted"
        />
        <Input
          className="h-12 rounded-full border border-border pr-4 pl-11"
          id="statistikk-sok"
          onChange={event => setSearch(event.target.value)}
          placeholder="Søk etter arrangement eller arrangør"
          type="search"
          value={search}
        />
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <EventFiltersControl
            filters={state.filters}
            resultCount={data.length}
            setFilters={filters => update({ filters })}
            taxonomy={taxonomy}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <span className="font-heading leading-snug" id="statistikk-serier">
              Ønsker du å gruppere visninger på gjentakende arrangementer?
            </span>
            <SegmentedControl
              aria-labelledby="statistikk-serier"
              onValueChange={value =>
                update({ separateSeries: value === "nei" })
              }
              options={[
                { value: "ja", label: "Ja takk" },
                { value: "nei", label: "Nei." },
              ]}
              value={state.separateSeries ? "nei" : "ja"}
              variant="fill"
            />
          </div>
          <SelectField
            className="min-w-48 rounded-full border border-border px-4"
            id="statistikk-status"
            label="Status"
            onChange={value => update({ status: parseStatusFilter(value) })}
            options={EVENT_STATUS_FILTERS.map(option => ({
              value: option.value,
              label: `${option.label} (${statusCounts[option.value]})`,
            }))}
            value={state.status}
          />
        </div>
      </div>

      {data.length === 0 ? (
        <p className="rounded-base bg-secondary-50 px-6 py-12 text-center text-lg text-foreground-muted">
          Ingen arrangementer passer filtrene.
        </p>
      ) : (
        <Table className="min-w-[66rem]">
          <caption className="sr-only">Statistikk per arrangement</caption>
          <TableHeader>
            <TableRow>
              {headers.map(header => {
                const direction = header.column.getIsSorted()
                const numeric = NUMERIC.has(header.column.id)
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={ariaSort(direction)}
                    numeric={numeric}
                  >
                    {header.column.getCanSort() ? (
                      <TableSortButton
                        direction={direction}
                        numeric={numeric}
                        onToggle={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                      </TableSortButton>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className={cn(
                  (isExpired(row.original, today) ||
                    row.original.isCancelled) &&
                    "text-foreground-muted",
                )}
              >
                {row.getAllCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    numeric={NUMERIC.has(cell.column.id)}
                    className={cn(
                      cell.column.id === "tittel" && "py-3 pl-4 sm:pl-5",
                      cell.column.id === "dato" &&
                        "font-mono text-[0.85rem] whitespace-nowrap text-foreground-muted",
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        page={Math.min(state.page, Math.max(1, pageCount))}
        pageCount={pageCount}
        pageSize={EVENTS_PER_PAGE}
        total={data.length}
        onPage={next => table.setPageIndex(next - 1)}
      />
    </div>
  )
}

function EventCell({ event, today }: { event: EventStatistic; today: string }) {
  const expired = isExpired(event, today)
  return (
    <div className="flex items-center gap-4">
      <EventThumbnail
        dimmed={expired || event.isCancelled}
        src={event.imageUrl}
        title={event.title}
      />
      <div className="min-w-0">
        <Link
          href={`/arrangementer/statistikk/${event.slug}`}
          className="text-lg leading-snug [font-family:var(--font-display)] font-heading tracking-[-0.02em] underline-offset-4 hover:underline"
        >
          {event.title}
        </Link>
        <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-foreground-muted">
          <StatusTags event={event} expired={expired} />
          {event.series?.id === event.id && (
            <span className="font-mono text-[0.8rem]">
              Serie · {event.instanceCount}{" "}
              {event.instanceCount === 1 ? "dato" : "datoer"}
            </span>
          )}
          {event.organizerName && <span>{event.organizerName}</span>}
        </span>
      </div>
    </div>
  )
}

/* A warm leaf green that sits with HS red and orange (3.5:1 on cream). */
const UPCOMING_GREEN = "bg-[#3b9555]"

function EventThumbnail({
  src,
  title,
  dimmed,
}: {
  src: string | null
  title: string
  dimmed: boolean
}) {
  return (
    <div
      className={cn(
        "relative aspect-16/10 w-20 shrink-0 overflow-hidden rounded-base bg-secondary-50",
        dimmed && "opacity-60 grayscale-[35%]",
      )}
    >
      {src ? (
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="80px"
          src={sanityImageUrl(src, { width: 160, height: 100 })}
          unoptimized={shouldLoadImageDirectly(src)}
        />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center [font-family:var(--font-display)] font-heading text-lg text-secondary-700"
        >
          {title.trim().charAt(0)}
        </span>
      )}
    </div>
  )
}

function StatusLabel({ tone, children }: { tone: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground">
      <span aria-hidden className={cn("size-2 rounded-full", tone)} />
      {children}
    </span>
  )
}

export function StatusTags({
  event,
  expired,
}: {
  event: Pick<EventStatistic, "isCancelled" | "isSoldOut" | "isPromoted">
  expired: boolean
}) {
  return (
    <>
      {event.isCancelled ? (
        <StatusLabel tone="bg-destructive">Avlyst</StatusLabel>
      ) : expired ? (
        <StatusLabel tone="bg-foreground/25">Utløpt</StatusLabel>
      ) : (
        <StatusLabel tone={UPCOMING_GREEN}>Kommende</StatusLabel>
      )}
      {event.isSoldOut && <StatusLabel tone="bg-primary">Utsolgt</StatusLabel>}
      {event.isPromoted && (
        <Tooltip content={FREMHEVET_DEFINITION}>
          <span className="cursor-help">
            <StatusLabel tone="bg-secondary">Fremhevet</StatusLabel>
          </span>
        </Tooltip>
      )}
    </>
  )
}
