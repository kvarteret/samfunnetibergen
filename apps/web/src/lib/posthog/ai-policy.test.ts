import { afterEach, expect, test, vi } from "vitest"
import {
  configuredLunaDeployment,
  MIME_DEPLOYMENT,
  shouldCaptureMimeTelemetry,
} from "./ai-policy"

afterEach(() => vi.unstubAllEnvs())

test("defaults the Azure deployment to Mime", () => {
  vi.stubEnv("AZURE_OPENAI_LUNA_DEPLOYMENT", "")
  expect(configuredLunaDeployment()).toBe(MIME_DEPLOYMENT)
})

test("trims the configured Azure deployment", () => {
  vi.stubEnv("AZURE_OPENAI_LUNA_DEPLOYMENT", " skonk ")
  expect(configuredLunaDeployment()).toBe(MIME_DEPLOYMENT)
})

test.each(["gpt-6.1-sol", "gpt-6-luna", "deepseek-flash", ""])(
  "allows PostHog AI telemetry only for Mime, not %s",
  deployment => {
    expect(shouldCaptureMimeTelemetry(deployment)).toBe(false)
  },
)

test("allows PostHog AI telemetry for Mime", () => {
  expect(shouldCaptureMimeTelemetry(MIME_DEPLOYMENT)).toBe(true)
})
