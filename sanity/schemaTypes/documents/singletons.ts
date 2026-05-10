import { CogIcon, DocumentIcon, HeartIcon, StarIcon, UsersIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const siteMetadata = defineType({
    name: "siteMetadata",
    title: "Nettstedsinfo",
    type: "document",
    icon: CogIcon,
    fields: [
        defineField({ name: "homeTitle", title: "Forsidetittel", type: "string" }),
        defineField({
            name: "homeDescription",
            title: "Forsidebeskrivelse",
            type: "text",
        }),
        defineField({ name: "eventsTitle", title: "Arrangementtittel", type: "string" }),
        defineField({
            name: "eventsDescription",
            title: "Arrangementbeskrivelse",
            type: "text",
        }),
    ],
    preview: {
        select: { title: "homeTitle" },
        prepare({ title }) {
            return { title: title ?? "Nettstedsinfo" }
        },
    },
})

export const eventsPage = defineType({
    name: "eventsPage",
    title: "Arrangementer-side",
    type: "document",
    icon: DocumentIcon,
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({ name: "title", title: "Tittel", type: "string" }),
        defineField({ name: "description", title: "Beskrivelse", type: "text" }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Arrangementer-side" }
        },
    },
})

export const roomsPage = defineType({
    name: "roomsPage",
    title: "Rom-side",
    type: "document",
    icon: DocumentIcon,
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "description", title: "Beskrivelse", type: "text" }),
        defineField({
            name: "sections",
            title: "Bestillingsinformasjon",
            type: "array",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({
            name: "bookingLink",
            title: "Bestillingslenke",
            type: "sourceLink",
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Rom-side" }
        },
    },
})

export const blifrivilligPage = defineType({
    name: "blifrivilligPage",
    title: "Bli frivillig-side",
    type: "document",
    icon: HeartIcon,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – experimental API not yet in typedefs
    __experimental_actions: ["update", "publish"],
    fields: [
        defineField({
            name: "description",
            title: "Beskrivelse",
            description: "Tekst øverst på siden, over påmeldingsskjemaet",
            type: "portableTextContent",
        }),
        defineField({ name: "title", title: "Sidetittel", type: "string" }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
    ],
    preview: {
        prepare() {
            return { title: "Bli frivillig-side" }
        },
    },
})

export const internbevisBenefit = defineType({
    name: "internbevisBenefit",
    title: "Frivilligfordel",
    type: "document",
    icon: StarIcon,
    fields: [
        defineField({
            name: "name",
            title: "Fordel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "description",
            title: "Kort beskrivelse",
            type: "text",
            rows: 3,
            validation: rule => rule.required().max(220),
        }),
        defineField({
            name: "minimumTier",
            title: "Gyldig fra",
            type: "string",
            options: {
                list: [
                    { title: "Trinn 1 – Brukerorganisasjon (Borg)", value: "trinn1" },
                    { title: "Trinn 2 – Driftsorganisasjon (Dorg)", value: "trinn2" },
                    { title: "Trinn 3 – Arbeidsgruppe (Arg)", value: "trinn3" },
                ],
                layout: "radio",
            },
            validation: rule => rule.required(),
        }),
    ],
    preview: {
        select: { title: "name", minimumTier: "minimumTier" },
        prepare({ title, minimumTier }) {
            const tierLabels: Record<string, string> = {
                trinn1: "Trinn 1",
                trinn2: "Trinn 2",
                trinn3: "Trinn 3",
            }
            return {
                title: title ?? "Fordel",
                subtitle: minimumTier
                    ? `Gyldig fra ${tierLabels[minimumTier]}`
                    : "Gyldig fra mangler",
            }
        },
    },
})

export const groupsPage = defineType({
    name: "groupsPage",
    title: "Grupper-side",
    type: "document",
    icon: UsersIcon,
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "description", title: "Beskrivelse", type: "text" }),
        defineField({
            name: "sections",
            title: "Introduksjon",
            type: "array",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({
            name: "faq",
            title: "FAQ",
            type: "array",
            of: [
                defineArrayMember({
                    name: "faqItem",
                    type: "object",
                    fields: [
                        defineField({
                            name: "question",
                            title: "Spørsmål",
                            type: "string",
                            validation: rule => rule.required(),
                        }),
                        defineField({
                            name: "answer",
                            title: "Svar",
                            type: "array",
                            of: [defineArrayMember({ type: "text" })],
                            validation: rule => rule.required().min(1),
                        }),
                    ],
                    preview: { select: { title: "question" } },
                }),
            ],
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Grupper-side" }
        },
    },
})
