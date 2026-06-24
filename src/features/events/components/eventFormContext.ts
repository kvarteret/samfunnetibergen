import { createContext, useContext } from "react"

import type { AppFormApi } from "@/lib/form-api"
import type { FormState } from "../domain/formState"

export const EventFormContext = createContext<AppFormApi<FormState> | null>(
  null,
)

export function useEventForm() {
  const form = useContext(EventFormContext)
  if (!form)
    throw new Error(
      "useEventForm must be used inside EventFormContext.Provider",
    )
  return form
}
