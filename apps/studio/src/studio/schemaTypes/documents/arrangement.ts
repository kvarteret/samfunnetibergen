import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import {
  ALL_FIELDS_GROUP,
  defineArrayMember,
  defineField,
  defineType,
} from "sanity"

import { ArrangementDatesInput } from "../../components/ArrangementDatesInput"
import { ArrangementDocumentInput } from "../../components/ArrangementDocumentInput"
import { FestivalDayShortcutInput } from "../../components/FestivalDayShortcutInput"
import { RecurringInput } from "../../components/RecurringInput"
import {
  deprecatedLegacyField,
  localizedArrayField,
  validateLocalizedArray,
} from "../shared/localizedFields"

const EVENT_KIND_OPTIONS = [
  { title: "Enkeltarrangement", value: "single" },
  { title: "Serie", value: "seriesParent" },
  { title: "Seriedag", value: "seriesInstance" },
  { title: "Festival", value: "festivalParent" },
  { title: "Festivaldag", value: "festivalSession" },
]

const EVENT_STATUS_OPTIONS = [
  { title: "Planlagt", value: "scheduled" },
  { title: "Kansellert", value: "cancelled" },
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
  components: { input: ArrangementDocumentInput },
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
    defineField({
      name: "festivalDayShortcut",
      title: "Festivaldager",
      type: "string",
      group: "core",
      hidden: ({ document }) => eventKindOf(document) !== "festivalParent",
      components: { field: FestivalDayShortcutInput },
    }),

    // ─── Core info ─────────────────────────────────────────────
    deprecatedLegacyField("title", "Tittel (legacy)", "string", {
      description:
        "Kan stå tom på serie- og festivaldager. Bruk Tittel per språk nedenfor.",
      group: "core",
    }),
    {
      ...localizedArrayField(
        "localizedTitle",
        "Tittel",
        "internationalizedArrayString",
        {
          legacyField: "title",
          description:
            "Kan stå tom på serie- og festivaldager. Da brukes tittelen fra serien eller festivalen.",
          group: "core",
        },
      ),
      validation: (rule: any) =>
        rule.custom((value: unknown, context: any) => {
          const base = validateLocalizedArray(value, {
            legacyField: "title",
            context,
          })
          if (base !== true) return base
          const kind = eventKindOf(context.document)
          if (CHILD_KINDS.includes(kind)) return true
          return validateLocalizedArray(value, {
            required: true,
            legacyField: "title",
            context,
          })
        }),
    },
    defineField({
      name: "slug",
      title: "Nettadresse",
      type: "slug",
      group: "core",
      options: {
        source: (document: Record<string, unknown>) => {
          const values = document.localizedTitle as
            | Array<{ language?: string; value?: string }>
            | undefined
          return (
            values?.find(item => item.language === "nb")?.value ??
            (document.title as string | undefined) ??
            ""
          )
        },
      },
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
      name: "promotedPlacement",
      title: "Plassering blant fremhevede",
      type: "string",
      hidden: true,
      options: {
        list: [
          { title: "Over linjen", value: "top" },
          { title: "Under linjen", value: "pool" },
        ],
      },
    }),
    defineField({
      name: "promotedOrder",
      title: "Rekkefølge blant fremhevede",
      type: "number",
      hidden: true,
    }),
    orderRankField({ type: "arrangement" }),
    deprecatedLegacyField(
      "description",
      "Beskrivelse (legacy)",
      "portableTextContent",
      {
        description: "Rik tekst — bruk Beskrivelse per språk nedenfor.",
        group: "core",
      },
    ),
    {
      ...localizedArrayField(
        "localizedDescription",
        "Beskrivelse",
        "internationalizedArrayPortableTextContent",
        { legacyField: "description", group: "core" },
      ),
      validation: (rule: any) =>
        rule.custom((value: unknown, context: any) => {
          const base = validateLocalizedArray(value, {
            legacyField: "description",
            context,
          })
          if (base !== true) return base
          if (eventKindOf(context.document) !== "festivalParent") return true
          return validateLocalizedArray(value, {
            required: true,
            legacyField: "description",
            context,
          })
        }),
    },
    // ─── Dates ─────────────────────────────────────────────────
    defineField({
      name: "dates",
      title: "Datoer",
      description:
        "For en gjentakende serie er dette seriens første dag. Datoen forankrer mønsteret, og klokkeslettene kopieres til nye seriedager. Programperioden velges når dagene opprettes.",
      type: "array",
      group: "dates",
      hidden: ({ document }) => eventKindOf(document) === "festivalParent",
      of: [defineArrayMember({ type: "arrangementDate" })],
      components: { input: ArrangementDatesInput },
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
    deprecatedLegacyField("imageCaption", "Bildetekst (legacy)", "string", {
      group: "media",
    }),
    localizedArrayField(
      "localizedImageCaption",
      "Bildetekst",
      "internationalizedArrayString",
      { legacyField: "imageCaption", group: "media" },
    ),

    // ─── Location ──────────────────────────────────────────────
    defineField({
      name: "room",
      title: "Rom",
      description: "Velg et rom fra listen, eller bruk fritekst nedenfor",
      type: "reference",
      to: [{ type: "room" }],
      group: "location",
    }),
    deprecatedLegacyField("roomText", "Sted (fritekst, legacy)", "string", {
      description:
        "Brukes om stedet ikke er et registrert rom. Bruk Sted per språk nedenfor.",
      group: "location",
    }),
    localizedArrayField(
      "localizedRoomText",
      "Sted (fritekst)",
      "internationalizedArrayString",
      {
        legacyField: "roomText",
        group: "location",
      },
    ),

    // ─── Organizer ─────────────────────────────────────────────
    defineField({
      name: "organizerGroup",
      title: "Arrangørgruppe",
      description: "Velg en gruppe fra lista, om arrangøren er registrert der",
      type: "reference",
      to: [{ type: "studentGroup" }],
      group: "organizer",
    }),
    deprecatedLegacyField(
      "organizerText",
      "Arrangør (fritekst, legacy)",
      "string",
      {
        description: "Brukes om arrangøren ikke er i lista.",
        group: "organizer",
      },
    ),
    localizedArrayField(
      "localizedOrganizerText",
      "Arrangør (fritekst)",
      "internationalizedArrayString",
      { legacyField: "organizerText", group: "organizer" },
    ),

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
      title: "Arrangementstatus",
      type: "string",
      group: "admin",
      initialValue: "scheduled",
      hidden: true,
      options: { list: EVENT_STATUS_OPTIONS, layout: "radio" },
      validation: rule => rule.required(),
    }),
    defineField({
      name: "approvalStatus",
      title: "Godkjenningsstatus",
      type: "string",
      group: "admin",
      initialValue: "pending",
      hidden: true,
      validation: rule => rule.required(),
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
      localizedTitle: "localizedTitle",
      parentTitle: "parentEvent.title",
      parentLocalizedTitle: "parentEvent.localizedTitle",
      status: "approvalStatus",
      eventKind: "eventKind",
      eventStatus: "eventStatus",
      startDate: "dates.0.startDate",
      image: "image",
    },
    prepare({
      title,
      localizedTitle,
      parentTitle,
      parentLocalizedTitle,
      status,
      eventKind,
      eventStatus,
      startDate,
      image,
    }) {
      const statusLabel: Record<string, string> = {
        pending: "⏳ Venter",
        approved: "✅ Godkjent",
        rejected: "❌ Avvist",
      }
      const eventStatusLabel: Record<string, string> = {
        cancelled: "🚫 Kansellert",
      }
      const kindLabel =
        eventKind && eventKind !== "single" ? KIND_LABELS[eventKind] : undefined
      const localizedValue = (value: unknown) =>
        Array.isArray(value)
          ? value.find(item => item?.language === "nb")?.value
          : undefined
      return {
        title:
          localizedValue(localizedTitle) ??
          title ??
          localizedValue(parentLocalizedTitle) ??
          parentTitle ??
          "Arrangement",
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
    orderRankOrdering,
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
