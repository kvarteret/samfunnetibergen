import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"
import { expect, it, vi } from "vitest"
import { config } from "@/proxy"

vi.mock("next-intl/middleware", () => ({ default: () => vi.fn() }))

it("serves the exact infoskjerm URL without locale negotiation", () => {
  expect(
    unstable_doesMiddlewareMatch({
      config,
      nextConfig: {},
      url: "/infoskjerm",
    }),
  ).toBe(false)
  expect(
    unstable_doesMiddlewareMatch({
      config,
      nextConfig: {},
      url: "/arrangementer",
    }),
  ).toBe(true)
})
