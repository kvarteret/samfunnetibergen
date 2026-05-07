import { CogIcon, DocumentIcon, HeartIcon, HomeIcon, StarIcon, UsersIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const siteMetadata = defineType({
    name: "siteMetadata",
    title: "Nettstedsinfo",
    type: "document",
    icon: CogIcon,
    fields: [
        defineField({ name: "siteTitleNb", title: "Nettstedstittel (norsk)", type: "string" }),
        defineField({ name: "siteTitleEn", title: "Nettstedstittel (engelsk)", type: "string" }),
        defineField({
            name: "siteDescriptionNb",
            title: "Nettstedsbeskrivelse (norsk)",
            type: "text",
        }),
        defineField({
            name: "siteDescriptionEn",
            title: "Nettstedsbeskrivelse (engelsk)",
            type: "text",
        }),
        defineField({ name: "homeTitleNb", title: "Forsidetittel (norsk)", type: "string" }),
        defineField({ name: "homeTitleEn", title: "Forsidetittel (engelsk)", type: "string" }),
        defineField({
            name: "homeDescriptionNb",
            title: "Forsidebeskrivelse (norsk)",
            type: "text",
        }),
        defineField({
            name: "homeDescriptionEn",
            title: "Forsidebeskrivelse (engelsk)",
            type: "text",
        }),
        defineField({ name: "eventsTitleNb", title: "Arrangementtittel (norsk)", type: "string" }),
        defineField({
            name: "eventsTitleEn",
            title: "Arrangementtittel (engelsk)",
            type: "string",
        }),
        defineField({
            name: "eventsDescriptionNb",
            title: "Arrangementbeskrivelse (norsk)",
            type: "text",
        }),
        defineField({
            name: "eventsDescriptionEn",
            title: "Arrangementbeskrivelse (engelsk)",
            type: "text",
        }),
        defineField({
            name: "volunteerSignupTitleNb",
            title: "Frivilligside-tittel (norsk)",
            type: "string",
        }),
        defineField({
            name: "volunteerSignupTitleEn",
            title: "Volunteer page title (engelsk)",
            type: "string",
        }),
        defineField({
            name: "volunteerSignupDescriptionNb",
            title: "Frivilligside-beskrivelse (norsk)",
            type: "text",
        }),
        defineField({
            name: "volunteerSignupDescriptionEn",
            title: "Volunteer page description (engelsk)",
            type: "text",
        }),
        defineField({
            name: "groupPageTitleNb",
            title: "Grupperstittel (norsk)",
            type: "string",
        }),
        defineField({
            name: "groupPageTitleEn",
            title: "Grupperstittel (engelsk)",
            type: "string",
        }),
        defineField({
            name: "groupPageDescriptionNb",
            title: "Grupperbeskrivelse (norsk)",
            type: "text",
        }),
        defineField({
            name: "groupPageDescriptionEn",
            title: "Grupperbeskrivelse (engelsk)",
            type: "text",
        }),
    ],
    preview: {
        select: { title: "siteTitleNb" },
        prepare({ title }) {
            return { title: title ?? "Nettstedsinfo" }
        },
    },
})

export const homePage = defineType({
    name: "homePage",
    title: "Forside",
    type: "document",
    icon: HomeIcon,
    fields: [
        defineField({ name: "badgeNb", title: "Badge (norsk)", type: "string" }),
        defineField({ name: "badgeEn", title: "Badge (engelsk)", type: "string" }),
        defineField({
            name: "heroDescriptionNb",
            title: "Hero-ingress (norsk)",
            type: "text",
        }),
        defineField({
            name: "heroDescriptionEn",
            title: "Hero-ingress (engelsk)",
            type: "text",
        }),
        defineField({
            name: "heroDescriptionFusionNb",
            title: "Fusion-ingress (norsk)",
            type: "text",
        }),
        defineField({
            name: "heroDescriptionFusionEn",
            title: "Fusion-ingress (engelsk)",
            type: "text",
        }),
        defineField({
            name: "eventsLinkNb",
            title: "Arrangementer-lenketekst (norsk)",
            type: "string",
        }),
        defineField({
            name: "eventsLinkEn",
            title: "Arrangementer-lenketekst (engelsk)",
            type: "string",
        }),
    ],
    preview: {
        select: { title: "badgeNb" },
        prepare({ title }) {
            return { title: title ?? "Forside" }
        },
    },
})

export const eventsPage = defineType({
    name: "eventsPage",
    title: "Arrangementer-side",
    type: "document",
    icon: DocumentIcon,
    fields: [
        defineField({ name: "eyebrowNb", title: "Eyebrow (norsk)", type: "string" }),
        defineField({ name: "eyebrowEn", title: "Eyebrow (engelsk)", type: "string" }),
        defineField({ name: "titleNb", title: "Tittel (norsk)", type: "string" }),
        defineField({ name: "titleEn", title: "Tittel (engelsk)", type: "string" }),
        defineField({ name: "descriptionNb", title: "Beskrivelse (norsk)", type: "text" }),
        defineField({ name: "descriptionEn", title: "Beskrivelse (engelsk)", type: "text" }),
    ],
    preview: {
        select: { title: "titleNb" },
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
        defineField({ name: "titleNb", title: "Sidetittel (norsk)", type: "string" }),
        defineField({ name: "titleEn", title: "Page title (English)", type: "string" }),
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
            name: "tier",
            title: "Trinn",
            description: "Hvilket frivilligtrinn denne fordelen gjelder for",
            type: "string",
            options: {
                list: [
                    { title: "Trinn 1 – Arbeidsgruppe (Arg)", value: "trinn1" },
                    { title: "Trinn 2 – Driftsorganisasjon (Dorg)", value: "trinn2" },
                    { title: "Trinn 3 – Brukerorganisasjon (Borg)", value: "trinn3" },
                ],
                layout: "radio",
            },
            validation: rule => rule.required(),
        }),
    ],
    preview: {
        select: { title: "name", subtitle: "tier" },
        prepare({ title, subtitle }) {
            const tierLabels: Record<string, string> = {
                trinn1: "Trinn 1",
                trinn2: "Trinn 2",
                trinn3: "Trinn 3",
            }
            return {
                title: title ?? "Fordel",
                subtitle: tierLabels[subtitle] ?? subtitle,
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
