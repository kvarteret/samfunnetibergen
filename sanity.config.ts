import "./sanity/i18n/patchRRuleNorwegian"
import { dashboardTool } from "@sanity/dashboard"
import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { recurringDates } from "sanity-plugin-recurring-dates"
import { ApproveAction, RejectAction } from "./sanity/actions/approvalActions"
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
        dashboardTool(),
        structureTool({ structure }),
        recurringDates(),
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
