import { describe, expect, test } from "vitest"
import { statsOptions } from "./stats"

describe("statsOptions", () => {
  test("is off without a token", () => {
    expect(statsOptions({ SITE_URL: "https://www.example.no" })).toBeUndefined()
  })

  test("defaults to the website's endpoint", () => {
    expect(
      statsOptions({
        SITE_URL: "https://www.example.no/",
        STATISTICS_MCP_TOKEN: " secret ",
      }),
    ).toEqual({
      url: "https://www.example.no/api/mcp/statistikk",
      token: "secret",
    })
  })

  test("an explicit URL wins", () => {
    expect(
      statsOptions({
        SITE_URL: "https://www.example.no",
        STATISTICS_MCP_URL: "http://localhost:3000/api/mcp/statistikk",
        STATISTICS_MCP_TOKEN: "t",
      })?.url,
    ).toBe("http://localhost:3000/api/mcp/statistikk")
  })
})
