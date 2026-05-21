import { DocumentIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const page = defineType({
    name: "page",
    title: "Egendefinert side",
    description:
        "Generisk side med valgfri URL og fritekstinnhold. Bruk dette for innhold som ikke tilhører noen fast side (Arrangementer, Rom, Grupper osv.). Faste sider redigeres i «Faste sider» og kan ikke opprettes eller slettes herfra.",
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
            name: "content",
            title: "Innhold",
            type: "markdown",
            group: "content",
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
