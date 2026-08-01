import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": new URL("./src/__mocks__/server-only.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
  },
})
