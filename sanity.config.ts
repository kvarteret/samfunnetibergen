import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"

import { dataset, projectId } from "./sanity/env"
import { singletonTypeNames, structure } from "./sanity/structure"

const singletonTypes = new Set<string>(singletonTypeNames)

const groupSection = {
    name: "groupSection",
    title: "Group Section",
    type: "object",
    fields: [
        { name: "titleNb", title: "Title (Norwegian)", type: "string" },
        { name: "titleEn", title: "Title (English)", type: "string" },
        {
            name: "paragraphsNb",
            title: "Paragraphs (Norwegian)",
            type: "array",
            of: [{ type: "string" }],
        },
        {
            name: "paragraphsEn",
            title: "Paragraphs (English)",
            type: "array",
            of: [{ type: "string" }],
        },
    ],
}

const launchGroup = {
    name: "launchGroup",
    title: "Launch Group",
    type: "document",
    fields: [
        {
            name: "slug",
            title: "Slug",
            type: "string",
            validation: (Rule: { required: () => unknown }) => Rule.required(),
        },
        { name: "nameNb", title: "Name (Norwegian)", type: "string" },
        { name: "nameEn", title: "Name (English)", type: "string" },
        { name: "eyebrowNb", title: "Eyebrow (Norwegian)", type: "string" },
        { name: "eyebrowEn", title: "Eyebrow (English)", type: "string" },
        { name: "leadNb", title: "Lead (Norwegian)", type: "text" },
        { name: "leadEn", title: "Lead (English)", type: "text" },
        {
            name: "accordionSections",
            title: "Accordion Sections",
            type: "array",
            of: [{ type: "groupSection" }],
        },
        {
            name: "detailSections",
            title: "Detail Sections",
            type: "array",
            of: [{ type: "groupSection" }],
        },
    ],
    preview: {
        select: { title: "nameNb", subtitle: "slug" },
    },
}

const volunteerGroupSummary = {
    name: "volunteerGroupSummary",
    title: "Volunteer Group Summary",
    type: "document",
    fields: [
        { name: "name", title: "Name", type: "string" },
        { name: "descriptionNb", title: "Description (Norwegian)", type: "text" },
        { name: "descriptionEn", title: "Description (English)", type: "text" },
        { name: "order", title: "Sort Order", type: "number" },
    ],
    preview: {
        select: { title: "name", subtitle: "order" },
    },
}

const homePage = {
    name: "homePage",
    title: "Home Page",
    type: "document",
    fields: [
        { name: "badgeNb", title: "Badge (Norwegian)", type: "string" },
        { name: "badgeEn", title: "Badge (English)", type: "string" },
        { name: "heroDescriptionNb", title: "Hero Description (Norwegian)", type: "text" },
        { name: "heroDescriptionEn", title: "Hero Description (English)", type: "text" },
        { name: "heroDescriptionFusionNb", title: "Fusion Description (Norwegian)", type: "text" },
        { name: "heroDescriptionFusionEn", title: "Fusion Description (English)", type: "text" },
        { name: "eventsLinkNb", title: "Events Link Label (Norwegian)", type: "string" },
        { name: "eventsLinkEn", title: "Events Link Label (English)", type: "string" },
    ],
    preview: {
        select: { title: "badgeNb" },
    },
}

const eventsPage = {
    name: "eventsPage",
    title: "Events Page",
    type: "document",
    fields: [
        { name: "eyebrowNb", title: "Eyebrow (Norwegian)", type: "string" },
        { name: "eyebrowEn", title: "Eyebrow (English)", type: "string" },
        { name: "titleNb", title: "Title (Norwegian)", type: "string" },
        { name: "titleEn", title: "Title (English)", type: "string" },
        { name: "descriptionNb", title: "Description (Norwegian)", type: "text" },
        { name: "descriptionEn", title: "Description (English)", type: "text" },
    ],
    preview: {
        select: { title: "titleNb" },
    },
}

const homeBar = {
    name: "homeBar",
    title: "Home Bar",
    type: "document",
    fields: [
        { name: "nameNb", title: "Name (Norwegian)", type: "string" },
        { name: "nameEn", title: "Name (English)", type: "string" },
        { name: "descriptionNb", title: "Description (Norwegian)", type: "text" },
        { name: "descriptionEn", title: "Description (English)", type: "text" },
        { name: "order", title: "Sort Order", type: "number" },
    ],
    preview: {
        select: { title: "nameNb", subtitle: "order" },
    },
}

export default defineConfig({
    projectId,
    dataset,
    basePath: "/studio",
    title: "Samfunnet i Bergen",
    plugins: [structureTool({ structure }), visionTool()],
    document: {
        newDocumentOptions: (prev, { creationContext }) => {
            if (creationContext.type !== "global") {
                return prev
            }

            return prev.filter(templateItem => !singletonTypes.has(templateItem.templateId))
        },
        actions: (prev, { schemaType }) => {
            if (!singletonTypes.has(schemaType)) {
                return prev
            }

            return prev.filter(
                action =>
                    action.action !== "delete" &&
                    action.action !== "duplicate" &&
                    action.action !== "unpublish",
            )
        },
    },
    schema: {
        types: [groupSection, launchGroup, volunteerGroupSummary, homePage, eventsPage, homeBar],
    },
})
