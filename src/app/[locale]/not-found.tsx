import { ArrowLeft, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function NotFound() {
  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden py-12 sm:py-20">
      <div
        aria-hidden
        className="absolute -right-16 top-1/2 -z-10 -translate-y-1/2 rotate-6 font-heading text-[16rem] leading-none text-primary/20 sm:text-[24rem] lg:text-[32rem]"
      >
        404
      </div>

      <div className="w-full max-w-3xl">
        <p className="mb-4 font-mono text-sm font-medium uppercase tracking-[0.22em] text-foreground-muted">
          Feilkode 404
        </p>
        <h1 className="max-w-2xl font-heading text-6xl leading-[0.9] text-foreground sm:text-8xl">
          Her var det visst tomt.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-foreground-muted sm:text-xl">
          Siden du leter etter finnes ikke, eller den kan ha blitt flyttet. Vi
          hjelper deg gjerne videre.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button render={<Link href="/" />} size="lg">
            <ArrowLeft aria-hidden />
            Til forsiden
          </Button>
          <Button
            render={<Link href="/arrangementer" />}
            size="lg"
            variant="neutral"
          >
            <CalendarDays aria-hidden />
            Se arrangementer
          </Button>
        </div>
      </div>
    </section>
  )
}
