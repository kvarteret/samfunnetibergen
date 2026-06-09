import { createContext, useContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const KaraokeFormContext = createContext<any>(null);

export function useKaraokeForm() {
  const form = useContext(KaraokeFormContext);
  if (!form) throw new Error("useKaraokeForm must be used inside KaraokeFormContext.Provider");
  return form;
}
