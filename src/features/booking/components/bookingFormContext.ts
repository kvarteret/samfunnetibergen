import { createContext, useContext } from "react"
import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form"
import type { BookingFormValues } from "./BookingForm"

type BookingFormApi = ReactFormExtendedApi<
  BookingFormValues,
  FormValidateOrFn<BookingFormValues> | undefined,
  FormValidateOrFn<BookingFormValues> | undefined,
  FormAsyncValidateOrFn<BookingFormValues> | undefined,
  FormValidateOrFn<BookingFormValues> | undefined,
  FormAsyncValidateOrFn<BookingFormValues> | undefined,
  FormValidateOrFn<BookingFormValues> | undefined,
  FormAsyncValidateOrFn<BookingFormValues> | undefined,
  FormValidateOrFn<BookingFormValues> | undefined,
  FormAsyncValidateOrFn<BookingFormValues> | undefined,
  FormAsyncValidateOrFn<BookingFormValues> | undefined,
  unknown
>

export const BookingFormContext = createContext<BookingFormApi | null>(null)

export function useBookingForm() {
  const form = useContext(BookingFormContext)
  if (!form)
    throw new Error(
      "useBookingForm must be used inside BookingFormContext.Provider",
    )
  return form
}
