import { describe, expect, test, vi } from "vitest"
import { checkUrl, fetchPage, htmlToText } from "./web"

describe("checkUrl", () => {
  test("accepts public https pages", () => {
    expect(checkUrl("https://example.com/a?b=1").hostname).toBe("example.com")
  })

  test.each([
    "http://example.com",
    "https://localhost/x",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://10.0.0.5/",
    "https://intranet/",
    "https://printer.local/",
    "https://user:pw@example.com/",
    "https://example.com:8443/",
    "ftp://example.com",
    "not a url",
  ])("refuses %s", url => {
    expect(() => checkUrl(url)).toThrow()
  })
})

describe("htmlToText", () => {
  test("drops scripts and keeps link targets", () => {
    const text = htmlToText(
      `<head><title>x</title></head><script>evil()</script><p>Hei <a href="https://a.no/b">billetter</a></p><p>To</p>`,
    )
    expect(text).toContain("billetter (https://a.no/b)")
    expect(text).not.toContain("evil")
    expect(text.split("\n")).toHaveLength(2)
  })
})

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, { headers: { "content-type": "text/html" }, ...init })

describe("fetchPage", () => {
  test("returns page text", async () => {
    const fetchFn = vi.fn(async () => html("<p>Vill Vill Vest</p>"))
    const page = await fetchPage("https://example.com/", fetchFn as never)
    expect(page).toMatchObject({ status: 200, text: "Vill Vill Vest" })
  })

  test("re-checks every redirect hop", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://127.0.0.1/admin" },
        }),
    )
    await expect(
      fetchPage("https://example.com/", fetchFn as never),
    ).rejects.toThrow()
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test("follows a safe redirect", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: "/next" } }),
      )
      .mockResolvedValueOnce(html("ok"))
    const page = await fetchPage("https://example.com/", fetchFn as never)
    expect(page.url).toBe("https://example.com/next")
  })

  test("does not read non-text content", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response("bin", { headers: { "content-type": "image/png" } }),
    )
    const page = await fetchPage("https://example.com/x.png", fetchFn as never)
    expect(page.text).toContain("Ikke tekstinnhold")
  })

  test("truncates long pages", async () => {
    const fetchFn = vi.fn(async () => html(`<p>${"a".repeat(50_000)}</p>`))
    const page = await fetchPage("https://example.com/", fetchFn as never)
    expect(page.text.length).toBeLessThan(20_100)
    expect(page.text).toContain("avkortet")
  })
})

describe("eventsFromHtml", () => {
  const page = (json: unknown) =>
    `<html><script type="application/ld+json">${JSON.stringify(json)}</script></html>`

  test("reads events from a graph and from subEvents", async () => {
    const { eventsFromHtml } = await import("./web")
    const events = eventsFromHtml(
      page({
        "@graph": [
          { "@type": "Organization", name: "x" },
          {
            "@type": "TheaterEvent",
            name: "Don Juan",
            startDate: "2026-11-14T18:40",
            location: { name: "Kvarteret" },
            subEvent: [{ "@type": "Event", name: "Don Juan 2", startDate: "2026-11-16T18:40" }],
          },
        ],
      }),
    )
    expect(events.map(event => event.name)).toEqual(["Don Juan", "Don Juan 2"])
    expect(events[0].location).toBe("Kvarteret")
  })

  test("ignores broken blocks", async () => {
    const { eventsFromHtml } = await import("./web")
    expect(
      eventsFromHtml(`<script type="application/ld+json">{oops</script>`),
    ).toEqual([])
  })
})
