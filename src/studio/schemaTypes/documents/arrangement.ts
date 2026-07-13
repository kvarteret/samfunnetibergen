import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const APPROVAL_STATUS_OPTIONS = [
  { title: "Venter på godkjenning", value: "pending" },
  { title: "Godkjent", value: "approved" },
  { title: "Satt på pause", value: "paused" },
  { title: "Avvist", value: "rejected" },
  { title: "Arkivert", value: "archived" },
]

const EVENT_KIND_OPTIONS = [
  { title: "Enkeltarrangement", value: "single" },
  { title: "Serie (forelder)", value: "seriesParent" },
  { title: "Serieinstans", value: "seriesInstance" },
  { title: "Festival (forelder)", value: "festivalParent" },
  { title: "Festivaløkt", value: "festivalSession" },
]

const EVENT_STATUS_OPTIONS = [
  { title: "Planlagt", value: "scheduled" },
  { title: "Avlyst", value: "cancelled" },
  { title: "Utsatt", value: "postponed" },
]

const KIND_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_KIND_OPTIONS.map(option => [option.value, option.title]),
)

const CHILD_KINDS = ["seriesInstance", "festivalSession"]
const PARENT_KIND_FOR_CHILD: Record<string, string> = {
  seriesInstance: "seriesParent",
  festivalSession: "festivalParent",
}

function eventKindOf(document: Record<string, unknown> | undefined): string {
  return typeof document?.eventKind === "string" ? document.eventKind : "single"
}

