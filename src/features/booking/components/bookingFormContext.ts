import { createContext, useContext } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BookingFormContext = createContext<any>(null)

export function useBookingForm() {
  const form = useContext(BookingFormContext)
  if (!form)
    throw new Error(
      "useBookingForm must be used inside BookingFormContext.Provider",
    )
  return form
}
