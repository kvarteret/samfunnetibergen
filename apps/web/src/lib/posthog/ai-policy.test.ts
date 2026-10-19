import { afterEach, expect, test, vi } from "vitest"
import {
  configuredLunaDeployment,
  SKONK_DEPLOYMENT,
  shouldCaptureSkonkTelemetry,
} from "./ai-policy"

afterEach(() => vi.unstubAllEnvs())

test("defaults the Azure deployment to Skonk", () => {
  vi.stubEnv("AZURE_OPENAI_LUNA_DEPLOYMENT", "")
  expect(configuredLunaDeployment()).toBe(SKONK_DEPLOYMENT)
})

test("trims the configured Azure deployment", () => {
  vi.stubEnv("AZURE_OPENAI_LUNA_DEPLOYMENT", " skonk ")
  expect(configuredLunaDeployment()).toBe(SKONK_DEPLOYMENT)
})

test.each(["gpt-6.1-sol", "gpt-6-luna", "deepseek-flash", ""])(
  "allows PostHog AI telemetry only for Skonk, not %s",
  deployment => {
    expect(shouldCaptureSkonkTelemetry(deployment)).toBe(false)
  },
)

test("allows PostHog AI telemetry for Skonk", () => {
  expect(shouldCaptureSkonkTelemetry(SKONK_DEPLOYMENT)).toBe(true)
})
