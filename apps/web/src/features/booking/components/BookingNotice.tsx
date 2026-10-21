import { Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export async function BookingNotice({
  karaoke,
  locale,
  title,
  karaokeTitle,
  description,
}: {
  karaoke: boolean
  locale: string
  title?: string | null
  karaokeTitle?: string | null
  description?: string | null
}) {
  const t = await getTranslations({ locale, namespace: "RoomBooking" })
  return (
    <Alert variant="warm" className="max-w-2xl p-6 sm:p-8">
      <Check aria-hidden />
      <AlertTitle>
        <h1 className="text-2xl">
          {karaoke
            ? (karaokeTitle ?? t("form.karaokeSuccessTitle"))
            : (title ?? t("form.successTitle"))}
        </h1>
      </AlertTitle>
      <AlertDescription>
        {description ?? t("form.successDescription")}
      </AlertDescription>
    </Alert>
  )
}
