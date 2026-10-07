import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface HomeKaraokeBannerProps {
  eyebrow: string
  heading1: string
  heading2: string
  body: string
  cta: string
  facts: { value: string; label: string }[]
}

/**
 * Karaoke in Maos Lille Røde, in the same banner type as "Bli frivillig".
 * The facts are what sets it apart: one room for the whole group, student
 * prices and an 18-year limit with student ID.
 */
export function HomeKaraokeBanner({
  eyebrow,
  heading1,
  heading2,
  body,
  cta,
  facts,
}: HomeKaraokeBannerProps) {
  return (
    <section className="grid gap-10 bg-foreground p-8 text-background shadow-hard-lg sm:p-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        <p className="font-heading text-lg text-background/75">{eyebrow}</p>
        <h2 className="mt-2 font-heading text-5xl leading-none sm:text-7xl">
          {heading1}
          <br />
          <span className="text-primary">{heading2}</span>
        </h2>
        <p className="mt-4 max-w-lg text-lg text-background/75">{body}</p>
        <Button
          className="group mt-6"
          render={<Link href="/karaoke" />}
          size="lg"
        >
          {cta}
          <ArrowRight className="transition-transform duration-base ease-out group-hover:translate-x-1" />
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-6 md:grid-cols-1 md:gap-5 md:text-right">
        {facts.map(fact => (
          <div key={fact.label}>
            <dt className="sr-only">{fact.label}</dt>
            <dd className="font-heading text-3xl leading-none sm:text-5xl">
              {fact.value}
            </dd>
            <dd className="mt-1 text-sm text-background/75">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
