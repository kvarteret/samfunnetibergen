import { isValidPhoneNumber } from "libphonenumber-js/max"

const E164_PATTERN = /^\+[1-9]\d{1,14}$/
export const NORWEGIAN_PHONE_FALLBACK = "+4700000000"

export function isE164PhoneNumber(value: string): boolean {
  const normalized = value.trim()
  return (
    normalized === NORWEGIAN_PHONE_FALLBACK ||
    (E164_PATTERN.test(normalized) && isValidPhoneNumber(normalized))
  )
}

export function isOptionalE164PhoneNumber(value: string): boolean {
  const normalized = value.trim()
  return normalized === "" || isE164PhoneNumber(normalized)
}
