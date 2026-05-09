import { EnvelopeIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const contactPerson = defineType({
    name: "contactPerson",
    title: "Kontaktperson",
    type: "object",
    fields: [
        defineField({
            name: "name",
            title: "Navn",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "rolle",
            title: "Rolle",
            type: "string",
        }),
        defineField({ name: "email", title: "E-post", type: "string" }),
        defineField({ name: "phone", title: "Telefon", type: "string" }),
        defineField({ name: "image", title: "Bilde", type: "image", options: { hotspot: true } }),
    ],
    preview: {
        select: { title: "name", subtitle: "email" },
    },
})

const contactGroup = defineType({
    name: "contactGroup",
    title: "Kontaktgruppe",
    type: "object",
    fields: [
        defineField({
            name: "title",
            title: "Overskrift",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "persons",
            title: "Kontaktpersoner",
            type: "array",
            of: [defineArrayMember({ type: "contactPerson" })],
        }),
    ],
    preview: {
        select: { title: "title", persons: "persons" },
        prepare({ title, persons }) {
            return { title, subtitle: `${Array.isArray(persons) ? persons.length : 0} person(er)` }
        },
    },
})

export const kontaktPage = defineType({
    name: "kontaktPage",
    title: "Kontaktside",
    type: "document",
    icon: EnvelopeIcon,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – experimental API not yet in typedefs
    __experimental_actions: ["update", "publish"],
    fields: [
        defineField({
            name: "visitAddress",
            title: "Besøksadresse",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "postAddress",
            title: "Postadresse",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "invoiceAddress",
            title: "Fakturaadresse",
            type: "text",
            rows: 4,
        }),
        defineField({
            name: "invoiceEmail",
            title: "Faktura e-post",
            type: "string",
        }),
        defineField({
            name: "ehf",
            title: "EHF / org.nr.",
            type: "string",
        }),
        defineField({
            name: "generalContact",
            title: "Generell kontakt (e-post / tlf)",
            type: "text",
            rows: 2,
        }),
        defineField({
            name: "pressContact",
            title: "Pressekontakt (e-post / tlf)",
            type: "text",
            rows: 2,
        }),
        defineField({
            name: "contactGroups",
            title: "Kontaktgrupper",
            description: "F.eks. Hovedstyret, Administrasjon",
            type: "array",
            of: [defineArrayMember({ type: "contactGroup" })],
        }),
    ],
    preview: {
        prepare() {
            return { title: "Kontaktside" }
        },
    },
})

export const contactPersonSchema = contactPerson
export const contactGroupSchema = contactGroup
