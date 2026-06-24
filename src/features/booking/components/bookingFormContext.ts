import { createContext, useContext } from "react"

import type { AppFormApi } from "@/lib/form-api"
import type { BookingFormValues } from "./BookingForm"

export const BookingFormContext =
  createContext<AppFormApi<BookingFormValues> | null>(null)

export function useBookingForm() {
  const form = useContext(BookingFormContext)
  if (!form)
    throw new Error(
      "useBookingForm must be used inside BookingFormContext.Provider",
    )
  return form
}
