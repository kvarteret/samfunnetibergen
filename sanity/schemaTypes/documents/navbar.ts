import { LinkIcon, MenuIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const navItem = defineType({
    name: "navItem",
    title: "Navigasjonselement",
    type: "object",
    icon: LinkIcon,
    fields: [
        defineField({
            name: "label",
            title: "Tekst",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "href",
            title: "Intern lenke",
            description: "Bruk intern slug, f.eks. /om-oss eller /rom",
            type: "string",
        }),
        defineField({
            name: "externalUrl",
            title: "Ekstern URL",
            description: "Kun om lenken peker til et eksternt nettsted",
            type: "url",
            hidden: ({ parent }) => Boolean(parent?.href),
        }),
        defineField({
            name: "children",
            title: "Undermenyer",
            type: "array",
            of: [
                defineArrayMember({
                    name: "navGroup",
                    title: "Undermenygruppe",
                    type: "object",
                    fields: [
                        defineField({
                            name: "groupLabel",
                            title: "Gruppeoverskrift",
                            description: "Valgfri overskrift for gruppen (vises i dropdown)",
                            type: "string",
                        }),
                        defineField({
                            name: "items",
                            title: "Lenker",
                            type: "array",
                            of: [
                                defineArrayMember({
                                    name: "navLeaf",
                                    title: "Lenke",
                                    type: "object",
                                    icon: LinkIcon,
                                    fields: [
                                        defineField({
                                            name: "label",
                                            title: "Tekst",
                                            type: "string",
                                            validation: rule => rule.required(),
                                        }),
                                        defineField({
                                            name: "href",
                                            title: "Intern lenke",
                                            type: "string",
                                        }),
                                        defineField({
                                            name: "externalUrl",
                                            title: "Ekstern URL",
                                            type: "url",
                                            hidden: ({ parent }) => Boolean(parent?.href),
                                        }),
                                    ],
                                    preview: {
                                        select: { title: "label", subtitle: "href" },
                                    },
                                }),
                            ],
                            validation: rule => rule.required().min(1),
                        }),
                    ],
                    preview: {
                        select: { title: "groupLabel", items: "items" },
                        prepare({ title, items }) {
                            const count = items?.length ?? 0
                            return { title: title || "Gruppe", subtitle: `${count} lenker` }
                        },
                    },
                }),
            ],
        }),
    ],
    preview: {
        select: { title: "label", subtitle: "href", children: "children" },
        prepare({ title, subtitle, children }) {
            const hasDropdown = (children?.length ?? 0) > 0
            return {
                title: title ?? "Element",
                subtitle: hasDropdown ? "Dropdown" : (subtitle ?? "Lenke"),
            }
        },
    },
})

export const navbar = defineType({
    name: "navbar",
    title: "Navigasjon",
    type: "document",
    icon: MenuIcon,
    fields: [
        defineField({
            name: "items",
            title: "Navigasjonselementer",
            type: "array",
            of: [defineArrayMember({ type: "navItem" })],
            validation: rule => rule.required().min(1),
        }),
    ],
    preview: {
        select: { items: "items" },
        prepare({ items }) {
            const count = items?.length ?? 0
            return { title: "Navigasjon", subtitle: `${count} toppnivåelementer` }
        },
    },
})

export const navItemSchema = navItem
