/** @vitest-environment jsdom */

import { NextIntlClientProvider } from "next-intl"
import type { AnchorHTMLAttributes, ReactNode } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import type { NavItem } from "@/lib/sanity/fetch"
import messages from "@/messages/nb.json"
import { MobileMenu } from "./MobileMenu"

vi.mock("next/link", () => ({
  default: ({ href, ...props }: LinkProps) => <a href={href} {...props} />,
}))

vi.mock("./BrandLogo", () => ({
  BrandLogo: ({ className }: { className?: string }) => (
    <span className={className} data-testid="brand-logo" />
  ),
}))

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode
  href: string
}

vi.mock("./LanguageSwitcher", () => ({
  LanguageSwitcher: ({ onNavigate }: { onNavigate?: () => void }) => (
    // The test double only needs a native anchor to exercise the close callback.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/en" onClick={onNavigate}>
      EN
    </a>
  ),
}))

const items: NavItem[] = [
  {
    _key: "static-volunteer",
    label: "Bli frivillig",
    href: "/grupper",
    externalUrl: null,
    children: [],
  },
  {
    _key: "static-booking",
    label: "Booking",
    href: null,
    externalUrl: null,
    children: [
      {
        _key: "booking-links",
        groupLabel: null,
        items: [
          {
            _key: "all-rooms",
            label: "Alle rom",
            href: "/rom",
            externalUrl: null,
          },
          {
            _key: "karaoke",
            label: "Karaoke",
            href: "/karaoke",
            externalUrl: null,
          },
        ],
      },
    ],
  },
  {
    _key: "static-more",
    label: "Mer",
    href: null,
    externalUrl: null,
    children: [
      {
        _key: "more-links",
        groupLabel: null,
        items: [
          {
            _key: "contact",
            label: "Kontakt",
            href: "/kontakt",
            externalUrl: null,
          },
        ],
      },
    ],
  },
]

describe("MobileMenu", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(async () => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)

    await act(async () => {
      root.render(
        <NextIntlClientProvider locale="nb" messages={messages}>
          <MobileMenu items={items} />
        </NextIntlClientProvider>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    document.body.innerHTML = ""
  })

  function menuTrigger() {
    return document.querySelector<HTMLButtonElement>(
      'button[aria-label="Åpne meny"]',
    )
  }

  function nav() {
    return document.querySelector<HTMLElement>(
      'nav[aria-label="Mobilnavigasjon"]',
    )
  }

  function groupTrigger(label: string) {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    ).find(button => button.textContent?.includes(label))
  }

  async function openMenu() {
    const trigger = menuTrigger()
    if (!trigger) throw new Error("Menu trigger not found")
    await act(async () => trigger.click())
  }

  async function clickButton(button: HTMLButtonElement | null | undefined) {
    if (!button) throw new Error("Button not found")
    await act(async () => button.click())
  }

  test("keeps nested settings inside Mer and resets all disclosures on reopen", async () => {
    await openMenu()

    const bookingTrigger = groupTrigger("Booking")
    await clickButton(bookingTrigger)
    expect(bookingTrigger?.getAttribute("aria-expanded")).toBe("true")

    const moreTrigger = groupTrigger("Mer")
    await clickButton(moreTrigger)
    expect(bookingTrigger?.getAttribute("aria-expanded")).toBe("false")

    const morePanelId = moreTrigger?.getAttribute("aria-controls")
    const morePanel = morePanelId ? document.getElementById(morePanelId) : null
    const settingsTrigger = groupTrigger("Enda mer")
    expect(morePanel).not.toBeNull()
    expect(settingsTrigger).not.toBeUndefined()
    expect(morePanel?.contains(settingsTrigger ?? null)).toBe(true)

    await clickButton(settingsTrigger)
    expect(document.body.textContent).toContain("Velg papir")

    const closeTrigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Lukk meny"]',
    )
    await clickButton(closeTrigger)
    expect(nav()).toBeNull()

    await openMenu()
    expect(groupTrigger("Mer")?.getAttribute("aria-expanded")).toBe("false")
    expect(groupTrigger("Enda mer")).toBeUndefined()
  })

  test("closes when an internal navigation link is activated", async () => {
    await openMenu()
    await clickButton(groupTrigger("Booking"))

    const allRooms = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a"),
    ).find(anchor => anchor.textContent?.includes("Alle rom"))
    if (!allRooms) throw new Error("All rooms link not found")

    allRooms.addEventListener("click", event => event.preventDefault(), {
      once: true,
    })
    await act(async () => allRooms.click())
    expect(nav()).toBeNull()
  })
})