export const arrangement = defineType({
  name: "arrangement",
  title: "Arrangement",
  type: "document",
  icon: icons.calendar,
  groups: [
    { name: "core", title: "Grunninfo", default: true },
    { name: "structure", title: "Struktur" },
    { name: "dates", title: "Datoer" },
    { name: "location", title: "Sted" },
    { name: "pricing", title: "Pris" },
    { name: "organizer", title: "Arrangør" },
    { name: "links", title: "Lenker" },
    { name: "media", title: "Bilde" },
    { name: "admin", title: "Administrasjon" },
  ],
  fields: [
    // ─── Structure (ADR 005: materialized instances & festivals) ──
    defineField({
      name: "eventKind",
      title: "Arrangementsrolle",
      description:
        "Enkeltarrangement er standard. Serie/festival-foreldre er maler og " +
        "oversikter; instanser og økter er konkrete forekomster knyttet til " +
        "en forelder. Manglende verdi tolkes som enkeltarrangement.",
      type: "string",
      group: "structure",
      initialValue: "single",
      options: { list: EVENT_KIND_OPTIONS, layout: "radio" },
    }),
    defineField({
      name: "parentEvent",
      title: "Foreldrearrangement",
      description:
        "Serien eller festivalen denne forekomsten hører til. Sterk referanse: " +
        "forelderen kan ikke slettes så lenge barn finnes.",
      type: "reference",
      to: [{ type: "arrangement" }],
      group: "structure",
      hidden: ({ document }) => !CHILD_KINDS.includes(eventKindOf(document)),
      validation: rule =>
        rule.custom(async (value, context) => {
          const kind = eventKindOf(context.document)
          const isChild = CHILD_KINDS.includes(kind)
          if (!isChild) {
            return value
              ? "Kun serieinstanser og festivaløkter kan ha foreldrearrangement"
              : true
          }
          const ref = (value as { _ref?: string } | undefined)?._ref
          if (!ref) {
            return "Påkrevd for serieinstanser og festivaløkter"
          }
          const client = context.getClient({ apiVersion: "2026-01-01" })
          const parentKind = await client.fetch<string | null>(
            `coalesce(*[_id == $id][0].eventKind, *[_id == "drafts." + $id][0].eventKind)`,
            { id: ref },
          )
          const expected = PARENT_KIND_FOR_CHILD[kind]
          if (parentKind !== expected) {
            return `Foreldrearrangementet må ha rollen «${KIND_LABELS[expected]}»`
          }
          return true
        }),
    }),

    // ─── Core info ─────────────────────────────────────────────
    defineField({
      name: "title",
      title: "Tittel",
      description:
        "Kan stå tom på serieinstanser og festivaløkter — da arves tittelen " +
        "fra foreldrearrangementet.",
      type: "string",
      group: "core",
      validation: rule =>
        rule.custom((value, context) => {
          if (value) return true
          if (CHILD_KINDS.includes(eventKindOf(context.document))) return true
          return "Tittel er påkrevd"
        }),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "core",
      options: { source: "title" },
      validation: rule => rule.required(),
    }),
    defineField({
      name: "eventType",
      title: "Arrangementtype",
      type: "reference",
      to: [{ type: "eventType" }],
      group: "core",
    }),
    defineField({
      name: "isInternalEvent",
      title: "Internarrangement",
      description: "Arrangementet er kun tilgjengelig for frivillige.",
      type: "boolean",
      group: "core",
      initialValue: false,
    }),
    defineField({
      name: "isPromoted",
      title: "Promotert på forsiden",
      description:
        "Vises blant de tre fremhevede arrangementene øverst på forsiden.",
      type: "boolean",
      group: "core",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      description: "Rik tekst — formatering, bilder og lenker støttes",
      type: "portableTextContent",
      group: "core",
    }),
    // ─── Dates ─────────────────────────────────────────────────
    defineField({
      name: "dates",
      title: "Datoer",
      description:
        "Enkeltarrangement: én eller flere datoer. Instanser/økter: nøyaktig " +
        "én. Serie/festival-foreldre: valgfrie oversiktsdatoer.",
      type: "array",
      group: "dates",
      of: [defineArrayMember({ type: "arrangementDate" })],
      validation: rule =>
        rule.custom((value, context) => {
          const kind = eventKindOf(context.document)
          const count = Array.isArray(value) ? value.length : 0
          if (kind === "seriesParent" || kind === "festivalParent") return true
          if (CHILD_KINDS.includes(kind)) {
            return count === 1 || "Instanser og økter skal ha nøyaktig én dato"
          }
          return count >= 1 || "Minst én dato er påkrevd"
        }),
    }),
    defineField({
      name: "isRecurring",
      title: "Gjentagende arrangement",
      description:
        "Slå på for å angi et gjentagelsesmønster. Kun relevant for " +
        "serieforeldre — instansene genereres som egne dokumenter.",
      type: "boolean",
      group: "dates",
      initialValue: false,
      hidden: ({ document }) => eventKindOf(document) !== "seriesParent",
    }),
    defineField({
      name: "rrule",
      title: "Gjentagelsesregel (iCal RRULE)",
      description:
        "Genererings-metadata for serieinstanser. Format: FREQ=WEEKLY;BYDAY=MO,WE",
      type: "string",
      group: "dates",
      hidden: ({ document }) =>
        eventKindOf(document) !== "seriesParent" || !document?.isRecurring,
    }),

    // ─── Media ─────────────────────────────────────────────────
    defineField({
      name: "image",
      title: "Bilde",
      type: "image",
      group: "media",
      options: { hotspot: true },
    }),
    defineField({
      name: "imageCaption",
      title: "Bildetekst",
      type: "string",
      group: "media",
    }),

    // ─── Location ──────────────────────────────────────────────
    defineField({
      name: "room",
      title: "Rom",
      description: "Velg et rom fra listen, eller bruk fritekst nedenfor",
      type: "reference",
      to: [{ type: "room" }],
      group: "location",
    }),
    defineField({
      name: "roomText",
      title: "Sted (fritekst)",
      description:
        "Brukes om stedet ikke er et registrert rom — f.eks. 'Uteområdet'",
      type: "string",
      group: "location",
    }),

    // ─── Organizer ─────────────────────────────────────────────
    defineField({
      name: "organizerGroup",
      title: "Arrangørgruppe",
      description: "Velg en gruppe fra lista, om arrangøren er registrert der",
      type: "reference",
      to: [{ type: "studentGroup" }],
      group: "organizer",
    }),
    defineField({
      name: "organizerText",
      title: "Arrangør (fritekst)",
      description: "Brukes om arrangøren ikke er i lista",
      type: "string",
      group: "organizer",
    }),

    // ─── Pricing ───────────────────────────────────────────────
    defineField({
      name: "isFree",
      title: "Gratis inngang",
      type: "boolean",
      group: "pricing",
      initialValue: false,
    }),
    defineField({
      name: "priceOrdinar",
      title: "Pris — Ordinær (kr)",
      type: "number",
      group: "pricing",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule => rule.min(0),
    }),
    defineField({
      name: "priceStudent",
      title: "Pris — Student (kr)",
      type: "number",
      group: "pricing",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule => rule.min(0),
    }),
    defineField({
      name: "priceMedlem",
      title: "Pris — Medlem (kr)",
      type: "number",
      group: "pricing",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule => rule.min(0),
    }),

    // ─── Links ─────────────────────────────────────────────────
    defineField({
      name: "ticketUrl",
      title: "Billettlenke",
      type: "url",
      group: "links",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook-arrangement",
      type: "url",
      group: "links",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),

    // ─── Admin / approval ──────────────────────────────────────
    defineField({
      name: "eventStatus",
      title: "Arrangementsstatus",
      description:
        "Faktisk status i virkeligheten — uavhengig av godkjenningsstatus. " +
        "Avlyste og utsatte arrangementer forblir synlige med merking.",
      type: "string",
      group: "admin",
      initialValue: "scheduled",
      options: { list: EVENT_STATUS_OPTIONS, layout: "radio" },
    }),
    defineField({
      name: "approvalStatus",
      title: "Godkjenningsstatus",
      type: "string",
      group: "admin",
      initialValue: "pending",
      options: {
        list: APPROVAL_STATUS_OPTIONS,
        layout: "radio",
      },
    }),
    defineField({
      name: "submittedBy",
      title: "Innsendt av (navn)",
      type: "string",
      group: "admin",
    }),
    defineField({
      name: "submittedByEmail",
      title: "Innsendt av (e-post)",
      type: "string",
      group: "admin",
    }),
    defineField({
      name: "submittedByOrganization",
      title: "Organisasjon",
      type: "string",
      group: "admin",
    }),
    defineField({
      name: "adminNote",
      title: "Intern kommentar",
      description: "Kun synlig for redaktører",
      type: "text",
      rows: 2,
      group: "admin",
    }),
  ],
  preview: {
    select: {
      title: "title",
      parentTitle: "parentEvent.title",
      status: "approvalStatus",
      eventKind: "eventKind",
      eventStatus: "eventStatus",
      startDate: "dates.0.startDate",
      image: "image",
    },
    prepare({
      title,
      parentTitle,
      status,
      eventKind,
      eventStatus,
      startDate,
      image,
    }) {
      const statusLabel: Record<string, string> = {
        pending: "⏳ Venter",
        approved: "✅ Godkjent",
        paused: "⏸ Satt på pause",
        rejected: "❌ Avvist",
        archived: "📦 Arkivert",
      }
      const eventStatusLabel: Record<string, string> = {
        cancelled: "🚫 Avlyst",
        postponed: "⏭ Utsatt",
      }
      const kindLabel =
        eventKind && eventKind !== "single" ? KIND_LABELS[eventKind] : undefined
      return {
        title: title ?? parentTitle ?? "Arrangement",
        subtitle: [
          startDate,
          kindLabel,
          eventStatusLabel[eventStatus],
          statusLabel[status],
        ]
          .filter(Boolean)
          .join(" · "),
        media: image,
      }
    },
  },
  orderings: [
    {
      title: "Dato (nyeste først)",
      name: "dateDesc",
      by: [{ field: "dates[0].startDate", direction: "desc" }],
    },
    {
      title: "Dato (eldste først)",
      name: "dateAsc",
      by: [{ field: "dates[0].startDate", direction: "asc" }],
    },
  ],
})
