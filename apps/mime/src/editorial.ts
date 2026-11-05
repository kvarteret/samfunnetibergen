// Editorial changes as complete, ready-made plans. The model says *what* it
// wants (merge these three into a series, we are closed on Friday); code
// reads the documents, works out every operation in the right order, and
// stores the plan. Nothing changes until the person who asked approves it,
// exactly as for propose_write_plan.
//
// Sanity MCP semantics the plans rely on: patch_documents and
// create_documents write drafts; publish_documents makes a draft live;
// unpublish_documents turns a published document back into a draft (refused
// while other documents reference it); discard_drafts removes drafts.

import { tool } from "ai"
import { z } from "zod"
import { type SanityScope, sanityQuery } from "./events"
import type { Plan, WriteOp } from "./writes"

type Fetch = typeof fetch

export type DateEntry = {
  _key?: string
  _type?: string
  startDate: string
  startTime?: string
  endTime?: string
  isSoldOut?: boolean
}

export type EventDoc = {
  _id: string
  _type: string
  eventKind?: string
  parentEvent?: { _ref: string }
  dates?: DateEntry[]
  localizedTitle?: { _key?: string; language: string; value?: string }[]
  slug?: { current?: string }
  ticketUrl?: string
  sourceTicketUrls?: string[]
  approvalStatus?: string
  [field: string]: unknown
}

export type Loaded = {
  id: string
  doc: EventDoc
  published: boolean
  hasDraft: boolean
  /** Documents outside the plan that reference this one. */
  referencedBy: number
}

const CHILD_FOR: Record<string, string> = {
  series: "seriesInstance",
  festival: "festivalSession",
}
const PARENT_FOR: Record<string, string> = {
  series: "seriesParent",
  festival: "festivalParent",
}

// Shared fields a new series or festival takes from the event it is built on.
const PARENT_FIELDS = [
  "localizedTitle",
  "localizedDescription",
  "image",
  "room",
  "localizedRoomText",
  "organizerGroup",
  "coOrganizerGroups",
  "localizedOrganizerText",
  "eventType",
  "isFree",
  "priceOrdinar",
  "priceStudent",
  "priceMedlem",
  "ticketUrl",
  "facebookUrl",
  "isInternalEvent",
  "approvalStatus",
]

const newKey = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12)

const clean = (id: string) => id.replace(/^drafts\./, "")

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export function titleOf(doc: EventDoc, language = "nb") {
  return (
    doc.localizedTitle?.find(entry => entry.language === language)?.value ?? ""
  ).trim()
}

const slot = (date: DateEntry) => `${date.startDate} ${date.startTime ?? ""}`

/** All dates, sorted, one per start date and time; existing keys are kept. */
export function mergeDates(lists: (DateEntry[] | undefined)[]) {
  const seen = new Map<string, DateEntry>()
  for (const list of lists)
    for (const date of list ?? [])
      if (date?.startDate && !seen.has(slot(date)))
        seen.set(slot(date), {
          ...date,
          _type: "arrangementDate",
          _key: date._key ?? newKey(),
        })
  return [...seen.values()].sort((a, b) => slot(a).localeCompare(slot(b)))
}

const LOAD_QUERY = `{
  "published": *[_id in $ids]{..., "referencedBy": count(*[references(^._id) && !(string::split(_id, "drafts.")[-1] in $ids)])},
  "drafts": *[_id in $draftIds]
}`

export async function loadDocuments(
  scope: SanityScope,
  ids: string[],
  fetchFn?: Fetch,
): Promise<Loaded[]> {
  const clean_ = [...new Set(ids.map(clean))]
  const result = await sanityQuery<{
    published: (EventDoc & { referencedBy: number })[]
    drafts: EventDoc[]
  }>(
    scope,
    LOAD_QUERY,
    { ids: clean_, draftIds: clean_.map(id => `drafts.${id}`) },
    fetchFn,
  )
  return clean_.map(id => {
    const published = result.published.find(doc => doc._id === id)
    const draft = result.drafts.find(doc => doc._id === `drafts.${id}`)
    const doc = draft ?? published
    if (!doc) throw new Error(`Fant ikke dokumentet ${id}.`)
    return {
      id,
      doc: { ...doc, _id: id },
      published: Boolean(published),
      hasDraft: Boolean(draft),
      referencedBy: published?.referencedBy ?? 0,
    }
  })
}

