import { createContext, useContext } from "react"

import type { AppFormApi } from "@/lib/form-api"
import type { KaraokeFormState } from "../domain/formState"

export const KaraokeFormContext =
  createContext<AppFormApi<KaraokeFormState> | null>(null)

export function useKaraokeForm() {
  const form = useContext(KaraokeFormContext)
  if (!form)
    throw new Error(
      "useKaraokeForm must be used inside KaraokeFormContext.Provider",
    )
  return form
}
