import { LinkIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

const internalPathPattern = /^\/(?!\/)/

export const sourceLink = defineType({
    name: "sourceLink",
    title: "Link",
    type: "object",
    icon: LinkIcon,
    fields: [
        defineField({
            name: "label",
            title: "Label",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            type: "string",
            name: "linkType",
            title: "Lenketype",
            initialValue: "internalPage",
            options: {
                layout: "radio",
                list: [
                    { title: "Side i Sanity", value: "internalPage" },
                    { title: "Intern app-sti", value: "internalPath" },
                    { title: "Ekstern URL", value: "external" },
                ],
            },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "internalPage",
            title: "Side",
            type: "reference",
            to: [{ type: "page" }],
            hidden: ({ parent }) => parent?.linkType !== "internalPage",
            validation: rule =>
                rule.custom((value, context) => {
                    const parent = context.parent as { linkType?: string } | undefined
                    if (parent?.linkType === "internalPage" && !value?._ref) {
                        return "Velg en side"
                    }
                    return true
                }),
        }),
        defineField({
            name: "internalPath",
            title: "Intern app-sti",
            type: "string",
            description: "Brukes bare for faste ruter som ikke er en Sanity-side, f.eks. /rom",
            hidden: ({ parent }) => parent?.linkType !== "internalPath",
            validation: rule =>
                rule.custom((value, context) => {
                    const parent = context.parent as { linkType?: string } | undefined
                    if (parent?.linkType !== "internalPath") return true
                    if (!value) return "Skriv inn en intern sti"
                    if (internalPathPattern.test(value)) return true
                    return "Bruk en intern sti som starter med /"
                }),
        }),
        defineField({
            name: "externalUrl",
            title: "Ekstern URL",
            type: "url",
            hidden: ({ parent }) => parent?.linkType !== "external",
            validation: rule => rule.uri({ scheme: ["http", "https", "mailto"] }),
        }),
        defineField({
            name: "url",
            title: "Gammel URL",
            type: "string",
            hidden: true,
            readOnly: true,
        }),
    ],
    validation: rule =>
        rule.custom(value => {
            if (!value) return true
            if (value.linkType === "external" && !value.externalUrl) {
                return "Skriv inn en ekstern URL"
            }
            return true
        }),
    preview: {
        select: {
            title: "label",
            linkType: "linkType",
            pageTitle: "internalPage.title",
            pageSlug: "internalPage.slug.current",
            internalPath: "internalPath",
            externalUrl: "externalUrl",
            legacyUrl: "url",
        },
        prepare({ title, linkType, pageTitle, pageSlug, internalPath, externalUrl, legacyUrl }) {
            let subtitle = legacyUrl ?? "Mangler lenke"
            if (linkType === "internalPage") {
                subtitle = pageSlug ? `/${pageSlug}` : (pageTitle ?? "Velg side")
            } else if (linkType === "internalPath") {
                subtitle = internalPath ?? "Mangler intern sti"
            } else if (linkType === "external") {
                subtitle = externalUrl ?? "Mangler ekstern URL"
            }

            return {
                title,
                subtitle,
            }
        },
    },
})
