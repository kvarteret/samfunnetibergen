"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Beer, Info, UtensilsCrossed } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/ui/form-section"
import { Textarea } from "@/components/ui/textarea"
import { ToggleOption } from "@/components/ui/toggle-option"
import { Link } from "@/i18n/navigation"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

const BAR_THRESHOLD = 40

export function BookingFormCateringBarSection() {
  const uid = useId()
  const form = useBookingForm()
  const audienceCount = Number(form.state.values.audienceCount) || 0
  const requiresBar = audienceCount >= BAR_THRESHOLD

  return (
    <FormSection number="07" title="Mat og bar">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <form.Field name="cateringCustom">
            {(field: AnyFieldApi) => (
              <ToggleOption
                checked={field.state.value as boolean}
                icon={UtensilsCrossed}
                label="Jeg ønsker tilbud om catering"
                onChange={field.handleChange}
              >
                {(field.state.value as boolean) && (
                  <div className="mt-3 space-y-3">
                    <form.Field name="cateringText">
                      {(textField: AnyFieldApi) => (
                        <Textarea
                          className="resize-y"
                          id={`${uid}-catering`}
                          onChange={e => textField.handleChange(e.target.value)}
                          placeholder="Beskriv ønsker om mat, snacks eller drikke."
                          rows={4}
                          value={textField.state.value as string}
                        />
                      )}
                    </form.Field>
                    <Button
                      render={<Link href="/catering" target="_blank" />}
                      size="sm"
                      variant="plain"
                    >
                      Mer info
                    </Button>
                  </div>
                )}
              </ToggleOption>
            )}
          </form.Field>
        </div>

        <BarSection requiresBar={requiresBar} />
      </div>
    </FormSection>
  )
}

function BarSection({ requiresBar }: { requiresBar: boolean }) {
  const form = useBookingForm()

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-sm border-2 border-border bg-muted/50 p-4">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-6">
          {requiresBar
            ? "Ditt arrangement krever bar i rommet."
            : "Ditt arrangement krever ikke bar i rommet."}
        </p>
      </div>

      {requiresBar ? (
        <BarOptions />
      ) : (
        <form.Subscribe
          selector={(s: { values: BookingFormValues }) => ({
            barSelf: s.values.barSelf,
            barKvarteret: s.values.barKvarteret,
          })}
        >
          {({
            barSelf,
            barKvarteret,
          }: {
            barSelf: boolean
            barKvarteret: boolean
          }) => {
            const wantsBar = barSelf || barKvarteret
            return (
              <>
                <ToggleOption
                  checked={wantsBar}
                  icon={Beer}
                  label="Jeg ønsker bar i rommet"
                  onChange={checked => {
                    if (checked) {
                      form.setFieldValue("barSelf", true)
                    } else {
                      form.setFieldValue("barSelf", false)
                      form.setFieldValue("barKvarteret", false)
                    }
                  }}
                />
                {wantsBar && <BarOptions />}
              </>
            )
          }}
        </form.Subscribe>
      )}
    </div>
  )
}

function BarOptions() {
  const form = useBookingForm()

  return (
    <div className="space-y-3 border-l-2 border-border pl-4">
      <form.Field name="barSelf">
        {(field: AnyFieldApi) => (
          <ToggleOption
            checked={field.state.value as boolean}
            icon={Beer}
            label="Jeg står i bar selv"
            onChange={checked => {
              field.handleChange(checked)
              if (checked) form.setFieldValue("barKvarteret", false)
            }}
          >
            <div className="flex items-start gap-2 text-sm leading-6 text-foreground-muted">
              <Info
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <p>
                Det er kostnadsfritt å bemanne egen bar på eget arrangement.
                Dette krever HMS- og baropplæring fra oss. Dette tar cirka en
                time og lenke blir sendt ut ved bekreftet booking.
              </p>
            </div>
          </ToggleOption>
        )}
      </form.Field>
      <form.Field name="barKvarteret">
        {(field: AnyFieldApi) => (
          <ToggleOption
            checked={field.state.value as boolean}
            icon={Beer}
            label="Kvarteret står i bar"
            onChange={checked => {
              field.handleChange(checked)
              if (checked) form.setFieldValue("barSelf", false)
            }}
          >
            <p className="text-sm text-foreground-muted">
              Pris: 2000 kr eks. mva. Forutsetter kapasitet.
            </p>
          </ToggleOption>
        )}
      </form.Field>
    </div>
  )
}
