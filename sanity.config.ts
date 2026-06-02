import "./src/studio/i18n/patchRRuleNorwegian"
import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { markdownSchema } from "sanity-plugin-markdown"
import { recurringDates } from "sanity-plugin-recurring-dates"
import { dataset, projectId } from "./src/lib/sanity/env"
import { ApproveAction, RejectAction } from "./src/studio/actions/approvalActions"
import { resolve, resolvePresentationInitialUrl } from "./src/studio/presentation/resolve"
import { schemaTypes } from "./src/studio/schemaTypes"
import { singletonTypeNames, structure } from "./src/studio/structure"

const singletonTypes = new Set<string>(singletonTypeNames)

export default defineConfig({
    projectId,
    dataset,
    basePath: "/studio",
    title: "Samfunnet i Bergen",
    plugins: [
        structureTool({ structure }),
        recurringDates(),
        presentationTool({
            resolve,
            previewUrl: {
                initial: resolvePresentationInitialUrl(),
            },
        }),
        visionTool(),
        markdownSchema(),
    ],
    document: {
        newDocumentOptions: (prev, { creationContext }) => {
            if (creationContext.type !== "global") {
                return prev
            }
            return prev.filter(templateItem => !singletonTypes.has(templateItem.templateId))
        },
        actions: (prev, { schemaType }) => {
            if (schemaType === "arrangement") {
                const core = prev.filter(
                    action => !["duplicate", "unpublish"].includes(action.action ?? ""),
                )
                return [ApproveAction, RejectAction, ...core]
            }
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
