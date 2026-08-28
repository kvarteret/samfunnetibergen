"use client"

import { useParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import posthog from "posthog-js"
import { useEffect } from "react"
import {
  isExceptionFeedbackPath,
  requestExceptionFeedback,
} from "@/lib/posthog/exception-feedback"
import { isBrowserDomMutationError } from "@/lib/posthog/browser-dom-mutation"

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
  const t = useTranslations("Error")

  useEffect(() => {
    if (isBrowserDomMutationError(error)) {
      try {
        posthog.capture("browser_dom_mutation_error", {
          browser_dom_mutation: true,
          digest: error.digest,
          error_name: error.name,
          locale: params.locale,
          source: "app-router-error-boundary",
        })
      } catch {
        // Browser error telemetry must never block the recovery UI.
      }
      return
    }

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
        <p className="font-mono text-sm uppercase text-red-700">{t("label")}</p>
        <h1 className="text-balance font-serif text-4xl font-bold text-neutral-950 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg leading-8 text-neutral-700">
          {t("description")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 py-3 font-mono text-sm font-medium uppercase text-white transition hover:bg-transparent hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      >
        {t("retry")}
      </button>
    </section>
  )
}
