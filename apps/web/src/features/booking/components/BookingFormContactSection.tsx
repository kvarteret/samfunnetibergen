"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useLocale, useTranslations } from "next-intl"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneNumberField } from "@/components/ui/phone-number-field"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import { useBookingForm } from "./bookingFormContext"

interface BookingFormContactSectionProps {
  contactEmailError?: string
  contactEmailId: string
  contactNameError?: string
  contactNameId: string
  contactPhoneError?: string
  contactPhoneId: string
  invoiceAddressError?: string
  invoiceAddressId: string
  orgNumberError?: string
  orgNumberId: string
}

export function BookingFormContactSection({
  contactEmailError,
  contactEmailId,
  contactNameError,
  contactNameId,
  contactPhoneError,
  contactPhoneId,
  invoiceAddressError,
  invoiceAddressId,
  orgNumberError,
  orgNumberId,
}: BookingFormContactSectionProps) {
  const form = useBookingForm()
  const locale = useLocale()
  const t = useTranslations("RoomBooking")
  const bookerType = form.state.values.bookerType as BookerType
  const isExternal = isExternalBooker(bookerType)
  const contactEmailErrorId = `${contactEmailId}-error`
  const contactNameErrorId = `${contactNameId}-error`
  const contactPhoneErrorId = `${contactPhoneId}-error`
  const invoiceAddressErrorId = `${invoiceAddressId}-error`
  const orgNumberErrorId = `${orgNumberId}-error`

  return (
    <FormSection number="05" title={t("contact.sectionTitle")}>
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup error={contactNameError} errorId={contactNameErrorId}>
          <Label htmlFor={contactNameId}>{t("contact.name")}</Label>
          <form.Field name="contactName">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  contactNameError ? contactNameErrorId : undefined
                }
                aria-invalid={!!contactNameError}
                autoComplete="name"
                id={contactNameId}
                onChange={e => field.handleChange(e.target.value)}
                placeholder={t("contact.fullName")}
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup error={contactEmailError} errorId={contactEmailErrorId}>
          <Label htmlFor={contactEmailId}>{t("contact.email")}</Label>
          <form.Field name="contactEmail">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  contactEmailError ? contactEmailErrorId : undefined
                }
                aria-invalid={!!contactEmailError}
                autoComplete="email"
                id={contactEmailId}
                onChange={e => field.handleChange(e.target.value)}
                placeholder={t("contact.emailPlaceholder")}
                type="email"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup error={contactPhoneError} errorId={contactPhoneErrorId}>
          <Label htmlFor={contactPhoneId}>{t("contact.phone")}</Label>
          <form.Field name="contactPhone">
            {(field: AnyFieldApi) => (
              <PhoneNumberField
                describedBy={
                  contactPhoneError ? contactPhoneErrorId : undefined
                }
                error={!!contactPhoneError}
                id={contactPhoneId}
                locale={locale === "en" ? "en" : "nb"}
                onChange={value => field.handleChange(value)}
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        {isExternal && (
          <>
            <form.Field name="invoiceAddress">
              {(field: AnyFieldApi) => (
                <FieldGroup
                  error={invoiceAddressError}
                  errorId={invoiceAddressErrorId}
                >
                  <Label htmlFor={invoiceAddressId}>
                    {t("contact.invoiceAddress")}
                  </Label>
                  <Input
                    aria-describedby={
                      invoiceAddressError ? invoiceAddressErrorId : undefined
                    }
                    aria-invalid={!!invoiceAddressError}
                    autoComplete="street-address"
                    id={invoiceAddressId}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t("contact.invoicePlaceholder")}
                    value={field.state.value as string}
                  />
                </FieldGroup>
              )}
            </form.Field>
            <form.Field name="orgNumber">
              {(field: AnyFieldApi) => (
                <FieldGroup error={orgNumberError} errorId={orgNumberErrorId}>
                  <Label htmlFor={orgNumberId}>
                    {t("contact.organizationNumber")}
                  </Label>
                  <Input
                    aria-describedby={
                      orgNumberError ? orgNumberErrorId : undefined
                    }
                    aria-invalid={!!orgNumberError}
                    id={orgNumberId}
                    inputMode="numeric"
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t("contact.optional")}
                    value={field.state.value as string}
                  />
                </FieldGroup>
              )}
            </form.Field>
          </>
        )}
      </div>
    </FormSection>
  )
}
