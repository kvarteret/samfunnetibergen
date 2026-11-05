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
            subEvent: [
              {
                "@type": "Event",
                name: "Don Juan 2",
                startDate: "2026-11-16T18:40",
              },
            ],
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

describe("htmlToText safety", () => {
  test("does not decode entities twice", () => {
    expect(htmlToText("<p>&amp;lt;b&amp;gt;</p>")).toBe("&lt;b&gt;")
  })

  test("never leaves a tag-like fragment behind", () => {
    const text = htmlToText("<p><<b>script>alert(1)</p><scr<script>ipt>")
    expect(text).not.toMatch(/<\s*\/?\s*script/i)
    expect(text).not.toContain("<")
  })

  test("keeps encoded angle brackets encoded", () => {
    expect(htmlToText("<p>1 &lt; 2 &amp; 3 &gt; 2</p>")).toBe(
      "1 &lt; 2 & 3 &gt; 2",
    )
  })
})

describe("browsing helpers", () => {
  test("links are absolute, deduplicated and keep their text", async () => {
    const { pageLinks } = await import("./web")
    const links = pageLinks(
      `<nav><a href="/events">Arrangement</a></nav><a href="/article/x">X</a><a href="/article/x"></a><a href="mailto:a@b.no">mail</a><a href="#top">top</a>`,
      "https://www.biff.no/events",
    )
    expect(links).toEqual([
      { text: "Arrangement", url: "https://www.biff.no/events" },
      { text: "X", url: "https://www.biff.no/article/x" },
    ])
  })

  test("page text resolves relative links", () => {
    expect(
      htmlToText(`<a href="/f/film/1">Film</a>`, "https://www.biff.no/events"),
    ).toBe("Film (https://www.biff.no/f/film/1)")
  })

  test("main content skips navigation", async () => {
    const { mainHtml } = await import("./web")
    expect(
      htmlToText(mainHtml("<nav>Meny</nav><main><p>Innhold</p></main>")),
    ).toBe("Innhold")
    expect(htmlToText(mainHtml("<header>Topp</header><p>Innhold</p>"))).toBe(
      "Innhold",
    )
  })

  test("excerpts around a word", async () => {
    const { excerpts } = await import("./web")
    const found = excerpts(
      `${"x ".repeat(500)}Kvarteret ${"y ".repeat(500)}`,
      "kvarteret",
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toContain("Kvarteret")
  })

  test("open_pages opens several pages and caps the count", async () => {
    const { openPages } = await import("./web")
    const fetchFn = vi.fn(async (url: string) =>
      html(`<title>${url}</title><main><p>Side ${url}</p></main>`),
    )
    const urls = Array.from(
      { length: 15 },
      (_, i) => `https://example.com/${i}`,
    )
    const result = await openPages(urls, undefined, fetchFn as never)
    expect(result.pages).toHaveLength(12)
    expect(result.note).toContain("12")
    expect(result.pages[0]).toMatchObject({
      title: "https://example.com/0",
      text: "Side https://example.com/0",
    })
  })

  test("fetch_page pages through long text", async () => {
    const fetchFn = vi.fn(async () => html(`<p>${"a".repeat(30_000)}</p>`))
    const first = await fetchPage("https://example.com/", fetchFn as never)
    expect(first.nextOffset).toBe(20_000)
    const second = await fetchPage("https://example.com/", fetchFn as never, {
      offset: first.nextOffset,
    })
    expect(second.nextOffset).toBeUndefined()
    expect(second.text).toHaveLength(10_000)
  })

  test("near-empty pages are rendered when Browser Rendering is set up", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(html("<div id=app></div>"))
      .mockResolvedValueOnce(
        Response.json({ success: true, result: "# Program\n\nKonsert 20:00" }),
      )
    const page = await fetchPage("https://example.com/", fetchFn as never, {
      browser: { accountId: "a", token: "t" },
    })
    expect(page.rendered).toBe(true)
    expect(page.text).toContain("Konsert")
    expect(fetchFn.mock.calls[1][0]).toContain("/browser-rendering/markdown")
  })
})
