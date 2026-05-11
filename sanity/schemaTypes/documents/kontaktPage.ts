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
    // This document is both the /kontakt page and the canonical source of
    // organisation-wide contact data (consumed by footer, etc.).
    title: "Kontakt og organisasjon",
    type: "document",
    icon: EnvelopeIcon,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – experimental API not yet in typedefs
    __experimental_actions: ["update", "publish"],
    groups: [
        { name: "org", title: "Organisasjon", default: true },
        { name: "page", title: "Kontaktside" },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({
            name: "visitAddress",
            title: "Besøksadresse",
            type: "text",
            rows: 3,
            group: "org",
        }),
        defineField({
            name: "postAddress",
            title: "Postadresse",
            type: "text",
            rows: 3,
            group: "org",
        }),
        defineField({
            name: "invoiceAddress",
            title: "Fakturaadresse",
            type: "text",
            rows: 4,
            group: "org",
        }),
        defineField({
            name: "invoiceEmail",
            title: "Faktura e-post",
            type: "string",
            group: "org",
        }),
        defineField({
            name: "ehf",
            title: "EHF / org.nr.",
            type: "string",
            group: "org",
        }),
        defineField({
            name: "generalContact",
            title: "Generell kontakt (e-post / tlf)",
            type: "text",
            rows: 2,
            group: "org",
        }),
        defineField({
            name: "pressContact",
            title: "Pressekontakt (e-post / tlf)",
            type: "text",
            rows: 2,
            group: "org",
        }),
        defineField({
            name: "contactGroups",
            title: "Kontaktgrupper",
            description: "F.eks. Hovedstyret, Administrasjon — vises på kontaktsiden",
            type: "array",
            of: [defineArrayMember({ type: "contactGroup" })],
            group: "page",
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
            return { title: "Kontakt og organisasjon" }
        },
    },
})

export const contactPersonSchema = contactPerson
export const contactGroupSchema = contactGroup
