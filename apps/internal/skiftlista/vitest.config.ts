import { defineConfig } from "vitest/config"

// Unit tests cover the framework-free core (src/core). The UI is covered by
// the browser tests in e2e/ (npm run test:e2e).
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
