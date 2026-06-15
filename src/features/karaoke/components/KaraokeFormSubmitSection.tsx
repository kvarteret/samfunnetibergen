"use client"

import { useStore } from "@tanstack/react-form"
import { Loader2, Mic, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { KaraokeBookingResult } from "../actions/submit-karaoke-booking"
import { useKaraokeForm } from "./karaokeFormContext"

export function KaraokeFormSubmitSection() {
  const form = useKaraokeForm()
  const isPending = useStore(form.store, state => state.isSubmitting)
  const submitError = useStore(form.store, state => state.errorMap.onSubmit)

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

export function KaraokeBookingSuccess({ result }: { result: KaraokeBookingResult | null }) {
  return (
    <Alert className="max-w-2xl p-8" variant="success">
      <AlertTitle className="text-xl">Forespørsel mottatt!</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar
          kontakt på e-post.
        </p>
        {result && (
          <div className="border-t border-success-foreground/20 pt-3 mt-3 space-y-1">
            <p>
              <span className="font-heading text-foreground">Bookertype:</span>{" "}
              {result.bookerLabel}
            </p>
            {result.priceType !== "frivillig" && (
              <p>
                <span className="font-heading text-foreground">
                  Prisestimat:
                </span>{" "}
                {result.totalPrice.toLocaleString("nb-NO")} kr
              </p>
            )}
            {result.priceType === "frivillig" && (
              <p className="text-sm text-foreground-muted">
                Som intern frivillig booker du gratis, men eksterne bookinger
                har prioritet og kan overta rommet med 12 timers varsel.
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
