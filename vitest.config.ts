import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      include: [
        "src/studio/migrations/sanityDefaults.ts",
        "src/studio/presentation/routing.ts",
        "src/studio/schemaTypes/objects/sourceLinkDestination.ts",
        "src/studio/schemaTypes/shared/metadataFields.ts",
      ],
      provider: "v8",
      reporter: ["text"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
})
