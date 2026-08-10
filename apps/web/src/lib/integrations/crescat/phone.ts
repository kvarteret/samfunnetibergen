import { parsePhoneNumberFromString } from "libphonenumber-js/max"
import { NORWEGIAN_PHONE_FALLBACK } from "@/lib/phone-number"

export interface CrescatPhoneParts {
  phone: string
  countryCode: string
}

export function splitE164ForCrescat(value: string): CrescatPhoneParts {
  if (!value) return { phone: "", countryCode: "+47" }

  if (value === NORWEGIAN_PHONE_FALLBACK) {
    return { phone: "00000000", countryCode: "+47" }
  }

  const parsed = parsePhoneNumberFromString(value)
  if (!parsed?.isValid() || parsed.number !== value) {
    throw new Error("Crescat phone input must be a valid E.164 number")
  }

  return {
    phone: parsed.nationalNumber,
    countryCode: `+${parsed.countryCallingCode}`,
  }
}
