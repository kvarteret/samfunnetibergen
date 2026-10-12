import { useTranslations } from "next-intl"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormSection } from "@/components/ui/form-section"
import type { ClosedApplicationStatus } from "../domain/applicationStatus"

type GroupApplicationsClosedProps = {
  status: ClosedApplicationStatus
}

export function GroupApplicationsClosed({
  status,
}: GroupApplicationsClosedProps) {
  const t = useTranslations("GroupVolunteerForm")

  return (
    <FormSection title={t("title")}>
      <Alert>
        <AlertDescription>
          {status === "full"
            ? t("applicationsClosedFull")
            : t("applicationsClosedExternal")}
        </AlertDescription>
      </Alert>
    </FormSection>
  )
}