const patchOp = (
  documents: Record<string, { patches: Record<string, unknown>[] }>,
  label: string,
): WriteOp[] => {
  const entries = Object.entries(documents)
  const ops: WriteOp[] = []
  for (let index = 0; index < entries.length; index += 25)
    ops.push({
      tool: "patch_documents",
      input: {
        documents: Object.fromEntries(entries.slice(index, index + 25)),
      },
      label,
    })
  return ops
}

const publishOp = (ids: string[], label: string): WriteOp => ({
  tool: "publish_documents",
  input: { ids: ids.map(id => ({ id })) },
  label,
})

function removeOps(events: Loaded[]): WriteOp[] {
  const published = events.filter(event => event.published)
  const ops: WriteOp[] = []
  if (published.length)
    ops.push({
      tool: "unpublish_documents",
      input: { ids: published.map(event => event.id) },
      label: `Avpubliser ${events.length === 1 ? "duplikatet" : `${events.length} duplikater`}`,
    })
  ops.push({
    tool: "discard_drafts",
    input: { ids: events.map(event => event.id) },
    label: "Fjern duplikatene helt (forkast utkastene)",
  })
  return ops
}

export type PlanDraft = {
  summary: string
  ops: WriteOp[]
  warnings: string[]
}

function draftWarnings(events: Loaded[]) {
  return events
    .filter(event => event.hasDraft && event.published)
    .map(
      event =>
        `«${titleOf(event.doc) || event.id}» har et upublisert utkast; publiseringen tar med endringene i utkastet.`,
    )
}

/** Several events become one event with all their dates. */
export function mergeIntoSingle(
  events: Loaded[],
  keepId: string,
  options: { titleNb?: string; titleEn?: string } = {},
): PlanDraft {
  const keep = events.find(event => event.id === keepId)
  if (!keep) throw new Error("keep_id må være ett av arrangementene.")
  const others = events.filter(event => event !== keep)
  if (!others.length) throw new Error("Trenger minst to arrangementer.")
  for (const event of events)
    if (["seriesParent", "festivalParent"].includes(event.doc.eventKind ?? ""))
      throw new Error(
        `«${titleOf(event.doc) || event.id}» er en serie eller festival; bruk into "series"/"festival" eller plan_detach_events.`,
      )
  const blocked = others.filter(event => event.referencedBy > 0)
  if (blocked.length)
    throw new Error(
      `Andre dokumenter peker på ${blocked.map(e => e.id).join(", ")}; de kan ikke fjernes.`,
    )
  const dates = mergeDates(events.map(event => event.doc.dates))
  const tickets = [
    ...new Set(
      events
        .flatMap(event => [
          event.doc.ticketUrl,
          ...(event.doc.sourceTicketUrls ?? []),
        ])
        .filter((url): url is string => Boolean(url))
        .filter(url => url !== keep.doc.ticketUrl),
    ),
  ]
  const set: Record<string, unknown> = {
    dates,
    eventKind: "single",
    ...(tickets.length ? { sourceTicketUrls: tickets } : {}),
    ...titleSet(keep.doc, options),
  }
  const title = options.titleNb || titleOf(keep.doc) || keep.id
  return {
    summary: `Slår sammen ${events.length} arrangementer til «${title}» med ${dates.length} datoer, og fjerner ${others.length} duplikat${others.length === 1 ? "" : "er"}.`,
    ops: [
      ...patchOp(
        {
          [keep.id]: {
            patches: [
              { set },
              ...(keep.doc.parentEvent ? [{ unset: ["parentEvent"] }] : []),
            ],
          },
        },
        `Samle ${dates.length} datoer${tickets.length ? ` og ${tickets.length} billettlenker` : ""} i «${title}»`,
      ),
      publishOp([keep.id], `Publiser «${title}»`),
      ...removeOps(others),
    ],
    warnings: draftWarnings([keep]),
  }
}

function titleSet(
  doc: EventDoc,
  options: { titleNb?: string; titleEn?: string },
): Record<string, unknown> {
  if (!options.titleNb && !options.titleEn) return {}
  const current = doc.localizedTitle ?? []
  const entry = (language: string, value?: string) => {
    const existing = current.find(item => item.language === language)
    const text = value ?? existing?.value
    return text
      ? {
          _key: existing?._key ?? language,
          _type: "internationalizedArrayStringValue",
          language,
          value: text,
        }
      : undefined
  }
  return {
    localizedTitle: [
      entry("nb", options.titleNb),
      entry("en", options.titleEn),
    ].filter(Boolean),
  }
}

