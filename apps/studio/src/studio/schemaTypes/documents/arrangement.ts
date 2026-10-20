import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import {
  ALL_FIELDS_GROUP,
  type ConditionalPropertyCallbackContext,
  defineArrayMember,
  defineField,
  defineType,
  type FieldDefinition,
} from "sanity"

import { ArrangementDatesInput } from "../../components/ArrangementDatesInput"
import { ArrangementDocumentInput } from "../../components/ArrangementDocumentInput"
import { RecurringInput } from "../../components/RecurringInput"
import {
  localizedArrayField,
  validateLocalizedArray,
} from "../shared/localizedFields"

// Adds AI Assist's "Translate fields" action next to each Norwegian/English pair.
const TRANSLATE_ACTION = { aiAssist: { translateAction: true } }

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

type Doc = Record<string, unknown>

const hasRef = (value: unknown) => Boolean((value as { _ref?: string })?._ref)

/** Visible text of a localized string or portable-text value. */
function localizedText(value: unknown, language: string): string {
  const entry = Array.isArray(value)
    ? value.find(item => item?.language === language)?.value
    : undefined
  if (typeof entry === "string") return entry.trim()
  if (!Array.isArray(entry)) return ""
  return entry
    .flatMap(block => block?.children ?? [])
    .map((child: { text?: unknown }) =>
      typeof child?.text === "string" ? child.text : "",
    )
    .join("")
    .trim()
}

/**
 * Single arrangements ("Nytt arrangement") must be complete before they can be
 * published or approved; drafts may be saved incomplete. Series and festivals
 * keep their own rules. "Kun infoskjerm" arrangements only need a title, room
 * and time.
 */
function requiredForSingle(
  isComplete: (document: Doc) => boolean,
  message: string,
) {
  return (_value: unknown, context: { document?: unknown }) => {
    const document = (context.document ?? {}) as Doc
    return (
      eventKindOf(document) !== "single" ||
      document.infoScreenOnly === true ||
      isComplete(document) ||
      message
    )
  }
}

/** Fields an info-only arrangement still shows; everything else is hidden. */
const INFO_SCREEN_ONLY_FIELDS = new Set([
  "infoScreenOnly",
  "localizedTitle",
  "room",
  "localizedRoomText",
  "dates",
  "eventKind",
  "parentEvent",
  "initialSlug",
  "approvalStatus",
  "eventStatus",
])

