"use client"

import { Loader2, Mic, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { canSubmitKaraokeBooking } from "../domain/formState"
import { useKaraokeForm } from "./karaokeFormContext"

export function KaraokeFormSubmitSection() {
  const form = useKaraokeForm()
  const values = form.state.values
  const isPending = form.state.isSubmitting
  const submitError = form.state.errorMap.onSubmit

  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {submitError && (
        <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
          <X aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-heading text-destructive">
              Det oppstod en feil
            </p>
            <p className="mt-0.5 text-sm text-foreground/70">
              {String(submitError)}
            </p>
          </div>
        </div>
      )}
      <Button
        className="w-full sm:w-auto"
        disabled={isPending || !canSubmitKaraokeBooking(values)}
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

export function KaraokeBookingSuccess() {
  return (
    <Card className="space-y-4 border-primary bg-primary/5 p-8 py-8">
      <p className="font-heading text-xl text-foreground">
        Forespørsel mottatt!
      </p>
      <p className="text-body text-foreground/70">
        Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar
        kontakt på e-post.
      </p>
    </Card>
  )
}
