import { createContext, useContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SubmitEventFormContext = createContext<any>(null);

export function useSubmitEventForm() {
  const form = useContext(SubmitEventFormContext);
  if (!form)
    throw new Error(
      "useSubmitEventForm must be used inside SubmitEventFormContext.Provider",
    );
  return form;
}
