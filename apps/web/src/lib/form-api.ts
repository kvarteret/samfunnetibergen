import type { ReactFormExtendedApi } from "@tanstack/react-form"

// Form sections share a context across forms whose validator generics differ.
// Keep the value type visible while intentionally erasing only validator
// details at that React context boundary; providers can pass their concrete
// useForm result without unsafe double casts.
// TanStack marks all validator parameters invariant, so a context cannot
// express "any validator for these values" with unknown/union types. The
// erasure is kept here, at the shared context boundary, instead of repeated
// unsafe casts at every provider.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AppFormApi<TValues> = ReactFormExtendedApi<
  TValues,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  unknown
>
/* eslint-enable @typescript-eslint/no-explicit-any */
