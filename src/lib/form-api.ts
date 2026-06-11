import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form"

// The concrete instance type returned by useForm() when only defaultValues
// and onSubmit are configured. One alias so each feature's form context does
// not repeat TanStack Form's eleven type parameters.
export type AppFormApi<TValues> = ReactFormExtendedApi<
  TValues,
  FormValidateOrFn<TValues> | undefined,
  FormValidateOrFn<TValues> | undefined,
  FormAsyncValidateOrFn<TValues> | undefined,
  FormValidateOrFn<TValues> | undefined,
  FormAsyncValidateOrFn<TValues> | undefined,
  FormValidateOrFn<TValues> | undefined,
  FormAsyncValidateOrFn<TValues> | undefined,
  FormValidateOrFn<TValues> | undefined,
  FormAsyncValidateOrFn<TValues> | undefined,
  FormAsyncValidateOrFn<TValues> | undefined,
  unknown
>
