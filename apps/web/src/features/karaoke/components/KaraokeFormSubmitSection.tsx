"use client"

import { useStore } from "@tanstack/react-form"
import { Loader2, Mic, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useKaraokeForm } from "./karaokeFormContext"

export function KaraokeFormSubmitSection({
  submitError,
}: {
  submitError?: string
}) {
  const form = useKaraokeForm()
  const isPending = useStore(form.store, state => state.isSubmitting)

  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {submitError && (
        <Alert variant="destructive">
          <X aria-hidden className="text-destructive" />
          <AlertTitle className="text-destructive">
            Det oppstod en feil
          </AlertTitle>
          <AlertDescription>{String(submitError)}</AlertDescription>
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
            Sender inn...
          </>
        ) : (
          <>
            <Mic aria-hidden />
            Send bookingforespørsel
          </>
        )}
      </Button>
    </section>
  )
}
