import { icons } from "@sanity/icons"
import {
  ALL_FIELDS_GROUP,
  defineArrayMember,
  defineField,
  defineType,
} from "sanity"

import { RecurringInput } from "../../components/RecurringInput"

const EVENT_KIND_OPTIONS = [
  { title: "Enkeltarrangement", value: "single" },
  { title: "Serie", value: "seriesParent" },
  { title: "Seriedag", value: "seriesInstance" },
  { title: "Festival", value: "festivalParent" },
  { title: "Festivaldag", value: "festivalSession" },
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
    {
      ...ALL_FIELDS_GROUP,
      title: "Alle",
      i18n: undefined,
      default: true,
    },
    { name: "core", title: "Grunninfo" },
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
      title: "Arrangementstype",
      type: "string",
      group: "structure",
      initialValue: "single",
      hidden: true,
      options: { list: EVENT_KIND_OPTIONS, layout: "radio" },
    }),
    defineField({
      name: "parentEvent",
      title: "Serie eller festival",
      type: "reference",
      to: [{ type: "arrangement" }],
      group: "structure",
      hidden: true,
      validation: rule =>
        rule.custom(async (value, context) => {
          const kind = eventKindOf(context.document)
          const isChild = CHILD_KINDS.includes(kind)
          if (!isChild) {
            return value
              ? "Bare serie- og festivaldager kan knyttes til en serie eller festival"
              : true
          }
          const ref = (value as { _ref?: string } | undefined)?._ref
          if (!ref) {
            return "Velg serien eller festivalen dagen hører til"
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
        "Kan stå tom på serie- og festivaldager. Da brukes tittelen fra serien eller festivalen.",
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
      title: "Nettadresse",
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
      validation: rule =>
        rule.custom((value, context) =>
          eventKindOf(context.document) === "festivalParent" && !value
            ? "Festivalen må ha en beskrivelse"
            : true,
        ),
    }),
    // ─── Dates ─────────────────────────────────────────────────
    defineField({
      name: "dates",
      title: "Datoer",
      description:
        "For en gjentakende serie er dette seriens første dag. Klokkeslettene kopieres til nye seriedager. Siste dag styres under Gjentakelse.",
      type: "array",
      group: "dates",
      hidden: ({ document }) => eventKindOf(document) === "festivalParent",
      of: [defineArrayMember({ type: "arrangementDate" })],
      validation: rule =>
        rule.custom((value, context) => {
          const kind = eventKindOf(context.document)
          const count = Array.isArray(value) ? value.length : 0
          if (kind === "festivalParent") return true
          if (kind === "seriesParent") {
            return count === 1 || "En gjentakende serie skal ha én første dato"
          }
          if (CHILD_KINDS.includes(kind)) {
            return count === 1 || "Serie- og festivaldager skal ha én dato"
          }
          return count >= 1 || "Minst én dato er påkrevd"
        }),
    }),
    defineField({
      name: "isRecurring",
      title: "Gjentakelse",
      type: "boolean",
      group: "dates",
      initialValue: false,
      hidden: ({ document }) =>
        !["single", "seriesParent"].includes(eventKindOf(document)),
      components: { input: RecurringInput },
    }),
    defineField({
      name: "rrule",
      title: "Lagret gjentakelse",
      type: "string",
      group: "dates",
      hidden: true,
    }),

    // ─── Media ─────────────────────────────────────────────────
    defineField({
      name: "image",
      title: "Bilde",
      type: "image",
      group: "media",
      options: { hotspot: true },
      hidden: ({ document }) =>
        eventKindOf(document) === "festivalSession" &&
        document?.useFestivalImage !== false,
      validation: rule =>
        rule.custom((value, context) => {
          const kind = eventKindOf(context.document)
          if (kind === "festivalParent" && !value)
            return "Festivalen må ha et bilde"
          if (
            kind === "festivalSession" &&
            context.document?.useFestivalImage === false &&
            !value
          )
            return "Velg et eget bilde eller slå på «Bruk festivalbildet»"
          return true
        }),
    }),
    defineField({
      name: "useFestivalImage",
      title: "Bruk festivalbildet",
      description: "Slå av hvis denne festivaldagen skal ha sitt eget bilde.",
      type: "boolean",
      group: "media",
      initialValue: true,
      hidden: ({ document }) => eventKindOf(document) !== "festivalSession",
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
        "Brukes om stedet ikke er et registrert rom — f.eks. 'Uteområdet'. " +
        "For steder utenfor Kvarteret må full gateadresse tas med.",
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
      title: "Hva skjer med arrangementet?",
      description:
        "Avlyste og utsatte arrangementer kan fortsatt være synlige på nettsiden, med tydelig merking.",
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
      hidden: true,
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