function withInfoScreenOnlyHiding(fields: FieldDefinition[]) {
  return fields.map(field => {
    if (INFO_SCREEN_ONLY_FIELDS.has(field.name) || field.hidden === true)
      return field
    const hidden = field.hidden
    return {
      ...field,
      hidden: (context: ConditionalPropertyCallbackContext) =>
        (context.document as Doc | undefined)?.infoScreenOnly === true ||
        (typeof hidden === "function"
          ? Boolean(hidden(context))
          : Boolean(hidden)),
    }
  })
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
    { name: "structure", title: "Struktur", hidden: true },
    { name: "schedule", title: "Tid og sted" },
    { name: "tickets", title: "Pris og billetter" },
    { name: "media", title: "Bilde" },
    { name: "admin", title: "Administrasjon" },
  ],
  fields: withInfoScreenOnlyHiding([
    defineField({
      name: "infoScreenOnly",
      title: "Kun infoskjerm",
      description:
        "Vises bare på infoskjermen, fra 30 minutter før start til 15 minutter etter. Trenger bare tittel, rom og tid. Vises ikke på nettsiden, i API-et eller i appen.",
      type: "boolean",
      group: "core",
      initialValue: false,
      hidden: ({ document }) => eventKindOf(document) !== "single",
    }),
    defineField({
      name: "initialSlug",
      title: "Opprinnelig arrangementsidentitet",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
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
    {
      ...localizedArrayField(
        "localizedTitle",
        "Tittel",
        "internationalizedArrayString",
        {
          options: TRANSLATE_ACTION,
          description:
            "Kan stå tom på serie- og festivaldager. Da brukes tittelen fra serien eller festivalen.",
          group: "core",
        },
      ),
      validation: rule =>
        rule.custom((value, context) => {
          const norwegianOnly =
            (context.document as Doc | undefined)?.infoScreenOnly === true
          const base = validateLocalizedArray(value, { norwegianOnly })
          if (base !== true) return base
          const kind = eventKindOf(context.document)
          if (CHILD_KINDS.includes(kind)) return true
          return validateLocalizedArray(value, {
            required: true,
            norwegianOnly,
          })
        }),
    },
    defineField({
      name: "eventType",
      title: "Arrangementtype",
      type: "reference",
      to: [{ type: "eventType" }],
      group: "core",
      options: { disableNew: true },
      validation: rule =>
        rule.custom(
          requiredForSingle(
            doc => hasRef(doc.eventType),
            "Velg arrangementstype",
          ),
        ),
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
    {
      ...localizedArrayField(
        "localizedDescription",
        "Beskrivelse",
        "internationalizedArrayPortableTextContent",
        { options: TRANSLATE_ACTION, group: "core" },
      ),
      validation: rule =>
        rule.custom((value, context) => {
          const base = validateLocalizedArray(value)
          if (base !== true) return base
          const described = requiredForSingle(
            doc =>
              Boolean(
                localizedText(doc.localizedDescription, "nb") &&
                  localizedText(doc.localizedDescription, "en"),
              ),
            "Skriv inn beskrivelse på norsk og engelsk",
          )(value, context)
          if (described !== true) return described
          if (eventKindOf(context.document) !== "festivalParent") return true
          return validateLocalizedArray(value, {
            required: true,
          })
        }),
    },
    // ─── Dates ─────────────────────────────────────────────────
    defineField({
      name: "dates",
      title: "Datoer",
      description:
        "For serier: den første dagen. Tidene brukes på alle dagene.",
      type: "array",
      group: "schedule",
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
      group: "schedule",
      initialValue: false,
      hidden: ({ document }) => eventKindOf(document) !== "seriesParent",
      components: { input: RecurringInput },
    }),
    defineField({
      name: "rrule",
      title: "Lagret gjentakelse",
      type: "string",
      group: "schedule",
      hidden: true,
    }),

    // ─── Media ─────────────────────────────────────────────────
    defineField({
      name: "image",
      title: "Bilde",
      type: "image",
      group: "media",
      options: {
        hotspot: true,
        // AI Assist writes this when the image changes (English only).
        aiAssist: { imageDescriptionField: "alt" },
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alternativ tekst",
          description: "Beskriver bildet for skjermlesere. Lages automatisk.",
          type: "string",
        }),
      ],
      hidden: ({ document }) =>
        eventKindOf(document) === "festivalSession" &&
        document?.useFestivalImage !== false,
      validation: rule =>
        rule.custom((value, context) => {
          const kind = eventKindOf(context.document)
          if (kind === "festivalParent" && !value)
            return "Festivalen må ha et bilde"
          if (
            kind === "single" &&
            !value &&
            context.document?.infoScreenOnly !== true
          )
            return "Last opp et bilde"
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
    localizedArrayField(
      "localizedImageCaption",
      "Bildetekst",
      "internationalizedArrayString",
      { options: TRANSLATE_ACTION, group: "media" },
    ),

    // ─── Location ──────────────────────────────────────────────
    defineField({
      name: "room",
      title: "Rom",
      description: "Velg et rom fra listen, eller bruk fritekst nedenfor",
      type: "reference",
      to: [{ type: "room" }],
      group: "schedule",
      options: { disableNew: true },
      validation: rule =>
        rule.custom(
          requiredForSingle(
            doc =>
              hasRef(doc.room) ||
              Boolean(localizedText(doc.localizedRoomText, "nb")),
            "Velg rom, eller skriv inn sted",
          ),
        ),
    }),
    localizedArrayField(
      "localizedRoomText",
      "Sted (fritekst)",
      "internationalizedArrayString",
      {
        options: TRANSLATE_ACTION,
        group: "schedule",
        norwegianOnlyWhenInfoScreen: true,
      },
    ),

    // ─── Organizer ─────────────────────────────────────────────
    defineField({
      name: "organizerGroup",
      title: "Arrangørgruppe",
      description: "Velg en gruppe fra lista, om arrangøren er registrert der",
      type: "reference",
      to: [{ type: "studentGroup" }],
      group: "core",
      options: { disableNew: true },
      validation: rule =>
        rule.custom(
          requiredForSingle(
            doc =>
              hasRef(doc.organizerGroup) ||
              Boolean(localizedText(doc.localizedOrganizerText, "nb")),
            "Velg arrangørgruppe, eller skriv inn arrangør",
          ),
        ),
    }),
    defineField({
      name: "coOrganizerGroups",
      title: "Medarrangører",
      type: "array",
      group: "core",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "studentGroup" }],
          options: { disableNew: true },
        }),
      ],
      validation: rule =>
        rule.unique().custom((value, context) => {
          const main = (
            context.document?.organizerGroup as { _ref?: string } | undefined
          )?._ref
          const refs = (value ?? []) as Array<{ _ref?: string }>
          return main && refs.some(ref => ref._ref === main)
            ? "Hovedarrangøren skal ikke stå som medarrangør"
            : true
        }),
    }),
    localizedArrayField(
      "localizedOrganizerText",
      "Arrangør (fritekst)",
      "internationalizedArrayString",
      { options: TRANSLATE_ACTION, group: "core" },
    ),

    defineField({
      name: "isSoldOut",
      title: "Utsolgt",
      type: "boolean",
      group: "tickets",
      // Set from the document actions menu.
      hidden: true,
      initialValue: false,
    }),

    // ─── Pricing ───────────────────────────────────────────────
    defineField({
      name: "isFree",
      title: "Gratis inngang",
      type: "boolean",
      group: "tickets",
      initialValue: false,
    }),
    defineField({
      name: "priceOrdinar",
      title: "Pris — Ordinær (kr)",
      description: "Fyll ut minst én pris, eller slå på gratis inngang.",
      type: "number",
      group: "tickets",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule =>
        rule
          .min(0)
          .custom(
            requiredForSingle(
              doc =>
                doc.isFree === true ||
                doc.isSoldOut === true ||
                [doc.priceOrdinar, doc.priceStudent, doc.priceMedlem].some(
                  price => typeof price === "number",
                ),
              "Oppgi minst én pris, eller slå på gratis inngang",
            ),
          ),
    }),
    defineField({
      name: "priceStudent",
      title: "Pris — Student (kr)",
      type: "number",
      group: "tickets",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule => rule.min(0),
    }),
    defineField({
      name: "priceMedlem",
      title: "Pris — Medlem (kr)",
      type: "number",
      group: "tickets",
      hidden: ({ document }) => Boolean(document?.isFree),
      validation: rule => rule.min(0),
    }),

    // ─── Links ─────────────────────────────────────────────────
    defineField({
      name: "ticketUrl",
      title: "Billettlenke",
      description: "Påkrevd, med mindre arrangementet er gratis.",
      type: "url",
      group: "tickets",
      validation: rule =>
        rule
          .uri({ scheme: ["http", "https"] })
          .custom(
            requiredForSingle(
              doc => doc.isFree === true || Boolean(doc.ticketUrl),
              "Legg inn billettlenke, eller slå på gratis inngang",
            ),
          ),
    }),
    defineField({
      name: "sourceTicketUrls",
      title: "Sammenslåtte billettlenker",
      description:
        "TicketCo-oppføringer for flere forestillinger, slått sammen hit av importen.",
      type: "array",
      group: "tickets",
      // Written by the TicketCo import so merged listings are not re-imported.
      hidden: true,
      readOnly: true,
      of: [defineArrayMember({ type: "url" })],
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook-arrangement",
      type: "url",
      group: "tickets",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),

    defineField({
      name: "isInternalEvent",
      title: "Internarrangement",
      description: "Arrangementet er kun tilgjengelig for frivillige.",
      type: "boolean",
      group: "core",
      initialValue: false,
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
      name: "slug",
      title: "Nettadresse",
      type: "slug",
      group: "admin",
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
      validation: rule =>
        rule.custom((value, context) =>
          (value as { current?: string } | undefined)?.current ||
          (context.document as Doc | undefined)?.infoScreenOnly === true
            ? true
            : "Påkrevd",
        ),
    }),
    defineField({
      name: "isPromoted",
      title: "Promotert på forsiden",
      // Managed only from Arrangementer → Fremhevede, which also sets order and queue.
      type: "boolean",
      group: "admin",
      hidden: true,
      initialValue: false,
    }),
    defineField({
      name: "submittedBy",
      title: "Innsendt av (navn)",
      type: "string",
      group: "admin",
      validation: rule =>
        rule.custom(
          requiredForSingle(
            doc => Boolean(String(doc.submittedBy ?? "").trim()),
            "Skriv inn kontaktperson",
          ),
        ),
    }),
    defineField({
      name: "submittedByEmail",
      title: "Innsendt av (e-post)",
      type: "string",
      group: "admin",
      validation: rule =>
        rule.custom(
          requiredForSingle(
            doc => Boolean(String(doc.submittedByEmail ?? "").trim()),
            "Skriv inn e-post til kontaktperson",
          ),
        ),
    }),
    defineField({
      name: "submittedByOrganization",
      title: "Organisasjon",
      type: "string",
      group: "admin",
    }),
  ]),
  preview: {
    select: {
      localizedTitle: "localizedTitle",
      parentLocalizedTitle: "parentEvent.localizedTitle",
      status: "approvalStatus",
      eventKind: "eventKind",
      eventStatus: "eventStatus",
      startDate: "dates.0.startDate",
      image: "image",
    },
    prepare({
      localizedTitle,
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
          localizedValue(parentLocalizedTitle) ??
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