/** Child patches (and new children for extra dates) under `parentId`. */
function childOps(
  events: Loaded[],
  kind: "series" | "festival",
  parent: { id: string; slug: string; titleNb: string },
) {
  const childKind = CHILD_FOR[kind]
  const patches: Record<string, { patches: Record<string, unknown>[] }> = {}
  const created: Record<string, unknown>[] = []
  for (const event of events) {
    const dates = mergeDates([event.doc.dates])
    if (!dates.length)
      throw new Error(`«${titleOf(event.doc) || event.id}» har ingen dato.`)
    const [first, ...rest] = dates
    // A child that has the parent's title inherits it instead.
    const sameTitle = titleOf(event.doc) === parent.titleNb
    patches[event.id] = {
      patches: [
        {
          set: {
            eventKind: childKind,
            parentEvent: { _type: "reference", _ref: parent.id },
            dates: [first],
          },
        },
        ...(sameTitle ? [{ unset: ["localizedTitle"] }] : []),
      ],
    }
    for (const date of rest) {
      const stamp = `${date.startDate}-${(date.startTime ?? "0000").replace(":", "")}`
      created.push({
        // Studio's convention: arrangement-<parent id>-<date>-<time>.
        _id: `${parent.id.startsWith("arrangement-") ? parent.id : `arrangement-${parent.id}`}-${stamp}`,
        eventKind: childKind,
        parentEvent: { _type: "reference", _ref: parent.id },
        dates: [{ ...date, _key: newKey() }],
        approvalStatus: event.doc.approvalStatus ?? "pending",
        eventStatus: "scheduled",
        ...(sameTitle || !event.doc.localizedTitle
          ? {}
          : { localizedTitle: event.doc.localizedTitle }),
        ...(event.doc.room ? { room: event.doc.room } : {}),
        ...(event.doc.ticketUrl ? { ticketUrl: event.doc.ticketUrl } : {}),
        slug: { _type: "slug", current: `${parent.slug}-${stamp}` },
        initialSlug: `${parent.slug}-${stamp}`,
      })
    }
  }
  return { patches, created }
}

/**
 * Several events become one series or festival: an existing parent among
 * them is reused, otherwise a new parent is made from `baseId`'s shared
 * fields. Every date becomes its own instance/session.
 */
export function mergeIntoParent(
  events: Loaded[],
  kind: "series" | "festival",
  options: {
    baseId?: string
    titleNb?: string
    titleEn?: string
    existingParent?: Loaded
    suffix?: string
  } = {},
): PlanDraft {
  const parentKind = PARENT_FOR[kind]
  const existing =
    options.existingParent ??
    events.find(event => event.doc.eventKind === parentKind)
  const children = events.filter(event => event !== existing)
  for (const event of children)
    if (["seriesParent", "festivalParent"].includes(event.doc.eventKind ?? ""))
      throw new Error(
        `«${titleOf(event.doc) || event.id}» er selv en serie eller festival.`,
      )
  if (!children.length && !options.titleNb)
    throw new Error("Ingen arrangementer å legge inn.")
  const base =
    events.find(event => event.id === options.baseId) ??
    children[0] ??
    undefined
  const ops: WriteOp[] = []
  let parentId: string
  let parentSlug: string
  let parentTitle: string
  if (existing) {
    parentId = existing.id
    parentTitle = titleOf(existing.doc) || existing.id
    parentSlug = existing.doc.slug?.current ?? slugify(parentTitle)
  } else {
    parentTitle =
      options.titleNb || (base ? titleOf(base.doc) : "") || "Uten tittel"
    const suffix = options.suffix ?? newKey().slice(0, 6)
    parentSlug = `${slugify(parentTitle)}-${suffix}`
    parentId = `arrangement-${kind}-${parentSlug}`
    const shared = Object.fromEntries(
      PARENT_FIELDS.filter(field => base?.doc[field] !== undefined).map(
        field => [field, base?.doc[field]],
      ),
    )
    const firstDate = mergeDates(children.map(event => event.doc.dates))[0]
    ops.push(
      {
        tool: "create_documents",
        input: {
          documents: [
            {
              type: "arrangement",
              content: {
                ...shared,
                ...titleSet(base?.doc ?? ({} as EventDoc), {
                  titleNb: options.titleNb ?? parentTitle,
                  titleEn: options.titleEn,
                }),
                _id: parentId,
                eventKind: parentKind,
                eventStatus: "scheduled",
                approvalStatus:
                  (shared.approvalStatus as string | undefined) ?? "pending",
                slug: { _type: "slug", current: parentSlug },
                initialSlug: parentSlug,
                // A series keeps its first date; a festival has none.
                ...(kind === "series" && firstDate
                  ? { dates: [{ ...firstDate, _key: newKey() }] }
                  : {}),
              },
            },
          ],
        },
        label: `Opprett ${kind === "series" ? "serien" : "festivalen"} «${parentTitle}»`,
      },
      // Children may only reference a published parent.
      publishOp(
        [parentId],
        `Publiser ${kind === "series" ? "serien" : "festivalen"}`,
      ),
    )
  }
  const { patches, created } = childOps(children, kind, {
    id: parentId,
    slug: parentSlug,
    titleNb: parentTitle,
  })
  const word = kind === "series" ? "seriedag" : "festivaldag"
  if (Object.keys(patches).length)
    ops.push(
      ...patchOp(
        patches,
        `Gjør ${children.length} arrangement${children.length === 1 ? "" : "er"} om til ${word}${children.length === 1 ? "" : "er"} under «${parentTitle}»`,
      ),
    )
  if (created.length)
    ops.push({
      tool: "create_documents",
      input: {
        documents: created.map(content => ({ type: "arrangement", content })),
      },
      label: `Opprett ${created.length} ${word}${created.length === 1 ? "" : "er"} for de andre datoene`,
    })
  const publish = [
    ...children.map(event => event.id),
    ...created.map(content => content._id as string),
  ]
  if (publish.length)
    ops.push(publishOp(publish, `Publiser ${publish.length} ${word}er`))
  const total = publish.length
  return {
    summary: existing
      ? `Legger ${children.length} arrangementer inn i ${kind === "series" ? "serien" : "festivalen"} «${parentTitle}» som ${total} ${word}er.`
      : `Lager ${kind === "series" ? "serien" : "festivalen"} «${parentTitle}» med ${total} ${word}er fra ${children.length} arrangementer.${kind === "festival" ? " Festivalen trenger beskrivelse på norsk og engelsk; sjekk den i Studio." : ""}`,
    ops,
    warnings: draftWarnings(children),
  }
}

