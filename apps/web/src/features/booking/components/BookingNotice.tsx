import { Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export async function BookingNotice({
  karaoke,
  locale,
}: {
  karaoke: boolean
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: "RoomBooking" })
  return (
    <Alert variant="warm" className="max-w-2xl p-6 sm:p-8">
      <Check aria-hidden />
      <AlertTitle>
        <h1 className="text-2xl">
          {karaoke ? t("form.karaokeSuccessTitle") : t("form.successTitle")}
        </h1>
      </AlertTitle>
      <AlertDescription>{t("form.successDescription")}</AlertDescription>
    </Alert>
  )
}
