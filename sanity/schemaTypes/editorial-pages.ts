import {
    DocumentIcon,
    DocumentTextIcon,
    HelpCircleIcon,
    ImageIcon,
    LinkIcon,
    UsersIcon,
} from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const sourceLink = defineType({
    name: "sourceLink",
    title: "Source Link",
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
            name: "url",
            title: "URL",
            type: "url",
            validation: rule => rule.required().uri({ scheme: ["http", "https", "mailto"] }),
        }),
    ],
    preview: {
        select: { title: "label", subtitle: "url" },
    },
})

const editorialSection = defineType({
    name: "editorialSection",
    title: "Editorial Section",
    type: "object",
    icon: DocumentTextIcon,
    fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({
            name: "paragraphs",
            title: "Paragraphs",
            type: "array",
            of: [defineArrayMember({ type: "text" })],
            validation: rule => rule.required().min(1),
        }),
        defineField({
            name: "links",
            title: "Links",
            type: "array",
            of: [defineArrayMember({ type: "sourceLink" })],
        }),
    ],
    preview: {
        select: { title: "title", paragraphs: "paragraphs" },
        prepare({ title, paragraphs }) {
            return { title: title || paragraphs?.[0] || "Editorial section" }
        },
    },
})

const sourcedImage = defineType({
    name: "sourcedImage",
    title: "Sourced Image",
    type: "object",
    icon: ImageIcon,
    fields: [
        defineField({
            name: "image",
            title: "Sanity Image",
            type: "image",
            options: { hotspot: true },
        }),
        defineField({ name: "sourceUrl", title: "Source Image URL", type: "url" }),
        defineField({
            name: "alt",
            title: "Alt Text",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
    ],
    validation: rule =>
        rule.custom(value => {
            if (!value?.image && !value?.sourceUrl) {
                return "Add a Sanity image or a source image URL."
            }

            return true
        }),
    preview: {
        select: { title: "alt", subtitle: "sourceUrl", media: "image" },
    },
})

const faqItem = defineType({
    name: "faqItem",
    title: "FAQ Item",
    type: "object",
    icon: HelpCircleIcon,
    fields: [
        defineField({
            name: "question",
            title: "Question",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "answer",
            title: "Answer",
            type: "array",
            of: [defineArrayMember({ type: "text" })],
            validation: rule => rule.required().min(1),
        }),
    ],
    preview: {
        select: { title: "question" },
    },
})

const roomsPage = defineType({
    name: "roomsPage",
    title: "Rooms Page",
    type: "document",
    icon: DocumentIcon,
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "description", title: "Description", type: "text" }),
        defineField({
            name: "sections",
            title: "Booking Information",
            type: "array",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({ name: "bookingLink", title: "Booking Link", type: "sourceLink" }),
    ],
    preview: {
        select: { title: "title", subtitle: "description" },
    },
})

const room = defineType({
    name: "room",
    title: "Room",
    type: "document",
    icon: DocumentTextIcon,
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "title" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "summary",
            title: "Summary",
            type: "text",
            validation: rule => rule.required(),
        }),
        defineField({ name: "capacity", title: "Capacity", type: "string" }),
        defineField({
            name: "suitedPurposes",
            title: "Suited Purposes",
            type: "array",
            of: [defineArrayMember({ type: "string" })],
        }),
        defineField({ name: "floor", title: "Floor", type: "string" }),
        defineField({
            name: "sections",
            title: "Room Information",
            type: "array",
            of: [defineArrayMember({ type: "editorialSection" })],
            validation: rule => rule.required().min(1),
        }),
        defineField({
            name: "images",
            title: "Images",
            type: "array",
            of: [defineArrayMember({ type: "sourcedImage" })],
        }),
        defineField({
            name: "sourceUrl",
            title: "Source URL",
            type: "url",
            validation: rule => rule.required().uri({ scheme: ["https"] }),
        }),
        defineField({
            name: "order",
            title: "Sort Order",
            type: "number",
            validation: rule => rule.required(),
        }),
    ],
    preview: {
        select: { title: "title", subtitle: "capacity", media: "images.0.image" },
    },
})

const groupsPage = defineType({
    name: "groupsPage",
    title: "Groups Page",
    type: "document",
    icon: UsersIcon,
    fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({ name: "description", title: "Description", type: "text" }),
        defineField({
            name: "sections",
            title: "Intro Sections",
            type: "array",
            of: [defineArrayMember({ type: "editorialSection" })],
        }),
        defineField({
            name: "faq",
            title: "FAQ",
            type: "array",
            of: [defineArrayMember({ type: "faqItem" })],
        }),
    ],
    preview: {
        select: { title: "title", subtitle: "description" },
    },
})

const studentGroup = defineType({
    name: "studentGroup",
    title: "Student Group",
    type: "document",
    icon: UsersIcon,
    fields: [
        defineField({
            name: "name",
            title: "Name",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "name" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "summary",
            title: "Summary",
            type: "text",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "body",
            title: "Body",
            type: "array",
            of: [defineArrayMember({ type: "text" })],
            validation: rule => rule.required().min(1),
        }),
        defineField({ name: "email", title: "Email", type: "email" }),
        defineField({
            name: "category",
            title: "Category",
            type: "string",
            options: {
                list: [
                    { title: "Arbeidsgruppe", value: "arbeidsgruppe" },
                    { title: "Komité", value: "komitee" },
                ],
                layout: "radio",
            },
        }),
        defineField({ name: "image", title: "Image", type: "sourcedImage" }),
        defineField({ name: "sourceUrl", title: "Source URL", type: "url" }),
        defineField({ name: "sourceNote", title: "Source Note", type: "string" }),
        defineField({
            name: "order",
            title: "Sort Order",
            type: "number",
            validation: rule => rule.required(),
        }),
    ],
    preview: {
        select: { title: "name", subtitle: "email", media: "image.image" },
    },
})

export const editorialPageSchemaTypes = [
    sourceLink,
    editorialSection,
    sourcedImage,
    faqItem,
    roomsPage,
    room,
    groupsPage,
    studentGroup,
]
