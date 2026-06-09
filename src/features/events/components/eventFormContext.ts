import { createContext, useContext } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EventFormContext = createContext<any>(null)

export function useEventForm() {
  const form = useContext(EventFormContext)
  if (!form)
    throw new Error(
      "useEventForm must be used inside EventFormContext.Provider",
    )
  return form
}
