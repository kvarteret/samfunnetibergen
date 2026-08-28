"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FormSection } from "@/components/ui/form-section"
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
  const t = useTranslations("RoomBooking")
  const acceptTermsErrorId = `${acceptTermsId}-error`

  const [hasReadRental, setHasReadRental] = useState(false)
  const [hasReadCancellation, setHasReadCancellation] = useState(false)
  const [notReadWarning, setNotReadWarning] = useState(false)

  const rentalDialogRef = useRef<HTMLDialogElement>(null)
  const cancellationDialogRef = useRef<HTMLDialogElement>(null)

  const hasReadBoth = hasReadRental && hasReadCancellation

  const openRentalDialog = useCallback(() => {
    setNotReadWarning(false)
    rentalDialogRef.current?.showModal()
  }, [])

  const closeRentalDialog = useCallback(() => {
    rentalDialogRef.current?.close()
    setHasReadRental(true)
  }, [])

  const openCancellationDialog = useCallback(() => {
    setNotReadWarning(false)
    cancellationDialogRef.current?.showModal()
  }, [])

  const closeCancellationDialog = useCallback(() => {
    cancellationDialogRef.current?.close()
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
    <FormSection number="09" title={t("terms.sectionTitle")}>
      <div className="max-w-3xl space-y-4">
        <div className="space-y-3">
          <p className="leading-6">{t("terms.intro")}</p>
          <p className="leading-6">{t("terms.cancellationIntro")}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2">
            <button
              className="inline-flex cursor-pointer items-center gap-1 font-heading underline underline-offset-4 focus-brutal"
              onClick={openRentalDialog}
              type="button"
            >
              {t("terms.rental")}
            </button>
            {hasReadRental && (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check aria-hidden className="size-3" />
                {t("terms.read")}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            <button
              className="inline-flex cursor-pointer items-center gap-1 font-heading underline underline-offset-4 focus-brutal"
              onClick={openCancellationDialog}
              type="button"
            >
              {t("terms.cancellation")}
            </button>
            {hasReadCancellation && (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check aria-hidden className="size-3" />
                {t("terms.read")}
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
              label={t("terms.accept")}
              labelClassName="font-sans font-base text-foreground-muted"
              onChange={handleCheckboxChange}
            />
          )}
        </form.Field>

        {notReadWarning && (
          <p className="text-sm font-medium text-destructive">
            {t("terms.notRead")}
          </p>
        )}
      </div>

      <TermsDialog
        onClose={closeRentalDialog}
        ref={rentalDialogRef}
        title={t("terms.rental")}
      >
        {rentalTermsContent ? (
          <ReactMarkdown>{rentalTermsContent}</ReactMarkdown>
        ) : (
          <p>{t("terms.contentUnavailable")}</p>
        )}
      </TermsDialog>

      <TermsDialog
        onClose={closeCancellationDialog}
        ref={cancellationDialogRef}
        title={t("terms.cancellation")}
      >
        {cancellationTermsContent ? (
          <ReactMarkdown>{cancellationTermsContent}</ReactMarkdown>
        ) : (
          <p>{t("terms.contentUnavailable")}</p>
        )}
      </TermsDialog>
    </FormSection>
  )
}

import { forwardRef, type ReactNode } from "react"

interface TermsDialogProps {
  title: string
  children: ReactNode
  onClose: () => void
}

const TermsDialog = forwardRef<HTMLDialogElement, TermsDialogProps>(
  function TermsDialog({ title, children, onClose }, ref) {
    const t = useTranslations("RoomBooking")

    return (
      <dialog
        className="m-auto max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-sm border-2 border-border bg-background p-0 shadow-lg backdrop:bg-black/50"
        ref={ref}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-border bg-background p-4">
          <h2 className="font-heading text-xl">{title}</h2>
          <button
            aria-label={t("catering.close")}
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
            {t("catering.close")}
          </Button>
        </div>
      </dialog>
    )
  },
)
