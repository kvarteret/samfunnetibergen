import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { HouseHoursContent, SiteLogoContent } from "@/lib/sanity/fetch"
import { BrandLogo } from "./BrandLogo"
import { DesktopNav } from "./DesktopNav"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { MobileMenu } from "./MobileMenu"
import { NavbarOpenStatus } from "./NavbarOpenStatus"
import { NavbarScrollShell } from "./NavbarScrollShell"
import { buildNavigation } from "./navigation-items"

export function Navbar({
  houseHours,
  logo,
  initialNow,
  vergeordningHref,
}: {
  houseHours?: HouseHoursContent | null
  logo?: SiteLogoContent | null
  initialNow: string
  vergeordningHref?: string | null
}) {
  const t = useTranslations("Navigation")
  const items = buildNavigation(t, vergeordningHref ?? null)

  return (
    <NavbarScrollShell>
      <nav
        aria-label={t("ariaLabel")}
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 px-6 transition-[padding] duration-300 ease-out sm:px-10 lg:px-14"
      >
        <Link
          aria-label="Samfunnet i Bergen"
          className="block py-4 transition-[padding,opacity] duration-300 ease-out hover:opacity-75 focus-brutal group-data-[scrolled=true]/nav:py-2.5"
          href="/"
        >
          <BrandLogo
            className="h-12 w-auto transition-[height] duration-300 ease-out group-data-[scrolled=true]/nav:h-8 sm:h-[3.75rem] sm:group-data-[scrolled=true]/nav:h-10"
            logo={logo}
          />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <DesktopNav items={items} />
          <LanguageSwitcher />
          <MobileMenu items={items} logo={logo} />
        </div>

        {/* The opening status always owns the second row so it never competes
            with the navigation items for space. At the top of the page it is
            shown; once scrolled it transitions away in step with the navbar
            (300ms ease-out), leaving a single-row navbar. */}
        <div className="grid w-full grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out group-data-[scrolled=true]/nav:grid-rows-[0fr] group-data-[scrolled=true]/nav:opacity-0">
          <div className="min-h-0 overflow-clip [overflow-clip-margin:4px]">
            <NavbarOpenStatus
              closedDates={houseHours?.houseClosedDates}
              initialNow={initialNow}
              openingHours={houseHours?.openingHours}
              vacationMode={houseHours?.vacationMode}
            />
          </div>
        </div>
      </nav>
    </NavbarScrollShell>
  )
}