/** Series instances or festival sessions become standalone events again. */
export function detachEvents(events: Loaded[], parents: Loaded[]): PlanDraft {
  const patches: Record<string, { patches: Record<string, unknown>[] }> = {}
  for (const event of events) {
    if (!event.doc.parentEvent)
      throw new Error(`«${titleOf(event.doc) || event.id}» har ingen serie.`)
    const parent = parents.find(p => p.id === event.doc.parentEvent?._ref)
    // Fill in what the event used to inherit, so it stands on its own.
    const inherited = Object.fromEntries(
      PARENT_FIELDS.filter(
        field =>
          event.doc[field] === undefined && parent?.doc[field] !== undefined,
      ).map(field => [field, parent?.doc[field]]),
    )
    patches[event.id] = {
      patches: [
        { set: { ...inherited, eventKind: "single" } },
        { unset: ["parentEvent"] },
      ],
    }
  }
  const ids = Object.keys(patches)
  return {
    summary: `Gjør ${ids.length} serie-/festivaldag${ids.length === 1 ? "" : "er"} om til frittstående arrangement${ids.length === 1 ? "" : "er"}, med tittel og felter fra serien der de mangler.`,
    ops: [
      ...patchOp(patches, `Løsne ${ids.length} fra serien/festivalen`),
      publishOp(
        ids,
        `Publiser ${ids.length} arrangement${ids.length === 1 ? "" : "er"}`,
      ),
    ],
    warnings: draftWarnings(events),
  }
}

type SiteMetadata = {
  _id: string
  houseClosedDates?: { _key: string; date: string; note?: string }[]
  hasDraft?: boolean
}

