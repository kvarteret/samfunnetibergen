/**
 * One server-only key signs every request and token the website issues for
 * Personal. Each use signs its own purpose prefix (`v2`, `booking-v1`,
 * `event-interest-v1`, `booking-promotion-v1:`, `booking-continuation-v1:`,
 * `event-interest-source-v1:`), so a signature never verifies for another use.
 *
 * All request and token types use the shared key and its optional rotation
 * key. Each use signs a distinct purpose prefix.
 */
const MIN_SECRET_LENGTH = 32

function configured(value: string | undefined): value is string {
  return Boolean(value && value.length >= MIN_SECRET_LENGTH)
}

export function personalSigningSecret(): string | undefined {
  const secret = process.env.PERSONAL_SIGNING_SECRET
  return configured(secret) ? secret : undefined
}

/** Keys that may have signed a token this website issued earlier. */
export function personalVerificationSecrets(): string[] {
  return [
    ...new Set(
      [
        process.env.PERSONAL_SIGNING_SECRET,
        process.env.PERSONAL_SIGNING_PREVIOUS_SECRET,
      ].filter(configured),
    ),
  ]
}
