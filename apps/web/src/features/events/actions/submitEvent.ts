"use server"

import { createClient } from "@sanity/client"
import { err, ok, type Result } from "@/lib/result"
import {
  captureSubmitFailure,
  GENERIC_SUBMIT_ERROR,
  getValidationDiagnostics,
  INVALID_PAYLOAD_ERROR,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
} from "@/lib/submission"
import { eventFormSchema } from "../domain/eventFormSchema"
import type { FormState } from "../domain/formState"
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "../domain/imageUpload"

import { buildEventDocument } from "../server/event-document"

const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"

const UPLOAD_LIMIT = 12

function getWriteClient() {
  if (!WRITE_TOKEN) {
    throw new Error("SANITY_WRITE_TOKEN is not configured")
  }
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2024-01-01",
    token: WRITE_TOKEN,
    useCdn: false,
  })
}

export type EventDate = {
  startDate: string
  startTime?: string
  endTime?: string
}

export type SubmitEventInput = FormState & {
  imageAssetId?: string
  // Hidden anti-bot field; must stay empty for real submissions.
  honeypot?: string
}

export type UploadImageResult = Result<string>

export async function uploadEventImage(
  formData: FormData,
): Promise<UploadImageResult> {
  try {
    const file = formData.get("image")
    if (!(file instanceof File) || !file.size) {
      return err("Ingen fil mottatt")
    }
    if (!isAcceptedEventImageType(file.type)) {
      return err("Bildet må være JPEG, PNG eller WebP")
    }
    if (file.size > EVENT_IMAGE_MAX_SIZE_BYTES) {
      return err(`Bildet er for stort (maks ${formatEventImageMaxSize()})`)
    }
    if (await isSubmissionRateLimited("uploadEventImage", UPLOAD_LIMIT)) {
      return err(RATE_LIMIT_ERROR)
    }
    const client = getWriteClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await client.assets.upload("image", buffer, {
      contentType: file.type,
      filename: file.name,
    })
    return ok(asset._id)
  } catch {
    captureSubmitFailure(
      "event_image_upload",
      new Error("Event image upload failed"),
      {
        source: "submit-event-image",
        failure_branch: "sanity_asset_upload_failed",
      },
    )
    return err(GENERIC_SUBMIT_ERROR)
  }
}

export type SubmitEventResult = Result<string>

export async function submitEvent(
  input: SubmitEventInput,
): Promise<SubmitEventResult> {
  // Silently accept honeypot hits so bots get a success response and never
  // learn the field is a trap; nothing is written to Sanity.
  if (input.honeypot?.trim()) {
    return ok("ignored")
  }

  const formParsed = eventFormSchema.safeParse(input)
  if (!formParsed.success) {
    captureSubmitFailure(
      "event_submission",
      new Error("Event form schema validation failed"),
      {
        source: "submit-event",
        validation_stage: "server",
        failure_branch: "schema_validation_failed",
        form_id: "event_submission",
        ...getValidationDiagnostics(formParsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  if (await isSubmissionRateLimited("submitEvent")) {
    return err(RATE_LIMIT_ERROR)
  }

  const validatedInput: SubmitEventInput = {
    ...formParsed.data,
    imageAssetId: input.imageAssetId,
  }

  try {
    const doc = buildEventDocument(validatedInput)
    const created = await getWriteClient().create(doc)
    return ok(created._id)
  } catch {
    captureSubmitFailure(
      "event_submission",
      new Error("Sanity event document creation failed"),
      {
        source: "submit-event",
        failure_branch: "sanity_document_create_failed",
        is_recurring: validatedInput.isRecurring,
        is_internal: validatedInput.isInternalEvent,
        is_free: validatedInput.isFree,
        has_ticket_url: Boolean(validatedInput.ticketUrl),
        has_facebook_url: Boolean(validatedInput.facebookUrl),
        date_count: validatedInput.dates.filter(date => date.startDate).length,
      },
    )
    return err(GENERIC_SUBMIT_ERROR)
  }
}