/** Whole days the house is closed (shown on the website), and vacation mode. */
export function houseHoursPlan(
  site: SiteMetadata,
  change: {
    close?: { date: string; note?: string }[]
    reopen?: string[]
    vacation?: { enabled: boolean; from?: string; to?: string }
  },
): PlanDraft {
  const existing = site.houseClosedDates ?? []
  const close = (change.close ?? []).filter(
    item => !existing.some(day => day.date === item.date),
  )
  const reopen = existing.filter(day => change.reopen?.includes(day.date))
  const patches: Record<string, unknown>[] = []
  if (close.length)
    patches.push(
      { setIfMissing: { houseClosedDates: [] } },
      {
        insert: {
          after: "houseClosedDates[-1]",
          items: close.map(item => ({
            _key: newKey(),
            _type: "houseClosedDate",
            date: item.date,
            ...(item.note ? { note: item.note } : {}),
          })),
        },
      },
    )
  if (reopen.length)
    patches.push({
      unset: reopen.map(day => `houseClosedDates[_key=="${day._key}"]`),
    })
  if (change.vacation)
    patches.push({
      set: {
        vacationMode: {
          enabled: change.vacation.enabled,
          ...(change.vacation.from ? { from: change.vacation.from } : {}),
          ...(change.vacation.to ? { to: change.vacation.to } : {}),
        },
      },
    })
  if (!patches.length)
    throw new Error(
      "Ingenting å endre: datoene er allerede registrert, eller finnes ikke.",
    )
  const parts = [
    close.length
      ? `stengt ${close.map(item => item.date + (item.note ? ` (${item.note})` : "")).join(", ")}`
      : "",
    reopen.length
      ? `åpent igjen ${reopen.map(day => day.date).join(", ")}`
      : "",
    change.vacation
      ? change.vacation.enabled
        ? `feriemodus ${change.vacation.from} til ${change.vacation.to}`
        : "feriemodus av"
      : "",
  ].filter(Boolean)
  return {
    summary: `Åpningstider: ${parts.join("; ")}. Vises på nettsiden, og karaoke kan ikke bookes på stengte dager.`,
    ops: [
      ...patchOp(
        { [site._id]: { patches } },
        `Oppdater åpningstidene: ${parts.join("; ")}`,
      ),
      publishOp([site._id], "Publiser åpningstidene"),
    ],
    warnings: site.hasDraft
      ? [
          "Åpningstidene har et upublisert utkast; publiseringen tar med endringene i det.",
        ]
      : [],
  }
}

const SITE_QUERY = `*[_id == "siteMetadata"][0]{_id, houseClosedDates, "hasDraft": defined(*[_id == "drafts.siteMetadata"][0]._id)}`

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")

