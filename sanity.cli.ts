import { defineCliConfig } from "sanity/cli"

import { dataset, projectId } from "./src/lib/sanity/env"

const studioTypegen = process.env.SANITY_TYPEGEN_TARGET === "studio"

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  project: {
    basePath: "/studio",
  },
  server: {
    port: 3333,
  },
  schemaExtraction: {
    enabled: true,
    path: ".sanity/schema.json",
  },
  typegen: {
    path: studioTypegen
      ? "./src/studio/**/*.{ts,tsx,js,jsx}"
      : "./src/lib/sanity/{queries,fragments}/**/*.{ts,tsx,js,jsx}",
    schema: ".sanity/schema.json",
    generates: studioTypegen
      ? "./src/studio/sanity.types.ts"
      : "./src/lib/sanity/sanity.types.ts",
    overloadClientMethods: true,
  },
})
