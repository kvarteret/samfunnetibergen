import {
    CogIcon,
    DocumentIcon,
    HeartIcon,
    ImageIcon,
    LinkIcon,
    StarIcon,
    UsersIcon,
} from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const siteMetadata = defineType({
    name: "siteMetadata",
    title: "Nettstedsinfo",
    type: "document",
    icon: CogIcon,
    groups: [
        { name: "identity", title: "Identitet", default: true },
        { name: "sharing", title: "Deling og oEmbed" },
    ],
    fields: [
        defineField({
            name: "siteName",
            title: "Nettstedsnavn",
            type: "string",
            group: "identity",
            initialValue: "Samfunnet i Bergen",
        }),
        defineField({
            name: "defaultSeoTitle",
            title: "Standard SEO-tittel",
            type: "string",
            group: "identity",
        }),
        defineField({
            name: "defaultSeoDescription",
            title: "Standard SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "identity",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
        defineField({
            name: "defaultOpenGraphImage",
            title: "Standard Open Graph-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
        defineField({
            name: "defaultOpenGraphTitle",
            title: "Standard Open Graph-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "defaultOpenGraphDescription",
            title: "Standard Open Graph-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
            validation: rule => rule.max(200).warning("Hold teksten kort for deling"),
        }),
        defineField({
            name: "oembedTitle",
            title: "oEmbed-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "oembedDescription",
            title: "oEmbed-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
        }),
        defineField({
            name: "oembedImage",
            title: "oEmbed-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
    ],
    preview: {
        select: { title: "siteName" },
        prepare({ title }) {
            return { title: title ?? "Nettstedsinfo" }
        },
    },
})

export const homePage = defineType({
    name: "homePage",
    title: "Hovedside",
    type: "document",
    icon: DocumentIcon,
    groups: [
        { name: "hero", title: "Hero", default: true },
        { name: "seo", title: "SEO" },
        { name: "sharing", title: "Deling og oEmbed" },
    ],
    fields: [
        defineField({
            name: "eyebrow",
            title: "Eyebrow",
            type: "string",
            group: "hero",
        }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "hero",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            type: "text",
            rows: 4,
            group: "hero",
        }),
        defineField({
            name: "primaryCta",
            title: "Primærknapp",
            type: "sourceLink",
            group: "hero",
        }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer sidetittelen i søkemotorer.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
        defineField({
            name: "openGraphImage",
            title: "Open Graph-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
        defineField({
            name: "openGraphTitle",
            title: "Open Graph-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "openGraphDescription",
            title: "Open Graph-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
            validation: rule => rule.max(200).warning("Hold teksten kort for deling"),
        }),
        defineField({
            name: "oembedTitle",
            title: "oEmbed-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "oembedDescription",
            title: "oEmbed-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
        }),
        defineField({
            name: "oembedImage",
            title: "oEmbed-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Hovedside" }
        },
    },
})

export const eventsPage = defineType({
    name: "eventsPage",
    title: "Arrangementer-side",
    type: "document",
    icon: DocumentIcon,
    groups: [
        { name: "content", title: "Innhold", default: true },
        { name: "seo", title: "SEO" },
        { name: "sharing", title: "Deling og oEmbed" },
    ],
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({ name: "title", title: "Tittel", type: "string" }),
        defineField({ name: "description", title: "Beskrivelse", type: "text" }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
        defineField({
            name: "openGraphImage",
            title: "Open Graph-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
        defineField({
            name: "openGraphTitle",
            title: "Open Graph-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "openGraphDescription",
            title: "Open Graph-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
            validation: rule => rule.max(200).warning("Hold teksten kort for deling"),
        }),
        defineField({
            name: "oembedTitle",
            title: "oEmbed-tittel",
            type: "string",
            group: "sharing",
        }),
        defineField({
            name: "oembedDescription",
            title: "oEmbed-beskrivelse",
            type: "text",
            rows: 3,
            group: "sharing",
        }),
        defineField({
            name: "oembedImage",
            title: "oEmbed-bilde",
            type: "image",
            group: "sharing",
            options: { hotspot: true },
        }),
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
    groups: [
        { name: "hero", title: "Hero", default: true },
        { name: "booking", title: "Bestilling" },
        { name: "floorPlans", title: "Plantegninger" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "hero",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            type: "text",
            rows: 4,
            group: "hero",
        }),
        defineField({
            name: "sections",
            title: "Bestillingsinformasjon",
            description: "Kort, praktisk informasjon som vises som kort under rom-heroen.",
            type: "array",
            group: "booking",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({
            name: "bookingLink",
            title: "Bestillingslenke",
            type: "sourceLink",
            group: "booking",
        }),
        defineField({
            name: "floorPlans",
            title: "Plantegninger",
            description: "SVG-plantegninger som vises på romsider basert på rommets etasje.",
            type: "array",
            group: "floorPlans",
            of: [
                defineArrayMember({
                    name: "floorPlan",
                    title: "Plantegning",
                    type: "object",
                    icon: ImageIcon,
                    fields: [
                        defineField({
                            name: "floor",
                            title: "Etasje",
                            type: "number",
                            validation: rule => rule.required(),
                        }),
                        defineField({
                            name: "title",
                            title: "Tittel",
                            type: "string",
                        }),
                        defineField({
                            name: "file",
                            title: "SVG-fil",
                            type: "file",
                            options: {
                                accept: "image/svg+xml",
                            },
                            validation: rule => rule.required(),
                        }),
                    ],
                    preview: {
                        select: { floor: "floor", title: "title" },
                        prepare({ floor, title }) {
                            return {
                                title: title ?? (floor ? `${floor}. etasje` : "Plantegning"),
                            }
                        },
                    },
                }),
            ],
        }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Rom-side" }
        },
    },
})

export const sponsorsPage = defineType({
    name: "sponsorsPage",
    title: "Sponsorer-side",
    type: "document",
    icon: StarIcon,
    groups: [
        { name: "hero", title: "Hero", default: true },
        { name: "sponsors", title: "Sponsorer" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "hero",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            type: "text",
            rows: 4,
            group: "hero",
        }),
        defineField({
            name: "sponsors",
            title: "Sponsorer",
            type: "array",
            group: "sponsors",
            of: [
                defineArrayMember({
                    name: "sponsor",
                    title: "Sponsor",
                    type: "object",
                    fields: [
                        defineField({
                            name: "logo",
                            title: "Logo",
                            type: "image",
                            options: { hotspot: true },
                        }),
                        defineField({
                            name: "title",
                            title: "Tittel",
                            type: "string",
                            validation: rule => rule.required(),
                        }),
                        defineField({
                            name: "description",
                            title: "Beskrivelse",
                            type: "portableTextContent",
                        }),
                        defineField({
                            name: "website",
                            title: "Nettsted",
                            type: "url",
                            validation: rule => rule.uri({ scheme: ["http", "https"] }),
                        }),
                    ],
                    preview: {
                        select: { title: "title", media: "logo" },
                    },
                }),
            ],
        }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title ?? "Sponsorer-side" }
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
    groups: [
        { name: "content", title: "Innhold", default: true },
        { name: "recruitment", title: "Rekruttering" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({
            name: "description",
            title: "Beskrivelse",
            description: "Tekst øverst på siden, over påmeldingsskjemaet",
            type: "portableTextContent",
        }),
        defineField({ name: "title", title: "Sidetittel", type: "string" }),
        defineField({
            name: "recruitingGroups",
            title: "Grupper som rekrutterer",
            description:
                "Velg og sorter gruppene som skal vises på bli frivillig-siden. Rekrutteringsteksten redigeres på selve gruppen.",
            type: "array",
            group: "recruitment",
            of: [
                defineArrayMember({
                    type: "reference",
                    to: [{ type: "studentGroup" }],
                    options: {
                        filter: "category == 'arbeidsgruppe'",
                    },
                }),
            ],
        }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
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
    groups: [
        { name: "hero", title: "Hero", default: true },
        { name: "intro", title: "Introduksjon" },
        { name: "faq", title: "FAQ" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "hero",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            type: "text",
            rows: 4,
            group: "hero",
        }),
        defineField({
            name: "sections",
            title: "Introduksjon",
            description: "Valgfrie tekstseksjoner som vises over gruppelisten.",
            type: "array",
            group: "intro",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({
            name: "seoTitle",
            title: "SEO-tittel",
            description: "Overstyrer tittelen i søkemotorer. La stå tom for å bruke sidetittelen.",
            type: "string",
            group: "seo",
        }),
        defineField({
            name: "seoDescription",
            title: "SEO-beskrivelse",
            type: "text",
            rows: 3,
            group: "seo",
            validation: rule => rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
        }),
        defineField({
            name: "faq",
            title: "FAQ",
            type: "array",
            group: "faq",
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

export const linkInBio = defineType({
    name: "linkInBio",
    title: "Link-i-bio",
    type: "document",
    icon: LinkIcon,
    fields: [
        defineField({
            name: "heading",
            title: "Overskrift",
            type: "string",
            description: "Vises øverst på siden, f.eks. «Kvarteret»",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "bio",
            title: "Bio-tekst",
            type: "text",
            rows: 2,
            description: "Kort tekst under overskriften (valgfri)",
        }),
        defineField({
            name: "links",
            title: "Lenker",
            type: "array",
            of: [
                defineArrayMember({
                    type: "object",
                    fields: [
                        defineField({
                            name: "link",
                            title: "Lenke",
                            type: "sourceLink",
                            validation: rule => rule.required(),
                        }),
                        defineField({
                            name: "emoji",
                            title: "Emoji (valgfri)",
                            type: "string",
                            description: "Vises foran lenketeksten",
                        }),
                        defineField({
                            name: "highlight",
                            title: "Fremhev",
                            type: "boolean",
                            description: "Gjør knappen mer fremtredende",
                            initialValue: false,
                        }),
                    ],
                    preview: {
                        select: {
                            title: "link.label",
                            subtitle: "link.internalPage.title",
                            href: "link.internalPath",
                            externalUrl: "link.externalUrl",
                            emoji: "emoji",
                        },
                        prepare({ title, subtitle, href, externalUrl, emoji }) {
                            return {
                                title: emoji ? `${emoji}  ${title}` : title,
                                subtitle: subtitle ?? href ?? externalUrl,
                            }
                        },
                    },
                }),
            ],
        }),
    ],
    preview: {
        select: { title: "heading" },
        prepare({ title }) {
            return { title: title ?? "Link-i-bio" }
        },
    },
})
