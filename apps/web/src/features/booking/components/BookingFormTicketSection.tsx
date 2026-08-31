"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { TicketType } from "../domain/formState"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

const FREE_PAID_OPTIONS = [
  { value: "Gratis" as const, labelKey: "free" as const },
  { value: "Betalt" as const, labelKey: "paid" as const },
]

const SALES_METHOD_OPTIONS = [
  { value: "house" as const, labelKey: "houseSales" as const },
  { value: "ownTerminal" as const, labelKey: "ownTerminal" as const },
]

function defaultTicketTypes(
  t: ReturnType<typeof useTranslations<"RoomBooking">>,
): TicketType[] {
  return [
    { name: t("ticket.regularDefault"), price: "200" },
    { name: t("ticket.studentDefault"), price: "150" },
    { name: t("ticket.memberDefault"), price: "100" },
  ]
}

interface BookingFormTicketSectionProps {
  ticketsError?: string
  ticketsId: string
}

export function BookingFormTicketSection({
  ticketsError,
  ticketsId,
}: BookingFormTicketSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const t = useTranslations("RoomBooking")

  return (
    <FormSection number="04" title={t("ticket.sectionTitle")}>
      <div className="max-w-3xl space-y-4">
        <form.Field name="freeOrPaid">
          {(field: AnyFieldApi) => (
            <RadioGroup<string>
              onValueChange={v => {
                field.handleChange(v)
                if (v === "Betalt") {
                  const current = form.state.values.ticketTypes as TicketType[]
                  if (current.length === 0) {
                    form.setFieldValue("ticketTypes", defaultTicketTypes(t))
                  }
                }
              }}
              value={field.state.value as string}
            >
              {FREE_PAID_OPTIONS.map(opt => (
                <RadioGroupItem key={opt.value} value={opt.value}>
                  {t(`ticket.${opt.labelKey}`)}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s: { values: BookingFormValues }) => s.values.freeOrPaid}
        >
          {(freeOrPaid: string) =>
            freeOrPaid === "Betalt" ? (
              <div className="space-y-6">
                <FieldGroup error={ticketsError} errorId={`${ticketsId}-error`}>
                  <Label htmlFor={ticketsId}>
                    {t("ticket.typesAndPrices")}
                  </Label>
                  <TicketTypesEditor anchorId={ticketsId} uid={uid} />
                </FieldGroup>
                <FieldGroup>
                  <Label>{t("ticket.salesMethod")}</Label>
                  <form.Field name="ticketSalesMethod">
                    {(field: AnyFieldApi) => (
                      <RadioGroup<string>
                        onValueChange={field.handleChange}
                        value={field.state.value as string}
                      >
                        {SALES_METHOD_OPTIONS.map(opt => (
                          <RadioGroupItem key={opt.value} value={opt.value}>
                            {t(`ticket.${opt.labelKey}`)}
                          </RadioGroupItem>
                        ))}
                      </RadioGroup>
                    )}
                  </form.Field>
                </FieldGroup>
              </div>
            ) : null
          }
        </form.Subscribe>
      </div>
    </FormSection>
  )
}

function TicketTypesEditor({
  uid,
  anchorId,
}: {
  uid: string
  anchorId: string
}) {
  const form = useBookingForm()
  const t = useTranslations("RoomBooking")

  return (
    <form.Field name="ticketTypes">
      {(field: AnyFieldApi) => {
        const tickets = field.state.value as TicketType[]

        const updateTicket = (
          index: number,
          key: keyof TicketType,
          value: string,
        ) => {
          const next = tickets.map((t, i) =>
            i === index ? { ...t, [key]: value } : t,
          )
          field.handleChange(next)
        }

        const addTicket = () => {
          field.handleChange([...tickets, { name: "", price: "" }])
        }

        const removeTicket = (index: number) => {
          field.handleChange(tickets.filter((_, i) => i !== index))
        }

        return (
          <div className="space-y-3">
            {tickets.map((ticket, i) => (
              <div
                className="grid grid-cols-[1fr_8rem_auto] items-center gap-2"
                key={`${uid}-ticket-${i}`}
              >
                <Input
                  id={i === 0 ? anchorId : undefined}
                  onChange={e => updateTicket(i, "name", e.target.value)}
                  placeholder={t("ticket.namePlaceholder")}
                  value={ticket.name}
                />
                <Input
                  inputMode="numeric"
                  onChange={e => updateTicket(i, "price", e.target.value)}
                  placeholder={t("ticket.pricePlaceholder")}
                  value={ticket.price}
                />
                <button
                  aria-label={t("ticket.removeTicket", {
                    ticket: ticket.name || t("ticket.ticketFallback"),
                  })}
                  className="p-1 text-foreground-muted hover:text-destructive focus-brutal"
                  onClick={() => removeTicket(i)}
                  type="button"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            ))}
            <Button
              onClick={addTicket}
              size="sm"
              type="button"
              variant="neutral"
            >
              <Plus aria-hidden className="size-4" />
              {t("ticket.add")}
            </Button>
          </div>
        )
      }}
    </form.Field>
  )
}
