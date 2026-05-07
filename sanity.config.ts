import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { dataset, projectId } from "./sanity/env"
import { resolve, resolvePresentationInitialUrl } from "./sanity/presentation/resolve"
import { schemaTypes } from "./sanity/schemaTypes"
import { singletonTypeNames, structure } from "./sanity/structure"

const singletonTypes = new Set<string>(singletonTypeNames)

export default defineConfig({
    projectId,
    dataset,
    basePath: "/studio",
    title: "Samfunnet i Bergen",
    plugins: [
        structureTool({ structure }),
        presentationTool({
            resolve,
            previewUrl: {
                initial: resolvePresentationInitialUrl(),
                previewMode: {
                    enable: "/api/draft-mode/enable",
                },
            },
        }),
        visionTool(),
    ],
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
        types: schemaTypes,
    },
})
