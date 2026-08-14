import { assist } from "@sanity/assist"
import { visionTool } from "@sanity/vision"
import { defineConfig, defineLocaleResourceBundle } from "sanity"
import { presentationTool } from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { markdownSchema } from "sanity-plugin-markdown"
import { internationalizedArray } from "sanity-plugin-internationalized-array"
import { dataset, projectId } from "./src/env"
import { arrangementDocumentActions } from "./src/studio/actions/arrangementDocumentActions"
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
  i18n: {
    bundles: previous => [
      ...previous,
      ...["en-US", "nb-NO"].map(locale =>
        defineLocaleResourceBundle({
          locale,
          namespace: "structure",
          resources: {
            "buttons.action-menu-button.aria-label": "Actions",
            "buttons.action-menu-button.tooltip": "Actions",
          },
        }),
      ),
    ],
  },
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
    internationalizedArray({
      languages: [
        { id: "nb", title: "Norsk" },
        { id: "en", title: "English" },
      ],
      // Keep both public locales visible on every new localized field. The
      // Norwegian value is the canonical source, while English is the required
      // public translation; legacy scalar fields are deprecated separately.
      defaultLanguages: ["nb", "en"],
      fieldTypes: ["string", "text", "portableTextContent"],
      languageFilter: {
        documentTypes: ["groupsPage", "studentGroup"],
      },
    }),
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
        return arrangementDocumentActions(prev)
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

export default config
