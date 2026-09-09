import { expect, it } from "vitest"
import { normalizeBrowserLog } from "./browser-logs"
it("structures console strings without dropping session or trace context", () => {
  const result = normalizeBrowserLog({
    body: JSON.stringify("<SanityLive> is attempting to reconnect"),
    attributes: { sessionId: "session" },
  })
  expect(result.body).toBe("sanity.live.connection")
  expect(result.attributes).toMatchObject({
    sessionId: "session",
    "connection.state": "reconnecting",
  })
  expect(result.trace_id).toBeUndefined()
})
it("redacts sensitive values", () => {
  expect(
    normalizeBrowserLog({
      body: "/apply/secret?email=person@example.com Bearer token",
    }).body,
  ).not.toMatch(/person@example.com|secret|Bearer token/)
})
