"use client"

import { useStore } from "@tanstack/react-form"
import { Loader2, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useEventForm } from "./eventFormContext"

interface EventFormActionsProps {
  formError: string
  imageUploading: boolean
}

export function EventFormActions({
  formError,
  imageUploading,
}: EventFormActionsProps) {
  const form = useEventForm()
  const isPending = useStore(form.store, state => state.isSubmitting)
  const submitError = useStore(form.store, state => state.errorMap.onSubmit)

  const displayError = String(submitError || formError || "")

  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {displayError && (
        <Alert variant="destructive">
          <X aria-hidden className="text-destructive" />
          <AlertTitle className="text-destructive">
            Det oppstod en feil
          </AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <p className=" leading-6 text-foreground-muted">
        Arrangementet sendes til godkjenning hos PR-gruppen på Kvarteret. Det
        vil ikke vises på nettsiden før det er godkjent. vi bruker vanligvis 1-3
        virkedager.
      </p>

      <Button
        className="w-full sm:w-auto"
        disabled={isPending || imageUploading}
        size="lg"
        type="submit"
      >
        {(isPending || imageUploading) && (
          <Loader2 aria-hidden className="animate-spin" />
        )}
        {submitButtonLabel(isPending, imageUploading)}
      </Button>
    </section>
  )
}

function submitButtonLabel(
  isPending: boolean,
  imageUploading: boolean,
): string {
  if (isPending) return "Sender inn..."
  if (imageUploading) return "Laster opp bilde..."
  return "Send inn arrangement"
}
