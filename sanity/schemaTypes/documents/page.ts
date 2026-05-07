import { DocumentIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const page = defineType({
    name: "page",
    title: "Side",
    type: "document",
    icon: DocumentIcon,
    groups: [
        { name: "content", title: "Innhold", default: true },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "content",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "URL-slug",
            type: "slug",
            group: "content",
            options: { source: "title" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "pageBuilder",
            title: "Sidebygger",
            type: "array",
            group: "content",
            of: [
                defineArrayMember({ type: "heroBlock" }),
                defineArrayMember({ type: "richTextBlock" }),
                defineArrayMember({ type: "imageBlock" }),
                defineArrayMember({ type: "calloutBlock" }),
            ],
            options: {
                insertMenu: {
                    groups: [
                        {
                            name: "text",
                            title: "Tekst",
                            of: ["richTextBlock", "calloutBlock"],
                        },
                        {
                            name: "media",
                            title: "Media",
                            of: ["imageBlock"],
                        },
                        {
                            name: "layout",
                            title: "Layout",
                            of: ["heroBlock"],
                        },
                    ],
                },
            },
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
        select: { title: "title", slug: "slug.current" },
        prepare({ title, slug }) {
            return {
                title: title ?? "Side",
                subtitle: slug ? `/${slug}` : "Mangler slug",
            }
        },
    },
})
