/**
 * One server-only key signs every request and token the website issues for
 * Personal. Each use signs its own purpose prefix (`v2`, `booking-v1`,
 * `event-interest-v1`, `booking-promotion-v1:`, `booking-continuation-v1:`,
 * `event-interest-source-v1:`), so a signature never verifies for another use.
 *
 * EVENT_INTEREST_SECRET was retired on 2026-10-13; event-interest requests and
 * cookies use only the shared keys. The volunteer/booking legacy key remains
 * a fallback until 2027-01-12, when old booking links have expired.
 */
type LegacySecretName = "VOLUNTEER_PROSPECT_HMAC_SECRET"

const MIN_SECRET_LENGTH = 32

function configured(value: string | undefined): value is string {
  return Boolean(value && value.length >= MIN_SECRET_LENGTH)
}

export function personalSigningSecret(
  legacyName?: LegacySecretName,
): string | undefined {
  return [
    process.env.PERSONAL_SIGNING_SECRET,
    legacyName && process.env[legacyName],
  ].find(configured)
}

/** Keys that may have signed a token this website issued earlier. */
export function personalVerificationSecrets(
  legacyName?: LegacySecretName,
): string[] {
  return [
    ...new Set(
      [
        process.env.PERSONAL_SIGNING_SECRET,
        process.env.PERSONAL_SIGNING_PREVIOUS_SECRET,
        legacyName && process.env[legacyName],
      ].filter(configured),
    ),
  ]
}
