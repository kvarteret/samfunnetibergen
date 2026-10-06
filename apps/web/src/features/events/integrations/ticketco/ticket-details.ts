import { load } from "cheerio"

export type TicketDetails = {
  priceOrdinar: string
  priceStudent: string
  priceMedlem: string
  facebookUrls: string[]
}

function amount(value: string): string {
  const match = /(?:NOK|kr)\s*([\d\s]+[,.]\d{2}|\d+)/i.exec(value)
  return match
    ? String(Number(match[1].replace(/\s/g, "").replace(",", ".")))
    : ""
}

export function facebookEventUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (
      ![
        "facebook.com",
        "www.facebook.com",
        "m.facebook.com",
        "web.facebook.com",
      ].includes(url.hostname) ||
      !/^\/events\/\d+\/?$/.test(url.pathname)
    )
      return null
    return `https://www.facebook.com${url.pathname.replace(/\/$/, "")}/`
  } catch {
    return null
  }
}

export function ticketDetails(html: string): TicketDetails {
  const $ = load(html)
  const prices: Record<string, number[]> = {
    priceOrdinar: [],
    priceStudent: [],
    priceMedlem: [],
  }
  $('[id^="item_type_"]').each((_, el) => {
    const card = $(el)
    if (!card.find(".t-icon-entry_ticket").length) return
    const label = card.find(".tc-tickets--item-title").first().text().trim()
    const tooltip = card
      .find(".tc-tickets--item-tooltip a[title]")
      .attr("title")
    const detail = tooltip ? load(tooltip).root().text() : ""
    const value = amount(
      detail.match(/Pris\s*((?:NOK|kr)\s*[\d\s.,]+)/i)?.[1] ??
        card.find(".tc-tickets--item-price").first().text(),
    )
    if (!value) return
    const field = /student/i.test(label)
      ? "priceStudent"
      : /medlem|member/i.test(label)
        ? "priceMedlem"
        : /ordin|standard|regular|adult|voksen|billett|ticket|inngang/i.test(
              label,
            )
          ? "priceOrdinar"
          : null
    if (field) prices[field].push(Number(value))
  })
  const facebookUrls = new Set<string>()
  $("a[href]").each((_, el) => {
    const url = facebookEventUrl($(el).attr("href") ?? "")
    if (url) facebookUrls.add(url)
  })
  for (const match of html.matchAll(
    /https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/events\/\d+\/?/g,
  )) {
    const url = facebookEventUrl(match[0])
    if (url) facebookUrls.add(url)
  }
  return {
    priceOrdinar: prices.priceOrdinar.length
      ? String(Math.min(...prices.priceOrdinar))
      : "",
    priceStudent: prices.priceStudent.length
      ? String(Math.min(...prices.priceStudent))
      : "",
    priceMedlem: prices.priceMedlem.length
      ? String(Math.min(...prices.priceMedlem))
      : "",
    facebookUrls: [...facebookUrls],
  }
}
