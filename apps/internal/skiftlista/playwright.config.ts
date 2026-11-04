import { defineConfig, devices } from "@playwright/test"

// Browser tests for the leader app. They use only roles, visible text and the
// `data-slot` attribute, so the same tests run against any implementation of
// the UI (they were written against the React prototype and kept unchanged
// for the Svelte port).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3190",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "laptop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 860 },
      },
      testIgnore: "narrow.spec.ts",
    },
    // Below 80rem the place panel opens in a sheet; these tests need a phone.
    {
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
      testMatch: "narrow.spec.ts",
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3190",
    reuseExistingServer: true,
  },
})
