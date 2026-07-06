import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": new URL("src/__mocks__/server-only.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
    coverage: {
      include: [
        "src/studio/migrations/nyttigInfo.ts",
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
