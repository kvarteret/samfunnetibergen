import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  getPublishedDocumentId,
  wouldCreateGroupCycle,
} from "../../contentPolicies"
import { studentGroupSlugFromName } from "../../groupSlugs"
import { localizedArrayField } from "../shared/localizedFields"

export const STUDENT_GROUP_CATEGORIES = [
  { title: "Arbeidsgruppe (Arg)", value: "arbeidsgruppe" },
  { title: "Komité (Arg)", value: "komitee" },
  { title: "Driftsorganisasjon (Dorg)", value: "dorg" },
  { title: "Brukerorganisasjon (Borg)", value: "borg" },
]

export type StudentGroupCategory = "arbeidsgruppe" | "komitee" | "dorg" | "borg"

export const studentGroup = defineType({
  name: "studentGroup",
  title: "Gruppe",
  type: "document",
  icon: icons.users,
  groups: [
    { name: "identity", title: "Gruppe", default: true },
    { name: "hierarchy", title: "Hierarki" },
    { name: "contact", title: "Kontakt" },
  ],
  fields: [
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      {
        required: true,
        description:
          "Kanonisk navn per språk. Legg bare til engelsk når navnet faktisk oversettes.",
        group: "identity",
      },
    ),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Teknisk identifikator. Den skjules og låses så snart den er opprettet.",
      type: "slug",
      group: "identity",
      hidden: ({ document }) =>
        Boolean((document?.slug as { current?: string } | undefined)?.current),
      readOnly: ({ document }) =>
        Boolean((document?.slug as { current?: string } | undefined)?.current),
      options: {
        source: (document: Record<string, unknown>) => {
          const values = document.localizedName as
            | Array<{ language?: string; value?: string }>
            | undefined
          return (
            values?.find(item => item.language === "nb")?.value ??
            (document.name as string | undefined) ??
            ""
          )
        },
        slugify: studentGroupSlugFromName,
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategori",
      type: "string",
      group: "identity",
      options: {
        list: STUDENT_GROUP_CATEGORIES,
        layout: "radio",
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: "parentGroup",
      title: "Overordnet gruppe",
      description:
        "Dersom denne gruppen er en undergruppe, velg foreldregruppen her",
      type: "reference",
      group: "hierarchy",
      to: [{ type: "studentGroup" }],
      options: {
        filter: ({ document }) => ({
          filter: "category in ['arbeidsgruppe', 'komitee'] && _id != $id",
          params: { id: getPublishedDocumentId(document._id) },
        }),
      },
      validation: rule =>
        rule.custom(async (value, context) => {
          if (!value?._ref || !context.document?._id) return true
          const client = context.getClient({ apiVersion: "2025-02-19" })
          const hasCycle = await wouldCreateGroupCycle(
            context.document._id,
            value._ref,
            async documentId =>
              client.fetch<string | null>(
                `coalesce(
                  *[_id == "drafts." + $id][0].parentGroup._ref,
                  *[_id == $id][0].parentGroup._ref
                )`,
                { id: documentId },
              ),
          )
          return hasCycle ? "En gruppe kan ikke være sin egen forfader." : true
        }),
    }),
    localizedArrayField(
      "localizedSummary",
      "Kort beskrivelse",
      "internationalizedArrayText",
      { required: true, group: "identity" },
    ),
    localizedArrayField(
      "localizedBody",
      "Fullstendig beskrivelse",
      "internationalizedArrayPortableTextContent",
      { group: "identity" },
    ),
    defineField({
      name: "recruitmentLabel",
      title: "Rekrutteringskategori",
      description:
        "Kort merkelapp som kan brukes av bli frivillig-siden og andre rekrutteringsflater.",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "recruitmentLead",
      title: "Rekrutteringsingress",
      description:
        "Kort tekst for valgkort eller andre rekrutteringsflater. La stå tom for å bruke kort beskrivelse.",
      type: "text",
      rows: 4,
      hidden: true,
    }),
    defineField({
      name: "recruitmentSections",
      title: "Les litt mer",
      description:
        "Korte, lesbare seksjoner for rekruttering. Undergrupper skal opprettes som egne grupper med overordnet gruppe.",
      type: "array",
      hidden: true,
      of: [
        defineArrayMember({
          name: "recruitmentSection",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Tittel",
              type: "string",
              validation: rule => rule.required(),
            }),
            defineField({
              name: "paragraphs",
              title: "Avsnitt",
              type: "array",
              of: [defineArrayMember({ type: "text", rows: 3 })],
              validation: rule => rule.required().min(1),
            }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
    defineField({
      name: "links",
      title: "Lenker",
      description:
        "Fyll ut lenker til sosiale medier, nettside, e-post osv. i prioritert rekkefølge.",
      type: "array",
      group: "contact",
      of: [
        defineArrayMember({
          name: "groupLink",
          title: "Lenke",
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Plattform",
              type: "string",
              options: {
                list: [
                  { title: "E-post", value: "email" },
                  { title: "Hjemmeside", value: "website" },
                  { title: "Facebook", value: "facebook" },
                  { title: "Instagram", value: "instagram" },
                  { title: "TikTok", value: "tiktok" },
                  { title: "Studentbergen", value: "studentbergen" },
                  { title: "Annet / egendefinert", value: "other" },
                ],
              },
              validation: rule => rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL eller e-post",
              type: "string",
              validation: rule => rule.required(),
            }),
            localizedArrayField(
              "localizedCustomLabel",
              "Egendefinert label",
              "internationalizedArrayString",
              {},
            ),
          ],
          preview: {
            select: {
              platform: "platform",
              url: "url",
              customLabel: "customLabel",
            },
            prepare({ platform, url, customLabel }) {
              const platformNames: Record<string, string> = {
                email: "E-post",
                website: "Hjemmeside",
                facebook: "Facebook",
                instagram: "Instagram",
                tiktok: "TikTok",
                studentbergen: "Studentbergen",
                other: "Annet",
              }
              return {
                title: customLabel || platformNames[platform] || platform,
                subtitle: url,
                media: undefined,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: "email",
      title: "E-post",
      type: "string",
      group: "contact",
      hidden: true,
      validation: rule => rule.email(),
    }),
    defineField({
      name: "website",
      title: "Nettside",
      type: "url",
      group: "contact",
      hidden: true,
      validation: rule =>
        rule.uri({ scheme: ["http", "https"] }).error("Må være en gyldig URL"),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Logobilde som vises på kortene i gruppelistene",
      type: "image",
      group: "identity",
      options: { hotspot: false },
    }),
    localizedArrayField(
      "localizedLabels",
      "Etiketter (oversettelser)",
      "internationalizedArrayText",
      { group: "identity" },
    ),
    defineField({
      name: "image",
      title: "Bilde",
      type: "sourcedImage",
      group: "identity",
    }),
    orderRankField({ type: "studentGroup" }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: {
      title: "localizedName",
      subtitle: "category",
      media: "image.image",
    },
    prepare({ title, subtitle, media }) {
      const categoryLabel: Record<string, string> = {
        arbeidsgruppe: "Arbeidsgruppe (Arg)",
        komitee: "Komité (Arg)",
        dorg: "Driftsorganisasjon (Dorg)",
        borg: "Brukerorganisasjon",
      }
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ?? "Gruppe",
        subtitle: categoryLabel[subtitle] ?? subtitle,
        media,
      }
    },
  },
})
