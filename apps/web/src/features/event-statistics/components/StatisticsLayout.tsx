import { BarChart3, LogIn } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { selectionControlVariants } from "@/components/ui/selection-control"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
  FREMHEVET_DEFINITION,
  STATISTICS_PERIODS,
  type StatisticsPeriod,
} from "../domain/statistics"
import { personalLoginUrl, type StatisticsAccess } from "../server/access"

const numberFormatter = new Intl.NumberFormat("nb-NO")

/* Display type follows the infoskjerm: Fraunces, tight tracking, sentence case. */
export const displayHeading =
  "font-heading [font-family:var(--font-display)] leading-[1.04] tracking-[-0.045em] text-foreground"
export const accentText = "text-primary"
export const surface = "rounded-base bg-card shadow-shadow"

/** The notice to show instead of statistics, or `null` when access is granted. */
export function AccessNotice({ access }: { access: StatisticsAccess }) {
  switch (access.status) {
    case "granted":
      return null
    case "login-required":
      return (
        <Notice
          title="Logg inn for å se statistikken."
          action={
            <Button
              className="w-fit"
              render={<a href={personalLoginUrl()} />}
              size="lg"
            >
              <LogIn aria-hidden="true" />
              Logg inn med Kvarteret Personal
            </Button>
          }
        >
          Statistikken er for admin og gruppeadmin. Logg inn med app-brukeren
          din i Kvarteret Personal, så sendes du tilbake hit.
        </Notice>
      )
    case "forbidden":
      return (
        <Notice title="Her har du ikke tilgang ennå.">
          Kontoen din har ikke admin- eller gruppeadmin-tilgang. Ta kontakt med
          en admin i Kvarteret Personal hvis du trenger statistikk for gruppen
          din.
        </Notice>
      )
    default:
      return <UnavailableNotice />
  }
}

export function UnavailableNotice() {
  return (
    <Notice title="Statistikken tar en pause.">
      Vi får ikke hentet tallene akkurat nå. Prøv igjen om litt.
    </Notice>
  )
}

export function PeriodNav({
  basePath,
  period,
}: {
  basePath: string
  period: StatisticsPeriod
}) {
  return (
    <nav aria-label="Periode" className="flex flex-wrap gap-2">
      {STATISTICS_PERIODS.map(option => (
        <Link
          key={option}
          href={`${basePath}?periode=${option}`}
          aria-current={option === period ? "page" : undefined}
          className={cn(
            selectionControlVariants({ selected: option === period }),
            "rounded-full px-5",
          )}
        >
          {option} dager
        </Link>
      ))}
    </nav>
  )
}

export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <h2 id={id} className={cn(displayHeading, "text-3xl sm:text-4xl")}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Notice({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="flex max-w-3xl flex-col gap-8 py-12 sm:py-20">
      <span className="grid size-14 place-items-center rounded-full bg-secondary-50 text-primary">
        <BarChart3 aria-hidden="true" className="size-7" />
      </span>
      <h1 className={cn(displayHeading, "text-5xl sm:text-6xl")}>{title}</h1>
      <p className="text-xl leading-8 text-foreground-muted">{children}</p>
      {action}
    </section>
  )
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
      {children}
    </div>
  )
}

export function Kpi({
  label,
  caption,
  value,
  text,
  featured = false,
}: {
  label: string
  /** What is counted, in a short sentence. */
  caption?: string
  value?: number
  text?: string
  featured?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-base p-5 sm:p-6",
        featured ? "bg-secondary-100" : "bg-card shadow-shadow",
      )}
    >
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={cn(
          displayHeading,
          "text-4xl sm:text-5xl [font-variant-numeric:lining-nums_tabular-nums]",
        )}
      >
        {text ?? numberFormatter.format(value ?? 0)}
      </span>
      {caption && (
        <span className="-mt-3 text-sm leading-snug text-foreground-muted">
          {caption}
        </span>
      )}
    </div>
  )
}

export function Panel({
  title,
  caption,
  children,
}: {
  title: ReactNode
  /** What the chart shows, in a short sentence. */
  caption?: string
  children: ReactNode
}) {
  return (
    <div className={cn(surface, "flex min-w-0 flex-col gap-5 p-5 sm:p-7")}>
      <div className="flex flex-col gap-1.5">
        <h3 className={cn(displayHeading, "text-2xl tracking-[-0.03em]")}>
          {title}
        </h3>
        {caption && (
          <p className="text-sm leading-snug text-foreground-muted">
            {caption}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-base bg-secondary-50 px-6 py-12 text-center text-lg text-foreground-muted">
      {children}
    </p>
  )
}

export function FremhevetDefinition() {
  return (
    <p className="max-w-3xl text-sm leading-6 text-foreground-muted">
      <span className="font-heading text-foreground">Fremhevet: </span>
      {FREMHEVET_DEFINITION}
    </p>
  )
}