/** The editorial plan tools. `save` stores a plan and returns its id. */
export function editorialTools(options: {
  scope: SanityScope
  requester: string
  save: (plan: Omit<Plan, "id">) => string
  fetchFn?: Fetch
}) {
  const { scope, fetchFn } = options
  const store = (draft: PlanDraft) => {
    const planId = options.save({
      requester: options.requester,
      summary: [draft.summary, ...draft.warnings].join(" "),
      ops: draft.ops,
    })
    return {
      planId,
      status: "venter på godkjenning",
      summary: draft.summary,
      steps: draft.ops.map(op => op.label),
      warnings: draft.warnings.length ? draft.warnings : undefined,
      note: "Planen vises i tråden av systemet. Ikke gjenta godkjenningsinstruksjonene. Ikke si at noe er endret.",
    }
  }
  const failed = (error: unknown) => ({
    error: error instanceof Error ? error.message : "Kunne ikke lage planen.",
  })
  return {
    plan_merge_events: tool({
      description:
        'Lag en plan som slår sammen arrangementer. into "single": ett arrangement med alle datoene (duplikater fjernes; billettlenker samles). into "series": en serie med én seriedag per dato. into "festival": en festival med én festivaldag per dato. En eksisterende serie/festival blant id-ene gjenbrukes; ellers lages en ny fra base_id. Slå opp arrangementene med find_events først. Personen som spurte må godkjenne.',
      inputSchema: z.object({
        ids: z.array(z.string()).min(1).max(25),
        into: z.enum(["single", "series", "festival"]),
        keep_id: z
          .string()
          .optional()
          .describe(
            'For "single": arrangementet som beholdes (standard: det første godkjente).',
          ),
        base_id: z
          .string()
          .optional()
          .describe(
            "For ny serie/festival: arrangementet som gir tittel, beskrivelse, bilde, rom og pris.",
          ),
        title_nb: z.string().optional(),
        title_en: z.string().optional(),
      }),
      execute: async ({ ids, into, keep_id, base_id, title_nb, title_en }) => {
        try {
          const events = await loadDocuments(scope, ids, fetchFn)
          if (into === "single") {
            const keep =
              keep_id ??
              events.find(event => event.doc.approvalStatus === "approved")
                ?.id ??
              events[0].id
            return store(
              mergeIntoSingle(events, clean(keep), {
                titleNb: title_nb,
                titleEn: title_en,
              }),
            )
          }
          return store(
            mergeIntoParent(events, into, {
              baseId: base_id && clean(base_id),
              titleNb: title_nb,
              titleEn: title_en,
            }),
          )
        } catch (error) {
          return failed(error)
        }
      },
    }),
    plan_create_festival: tool({
      description:
        "Lag en plan for en ny festival (eller serie), valgfritt med eksisterende arrangementer som festivaldager. Beskrivelse på norsk og engelsk anbefales for festivaler.",
      inputSchema: z.object({
        kind: z.enum(["festival", "series"]).optional(),
        title_nb: z.string(),
        title_en: z.string().optional(),
        description_nb: z.string().optional(),
        description_en: z.string().optional(),
        event_ids: z.array(z.string()).max(25).optional(),
      }),
      execute: async input => {
        try {
          const events = input.event_ids?.length
            ? await loadDocuments(scope, input.event_ids, fetchFn)
            : []
          const draft = mergeIntoParent(events, input.kind ?? "festival", {
            titleNb: input.title_nb,
            titleEn: input.title_en,
          })
          const description = [
            ["nb", input.description_nb],
            ["en", input.description_en],
          ]
            .filter(([, text]) => text)
            .map(([language, text]) => ({
              _key: language,
              _type: "internationalizedArrayPortableTextContentValue",
              language,
              value: (text as string).split(/\n{2,}/).map(paragraph => ({
                _key: newKey(),
                _type: "block",
                style: "normal",
                markDefs: [],
                children: [
                  { _key: newKey(), _type: "span", marks: [], text: paragraph },
                ],
              })),
            }))
          const create = draft.ops.find(op => op.tool === "create_documents")
          if (create && description.length) {
            const content = (
              create.input.documents as { content: Record<string, unknown> }[]
            )[0].content
            content.localizedDescription = description
          }
          return store(draft)
        } catch (error) {
          return failed(error)
        }
      },
    }),
    plan_attach_events: tool({
      description:
        "Lag en plan som legger arrangementer inn i en eksisterende serie eller festival (som seriedager/festivaldager, én per dato).",
      inputSchema: z.object({
        ids: z.array(z.string()).min(1).max(25),
        parent_id: z.string(),
      }),
      execute: async ({ ids, parent_id }) => {
        try {
          const [parent, ...events] = await loadDocuments(
            scope,
            [parent_id, ...ids],
            fetchFn,
          )
          const kind =
            parent.doc.eventKind === "seriesParent"
              ? "series"
              : parent.doc.eventKind === "festivalParent"
                ? "festival"
                : undefined
          if (!kind)
            throw new Error("parent_id må være en serie eller en festival.")
          return store(
            mergeIntoParent(events, kind, { existingParent: parent }),
          )
        } catch (error) {
          return failed(error)
        }
      },
    }),
    plan_detach_events: tool({
      description:
        "Lag en plan som gjør seriedager/festivaldager om til frittstående arrangementer (endrer type til single og fyller inn tittel, rom osv. fra serien der de mangler).",
      inputSchema: z.object({ ids: z.array(z.string()).min(1).max(25) }),
      execute: async ({ ids }) => {
        try {
          const events = await loadDocuments(scope, ids, fetchFn)
          const parentIds = [
            ...new Set(
              events
                .map(event => event.doc.parentEvent?._ref)
                .filter((id): id is string => Boolean(id)),
            ),
          ]
          const parents = parentIds.length
            ? await loadDocuments(scope, parentIds, fetchFn)
            : []
          return store(detachEvents(events, parents))
        } catch (error) {
          return failed(error)
        }
      },
    }),
    plan_house_hours: tool({
      description:
        'Lag en plan for åpningstidene på nettsiden: hele dager huset er stengt (f.eks. "vi er stengt i morgen"), åpne en stengt dag igjen, eller slå feriemodus av/på. Bruk kalenderen for datoer.',
      inputSchema: z.object({
        close: z
          .array(z.object({ date: DATE, note: z.string().max(80).optional() }))
          .optional()
          .describe("Dager huset er stengt, med en kort merknad som vises."),
        reopen: z
          .array(DATE)
          .optional()
          .describe("Stengte dager som skal fjernes."),
        vacation: z
          .object({
            enabled: z.boolean(),
            from: DATE.optional(),
            to: DATE.optional().describe("Datoen vi åpner igjen."),
          })
          .optional(),
      }),
      execute: async change => {
        try {
          const site = await sanityQuery<SiteMetadata | null>(
            scope,
            SITE_QUERY,
            {},
            fetchFn,
          )
          if (!site) throw new Error("Fant ikke åpningstidene (siteMetadata).")
          return store(houseHoursPlan(site, change))
        } catch (error) {
          return failed(error)
        }
      },
    }),
  }
}
