import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface HomeGrupperBannerProps {
  eyebrow?: string
  heading1: string
  heading2: string
  body: string
  cta: string
}

export function HomeGrupperBanner({
  eyebrow,
  heading1,
  heading2,
  body,
  cta,
}: HomeGrupperBannerProps) {
  return (
    <section className="bg-primary p-8 text-primary-foreground shadow-hard-lg sm:p-12">
      {eyebrow && (
        <p className="font-heading text-lg text-primary-foreground/75">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-heading text-5xl leading-none sm:text-7xl">
        {heading1}
        <br />
        {heading2}
      </h2>
      <p className="mt-4 max-w-lg text-lg text-primary-foreground/75">{body}</p>
      <Button
        className="group mt-6"
        render={<Link href="/bli-frivillig" />}
        size="lg"
        variant="neutral"
      >
        {cta}
        <ArrowRight className="transition-transform duration-base ease-out group-hover:translate-x-1" />
      </Button>
    </section>
  )
}
