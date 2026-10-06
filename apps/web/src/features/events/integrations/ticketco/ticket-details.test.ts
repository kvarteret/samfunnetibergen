import { expect, test } from "vitest"
import { pageText } from "./source"
import { facebookEventUrl, ticketDetails } from "./ticket-details"

test("reads admission prices from inside purchase forms and excludes fees and merchandise", () => {
  const html = `<body><form><div id="item_type_1"><i class="t-icon-entry_ticket"></i><div class="tc-tickets--item-title">STUDENT</div><div class="tc-tickets--item-price">NOK 110,00</div><div class="tc-tickets--item-tooltip"><a title="Pris NOK 100,00 Avgift NOK 10,00 Totalt NOK 110,00"></a></div></div><div id="item_type_2"><i class="t-icon-entry_ticket"></i><div class="tc-tickets--item-title">ORDINÆR</div><div class="tc-tickets--item-price">NOK 150,00</div></div><div id="item_type_3"><div class="tc-tickets--item-title">Ticket T-shirt</div><div class="tc-tickets--item-price">NOK 300,00</div></div></form><a href="https://facebook.com/events/12345/?ref=share">Event</a></body>`
  expect(ticketDetails(html)).toEqual({
    isSoldOut: false,
    priceOrdinar: "150",
    priceStudent: "100",
    priceMedlem: "",
    facebookUrls: ["https://www.facebook.com/events/12345/"],
  })
  expect(pageText(html)).toContain("STUDENT")
  expect(pageText(html)).toContain("NOK 110,00")
})

test("accepts Facebook event links only", () => {
  expect(facebookEventUrl("https://www.facebook.com/artist")).toBeNull()
  expect(
    facebookEventUrl("https://facebook.com.evil.test/events/12345/"),
  ).toBeNull()
})

test("detects explicit sold-out availability without treating missing prices as sold out", () => {
  expect(
    ticketDetails("<body>Det er ingen flere billetter tilgjengelig</body>"),
  ).toMatchObject({ isSoldOut: true, priceOrdinar: "" })
  expect(ticketDetails("<body>Utsolgt</body>").isSoldOut).toBe(true)
  expect(ticketDetails("<body>No information</body>").isSoldOut).toBe(false)
})
