import { defineArrayMember, defineField, defineType } from "sanity"

export const menuItem = defineType({
    name: "menuItem",
    title: "Rett",
    type: "object",
    fields: [
        defineField({
            name: "title",
            title: "Navn",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "description", title: "Beskrivelse", type: "text", rows: 2 }),
        defineField({ name: "price", title: "Pris (kr)", type: "number" }),
    ],
    preview: {
        select: { title: "title", subtitle: "price" },
        prepare({ title, subtitle }) {
            return {
                title: title ?? "Rett",
                subtitle: subtitle != null ? `${subtitle} kr` : undefined,
            }
        },
    },
})

export const menuSection = defineType({
    name: "menuSection",
    title: "Menyseksjon",
    type: "object",
    fields: [
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "fixedPrice",
            title: "Fast pris for hele seksjonen (kr)",
            type: "number",
        }),
        defineField({
            name: "info",
            title: "Tilleggsinformasjon",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "items",
            title: "Retter",
            type: "array",
            of: [defineArrayMember({ type: "menuItem" })],
        }),
    ],
    preview: {
        select: { title: "title", items: "items" },
        prepare({ title, items }) {
            const count = Array.isArray(items) ? items.length : 0
            return { title: title ?? "Seksjon", subtitle: `${count} retter` }
        },
    },
})

export const menuSchema = defineType({
    name: "menu",
    title: "Meny",
    type: "object",
    fields: [
        defineField({
            name: "sections",
            title: "Seksjoner",
            type: "array",
            of: [defineArrayMember({ type: "menuSection" })],
        }),
        defineField({
            name: "allergenNote",
            title: "Allergennotat",
            type: "text",
            rows: 3,
        }),
    ],
})
