"use client"

import { Dialog } from "@base-ui/react/dialog"
import type { AnyFieldApi } from "@tanstack/react-form"
import { Beer, Info, UtensilsCrossed, X } from "lucide-react"
import { useId } from "react"
import { FormSection } from "@/components/ui/form-section"
import { Textarea } from "@/components/ui/textarea"
import { ToggleOption } from "@/components/ui/toggle-option"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

const BAR_THRESHOLD = 40

export function BookingFormCateringBarSection() {
  const uid = useId()
  const form = useBookingForm()

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
                    <p className="text-sm leading-6 text-foreground-muted">
                      Du vil bli kontaktet av kjøkkensjef slik at dere kan
                      diskutere mulighetene for catering på ditt arrangement.
                    </p>
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
                    <CateringInfoDialog />
                  </div>
                )}
              </ToggleOption>
            )}
          </form.Field>
        </div>

        {/* Bar requirement keys off the audience count, so it must subscribe to
            it rather than reading a snapshot that never re-renders. */}
        <form.Subscribe
          selector={(s: { values: BookingFormValues }) =>
            s.values.audienceCount
          }
        >
          {(audienceCount: string) => (
            <BarSection
              requiresBar={(Number(audienceCount) || 0) >= BAR_THRESHOLD}
            />
          )}
        </form.Subscribe>
      </div>
    </FormSection>
  )
}

// Large scrollable catering details, opened from the "Mer info" trigger. Closes
// on the X or by clicking the backdrop (base-ui Dialog default).
function CateringInfoDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 font-heading text-xs uppercase tracking-widest text-foreground-muted transition-colors hover:border-primary hover:text-foreground focus-brutal">
        <Info aria-hidden className="size-3.5" />
        Mer info
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-100 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col border-2 border-border bg-background shadow-shadow">
          <div className="flex shrink-0 items-center justify-between border-b-2 border-border p-4">
            <Dialog.Title className="font-heading text-xl">
              Catering på Kvarteret
            </Dialog.Title>
            <Dialog.Close
              aria-label="Lukk"
              className="p-1 text-foreground-muted transition-colors hover:text-foreground focus-brutal"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>
          <div className="space-y-4 overflow-y-auto p-6 leading-6">
            <p>
              Det Akademiske Kvarter tilbyr et bredt utvalg av god mat og
              drikke. Trenger du mat, snacks eller drikke til arrangementet
              ditt, kan du forespørre det her.
            </p>
            <p>
              Kjøkkensjefen vår tar kontakt etter at forespørselen er sendt,
              slik at dere sammen kan finne en løsning som passer arrangementet.
              Vi tilpasser menyen etter ønsker og behov, fra enkel servering til
              større bespisning.
            </p>
            <p>
              Gi oss gjerne beskjed om allergier og spesielle hensyn, så tar vi
              det med i planleggingen.
            </p>
            <p className="text-foreground-muted">
              Medbragt mat og drikke er ikke tillatt i lokalene våre.
            </p>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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
