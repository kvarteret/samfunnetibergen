"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Check, ExternalLink, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FormSection } from "@/components/ui/form-section"
import ReactMarkdown from "react-markdown"
import { useBookingForm } from "./bookingFormContext"

interface BookingFormTermsSectionProps {
  acceptTermsError?: string
  acceptTermsId: string
  rentalTermsContent: string | null
  cancellationTermsContent: string | null
}

export function BookingFormTermsSection({
  acceptTermsError,
  acceptTermsId,
  rentalTermsContent,
  cancellationTermsContent,
}: BookingFormTermsSectionProps) {
  const form = useBookingForm()
  const acceptTermsErrorId = `${acceptTermsId}-error`

  const [hasReadRental, setHasReadRental] = useState(false)
  const [hasReadCancellation, setHasReadCancellation] = useState(false)
  const [showRentalDialog, setShowRentalDialog] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [notReadWarning, setNotReadWarning] = useState(false)

  const rentalDialogRef = useRef<HTMLDialogElement>(null)
  const cancellationDialogRef = useRef<HTMLDialogElement>(null)

  const hasReadBoth = hasReadRental && hasReadCancellation

  const openRentalDialog = useCallback(() => {
    setShowRentalDialog(true)
    setNotReadWarning(false)
    rentalDialogRef.current?.showModal()
  }, [])

  const closeRentalDialog = useCallback(() => {
    rentalDialogRef.current?.close()
    setShowRentalDialog(false)
    setHasReadRental(true)
  }, [])

  const openCancellationDialog = useCallback(() => {
    setShowCancellationDialog(true)
    setNotReadWarning(false)
    cancellationDialogRef.current?.showModal()
  }, [])

  const closeCancellationDialog = useCallback(() => {
    cancellationDialogRef.current?.close()
    setShowCancellationDialog(false)
    setHasReadCancellation(true)
  }, [])

  const handleCheckboxChange = (checked: boolean) => {
    if (checked && !hasReadBoth) {
      setNotReadWarning(true)
      return
    }
    setNotReadWarning(false)
    form.setFieldValue("acceptTerms", checked)
  }

  return (
    <FormSection number="09" title="Vilkår">
      <div className="max-w-3xl space-y-4">
        <div className="space-y-3">
          <p className="leading-6">
            Ved å booke et lokale på Det Akademiske Kvarter inngår du en
            forespørsel som må godkjennes av en romkoordinator. En booking er
            ikke bekreftet før du har mottatt bekreftelse på e-post.
          </p>
          <p className="leading-6">
            Avbestilling må skje i henhold til våre avbestillingsvilkår. Sen
            avbestilling vil medføre gebyr.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 font-heading underline underline-offset-4 focus-brutal"
              onClick={openRentalDialog}
              type="button"
            >
              Vilkår for leie
              <ExternalLink
                aria-hidden
                className="inline size-3 shrink-0 align-baseline"
              />
            </button>
            {hasReadRental && (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check aria-hidden className="size-3" />
                Lest
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 font-heading underline underline-offset-4 focus-brutal"
              onClick={openCancellationDialog}
              type="button"
            >
              Avbestillingsvilkår
              <ExternalLink
                aria-hidden
                className="inline size-3 shrink-0 align-baseline"
              />
            </button>
            {hasReadCancellation && (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check aria-hidden className="size-3" />
                Lest
              </span>
            )}
          </span>
        </div>

        <form.Field name="acceptTerms">
          {(field: AnyFieldApi) => (
            <CheckboxField
              aria-describedby={
                acceptTermsError ? acceptTermsErrorId : undefined
              }
              aria-invalid={!!acceptTermsError}
              checked={field.state.value as boolean}
              error={acceptTermsError}
              errorId={acceptTermsErrorId}
              id={acceptTermsId}
              label="Jeg har lest, forstått og godkjenner vilkår for leie og avbestillingsvilkår."
              labelClassName="font-sans font-base text-foreground-muted"
              onChange={handleCheckboxChange}
            />
          )}
        </form.Field>

        {notReadWarning && (
          <p className="text-sm font-medium text-destructive">
            Du har ikke lest og forstått våre vilkår!
          </p>
        )}
      </div>

      <TermsDialog
        onClose={closeRentalDialog}
        open={showRentalDialog}
        ref={rentalDialogRef}
        title="Vilkår for leie"
      >
        {rentalTermsContent ? (
          <ReactMarkdown>{rentalTermsContent}</ReactMarkdown>
        ) : (
          <p>Innholdet kunne ikke lastes.</p>
        )}
      </TermsDialog>

      <TermsDialog
        onClose={closeCancellationDialog}
        open={showCancellationDialog}
        ref={cancellationDialogRef}
        title="Avbestillingsvilkår"
      >
        {cancellationTermsContent ? (
          <ReactMarkdown>{cancellationTermsContent}</ReactMarkdown>
        ) : (
          <p>Innholdet kunne ikke lastes.</p>
        )}
      </TermsDialog>
    </FormSection>
  )
}

import { forwardRef, type ReactNode } from "react"

interface TermsDialogProps {
  title: string
  children: ReactNode
  open: boolean
  onClose: () => void
}

const TermsDialog = forwardRef<HTMLDialogElement, TermsDialogProps>(
  function TermsDialog({ title, children, onClose }, ref) {
    return (
      <dialog
        className="m-auto max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-sm border-2 border-border bg-background p-0 shadow-lg backdrop:bg-black/50"
        ref={ref}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-border bg-background p-4">
          <h2 className="font-heading text-xl">{title}</h2>
          <button
            aria-label="Lukk"
            className="p-1 text-foreground-muted hover:text-foreground focus-brutal"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">{children}</div>
        <div className="sticky bottom-0 border-t-2 border-border bg-background p-4">
          <Button onClick={onClose} type="button">
            Lukk
          </Button>
        </div>
      </dialog>
    )
  },
)
