import { assist } from "@sanity/assist"
import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { markdownSchema } from "sanity-plugin-markdown"
import { dataset, projectId } from "./src/env"
import { arrangementApprovalActions } from "./src/studio/actions/approvalActions"
import { CreateFestivalDayAction } from "./src/studio/actions/createFestivalDayAction"
import { singletonTypeNames } from "./src/studio/documentTypes"
import {
  resolve,
  resolvePresentationInitialUrl,
  resolvePresentationOrigins,
} from "./src/studio/presentation/resolve"
import { schemaTypes } from "./src/studio/schemaTypes"
import { structure } from "./src/studio/structure"
import { festivalDayInitialValue } from "./src/studio/templates/arrangementTemplates"

const singletonTypes = new Set<string>(singletonTypeNames)

const config = defineConfig({
  projectId,
  dataset,
  basePath: "/",
  title: "Samfunnet i Bergen",
  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      allowOrigins: resolvePresentationOrigins(),
      previewUrl: {
        initial: resolvePresentationInitialUrl(),
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
    }),
    visionTool(),
    markdownSchema(),
    assist(),
  ],
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type !== "global") {
        return prev
      }
      return prev.filter(
        templateItem =>
          !singletonTypes.has(templateItem.templateId) &&
          templateItem.templateId !== "festival-day",
      )
    },
    actions: (prev, { schemaType }) => {
      if (schemaType === "arrangement") {
        const core = prev.filter(
          action => !["duplicate", "unpublish"].includes(action.action ?? ""),
        )
        return [...arrangementApprovalActions, CreateFestivalDayAction, ...core]
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
    templates: previous => [
      ...previous.filter(template => template.schemaType !== "arrangement"),
      {
        id: "arrangement",
        title: "Nytt arrangement",
        schemaType: "arrangement",
        value: {
          eventKind: "single",
          approvalStatus: "approved",
          eventStatus: "scheduled",
          isRecurring: false,
          isPromoted: false,
        },
      },
      {
        id: "festival",
        title: "Ny festival",
        schemaType: "arrangement",
        value: {
          eventKind: "festivalParent",
          approvalStatus: "approved",
          eventStatus: "scheduled",
          isPromoted: false,
        },
      },
      {
        id: "festival-day",
        title: "Ny festivaldag",
        schemaType: "arrangement",
        parameters: [{ name: "parentId", title: "Festival", type: "string" }],
        value: ({ parentId }: { parentId: string }) =>
          festivalDayInitialValue(parentId),
      },
    ],
  },
})

// The website keeps this adapter only during the external-host cutover. The
// standalone Studio is rooted at `/`; the temporary embedded route needs its
// historical `/studio` base path to keep old links working until then.
export const embeddedConfig = { ...config, basePath: "/studio" }
export default config
