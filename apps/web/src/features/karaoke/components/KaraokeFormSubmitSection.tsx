"use client"

import { useStore } from "@tanstack/react-form"
import { Loader2, Mic, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  INVALID_PAYLOAD_ERROR,
  RATE_LIMIT_ERROR,
  STALE_DEPLOYMENT_ERROR,
} from "@/lib/submission-messages"
import { useKaraokeForm } from "./karaokeFormContext"

export function KaraokeFormSubmitSection({
  submitError,
}: {
  submitError?: string
}) {
  const t = useTranslations("Karaoke")

  const form = useKaraokeForm()
  const isPending = useStore(form.store, state => state.isSubmitting)

  const errorKey =
    submitError === RATE_LIMIT_ERROR
      ? "rateLimit"
      : submitError === INVALID_PAYLOAD_ERROR
        ? "invalidPayload"
        : submitError === STALE_DEPLOYMENT_ERROR
          ? "staleDeployment"
          : submitError === "Valgt tidspunkt er ikke tilgjengelig for booking."
            ? "slotUnavailable"
            : submitError ===
                "Valgt tidsrom overlapper en eksisterende booking. Velg et annet tidspunkt."
              ? "slotConflict"
              : "submitFailure"

  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {submitError && (
        <Alert variant="destructive">
          <X aria-hidden className="text-destructive" />
          <AlertTitle className="text-destructive">
            {t("errorTitle")}
          </AlertTitle>
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full sm:w-auto"
        disabled={isPending}
        size="lg"
        type="submit"
      >
        {isPending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            <Mic aria-hidden />
            {t("submit")}
          </>
        )}
      </Button>
    </section>
  )
}
