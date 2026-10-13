import { NextResponse } from "next/server"
import { setBookingContinuation } from "@/lib/booking/continuation"
import { verifyPromotionLink } from "@/lib/booking/promotion-link"
import { personalVerificationSecrets } from "@/lib/integrations/kvarteret-personal/signing-secret"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = url.searchParams.get("locale") === "en" ? "en" : "nb"
  const token = url.searchParams.get("token")
  const receipt = token
    ? personalVerificationSecrets()
        .map(secret => verifyPromotionLink(token, secret))
        .find(Boolean)
    : null
  const headers = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  }
  if (!receipt) {
    return new Response(
      locale === "en"
        ? "This promotion link is invalid or has expired. Please contact pr@samfunnetibergen.no for help."
        : "Promoteringslenken er ugyldig eller har utløpt. Kontakt pr@samfunnetibergen.no for hjelp.",
      { status: 400, headers },
    )
  }
  await setBookingContinuation(receipt.receiptId, receipt.submissionId)
  return NextResponse.redirect(
    new URL(`/${locale}/arrangementer/ny?fromBooking=1`, url.origin),
    { status: 303, headers },
  )
}
