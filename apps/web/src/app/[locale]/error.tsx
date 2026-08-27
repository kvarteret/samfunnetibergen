"use client"

import { useParams, usePathname } from "next/navigation"
import posthog from "posthog-js"
import { useEffect } from "react"
import {
  isExceptionFeedbackPath,
  requestExceptionFeedback,
} from "@/lib/posthog/exception-feedback"

type LocaleErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function LocaleError({
  error,
  unstable_retry,
}: LocaleErrorProps) {
  const params = useParams<{ locale?: string }>()
  const pathname = usePathname()

  useEffect(() => {
    posthog.captureException(error, {
      source: "app-router-error-boundary",
      locale: params.locale,
      digest: error.digest,
      handled: true,
    })
    if (isExceptionFeedbackPath(pathname)) {
      requestExceptionFeedback("route_error", pathname)
    }
  }, [error, params.locale, pathname])

  return (
    <section className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-start justify-center gap-6">
      <div className="space-y-3">
        <p className="font-mono text-sm uppercase text-red-700">
          Noe gikk galt
        </p>
        <h1 className="text-balance font-serif text-4xl font-bold text-neutral-950 sm:text-5xl">
          Vi klarte ikke å vise denne siden.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-neutral-700">
          Prøv igjen. Hvis feilen fortsetter, har vi fått beskjed og kan se på
          det.
        </p>
      </div>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 py-3 font-mono text-sm font-medium uppercase text-white transition hover:bg-transparent hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      >
        Prøv igjen
      </button>
    </section>
  )
}
