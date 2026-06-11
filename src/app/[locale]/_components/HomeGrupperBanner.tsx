import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface HomeGrupperBannerProps {
  eyebrow: string
  heading1: string
  heading2: string
  body: string
  cta: string
  linkLabel: string
}

export function HomeGrupperBanner({
  eyebrow,
  heading1,
  heading2,
  body,
  cta,
  linkLabel,
}: HomeGrupperBannerProps) {
  return (
    <section className="border-2 border-border bg-primary p-8 text-primary-foreground shadow-hard-lg sm:p-12">
      <p className="text-eyebrow text-primary-foreground/75">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-4xl uppercase leading-none sm:text-6xl">
        {heading1}
        <br />
        {heading2}
      </h2>
      <p className="mt-4 max-w-lg text-lg text-primary-foreground/75">{body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button asChild size="lg" variant="neutral">
          <Link href="/grupper">{cta}</Link>
        </Button>
        <Link
          className="text-eyebrow underline underline-offset-4 focus-brutal"
          href="/grupper#skjema"
        >
          {linkLabel}
        </Link>
      </div>
    </section>
  )
}
