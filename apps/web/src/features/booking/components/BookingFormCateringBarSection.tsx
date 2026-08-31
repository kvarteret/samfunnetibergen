"use client"

import { Dialog } from "@base-ui/react/dialog"
import type { AnyFieldApi } from "@tanstack/react-form"
import { Beer, Info, UtensilsCrossed, X } from "lucide-react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("RoomBooking")

  return (
    <FormSection number="07" title={t("catering.sectionTitle")}>
      <div className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <form.Field name="cateringCustom">
            {(field: AnyFieldApi) => (
              <ToggleOption
                checked={field.state.value as boolean}
                icon={UtensilsCrossed}
                label={t("catering.catering")}
                onChange={field.handleChange}
              >
                {(field.state.value as boolean) && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-6 text-foreground-muted">
                      {t("catering.cateringDescription")}
                    </p>
                    <form.Field name="cateringText">
                      {(textField: AnyFieldApi) => (
                        <Textarea
                          className="resize-y"
                          id={`${uid}-catering`}
                          onChange={e => textField.handleChange(e.target.value)}
                          placeholder={t("catering.cateringPlaceholder")}
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
  const t = useTranslations("RoomBooking")

  return (
    <Dialog.Root>
      <Dialog.Trigger className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-2.5 py-1 font-heading text-xs uppercase tracking-widest text-foreground-muted transition-colors hover:border-primary hover:text-foreground focus-brutal">
        <Info aria-hidden className="size-3.5" />
        {t("catering.cateringInfo")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-100 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col border-2 border-border bg-background shadow-shadow">
          <div className="flex shrink-0 items-center justify-between border-b-2 border-border p-4">
            <Dialog.Title className="font-heading text-xl">
              {t("catering.cateringInfoTitle")}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("catering.close")}
              className="p-1 text-foreground-muted transition-colors hover:text-foreground focus-brutal"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>
          <div className="space-y-4 overflow-y-auto p-6 leading-6">
            <p>{t("catering.cateringInfoBody1")}</p>
            <p>{t("catering.cateringInfoBody2")}</p>
            <p>{t("catering.cateringInfoBody3")}</p>
            <p className="text-foreground-muted">
              {t("catering.cateringInfoBody4")}
            </p>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function BarSection({ requiresBar }: { requiresBar: boolean }) {
  const form = useBookingForm()
  const t = useTranslations("RoomBooking")

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-sm border-2 border-border bg-muted/50 p-4">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-6">
          {requiresBar
            ? t("catering.barRequired")
            : t("catering.barNotRequired")}
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
                  label={t("catering.bar")}
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
  const t = useTranslations("RoomBooking")

  return (
    <div className="space-y-3 border-l-2 border-border pl-4">
      <form.Field name="barSelf">
        {(field: AnyFieldApi) => (
          <ToggleOption
            checked={field.state.value as boolean}
            icon={Beer}
            label={t("catering.barSelf")}
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
              <p>{t("catering.barSelfDescription")}</p>
            </div>
          </ToggleOption>
        )}
      </form.Field>
      <form.Field name="barKvarteret">
        {(field: AnyFieldApi) => (
          <ToggleOption
            checked={field.state.value as boolean}
            icon={Beer}
            label={t("catering.barHouse")}
            onChange={checked => {
              field.handleChange(checked)
              if (checked) form.setFieldValue("barSelf", false)
            }}
          >
            <p className="text-sm text-foreground-muted">
              {t("catering.barHouseDescription")}
            </p>
          </ToggleOption>
        )}
      </form.Field>
    </div>
  )
}
