import { defineCliConfig } from "sanity/cli"

import { dataset, projectId } from "./src/env"

const studioTypegen = process.env.SANITY_TYPEGEN_TARGET === "studio"

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  project: {
    basePath: "/",
  },
  deployment: {
    appId: "r7kax3ojhq4892odvrwpjt93",
  },
  server: {
    port: 3333,
  },
  schemaExtraction: {
    enabled: true,
    path: "../../.sanity/schema.json",
  },
  typegen: {
    path: studioTypegen
      ? "./src/studio/**/*.{ts,tsx,js,jsx}"
      : "../../apps/web/src/lib/sanity/{queries,fragments}/**/*.{ts,tsx,js,jsx}",
    schema: "../../.sanity/schema.json",
    generates: studioTypegen
      ? "./src/studio/sanity.types.ts"
      : "../../apps/web/src/lib/sanity/sanity.types.ts",
    overloadClientMethods: true,
  },
  // `lexorank` (used by @sanity/orderable-document-list) ships
  // TypeScript-compiled CommonJS whose barrel entry uses
  // `Object.defineProperty(exports, ...)` and `__exportStar(require(...))`.
  // The CLI's schema-extraction worker runs the studio config through a Vite
  // SSR module runner that inlines dependencies, and its CommonJS detector does
  // not recognise that shape, so evaluating the module throws
  // `ReferenceError: exports is not defined` and both `sanity schema extract`
  // and `sanity build` fail. Loading it as an external Node module keeps the
  // CommonJS semantics intact.
  vite: {
    ssr: {
      external: ["lexorank"],
    },
  },
})
