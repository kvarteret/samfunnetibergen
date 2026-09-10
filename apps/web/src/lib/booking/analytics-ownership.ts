/** Safe to import in forms; the server owns the mode decision. */
export type BookingAnalyticsOwner = "legacy" | "server" | "disabled"
export type BookingAnalyticsResult = { analytics_owner?: BookingAnalyticsOwner }

export function browserOwnsBookingConversion(
  result: BookingAnalyticsResult,
): boolean {
  return (
    result.analytics_owner === undefined || result.analytics_owner === "legacy"
  )
}
