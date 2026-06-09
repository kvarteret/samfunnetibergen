"use server";

import { createClient } from "@sanity/client";
import { nanoid } from "nanoid";

import { err, ok, type Result } from "@/lib/result";
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "../domain/imageUpload";

const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

function getWriteClient() {
  if (!WRITE_TOKEN) {
    throw new Error("SANITY_WRITE_TOKEN is not configured");
  }
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2024-01-01",
    token: WRITE_TOKEN,
    useCdn: false,
  });
}

export type EventDate = {
  startDate: string;
  startTime?: string;
  endTime?: string;
};

export type SubmitEventInput = {
  title: string;
  description?: string;
  dates: EventDate[];
  isRecurring?: boolean;
  rrule?: string;
  room?: string;
  roomText?: string;
  organizerGroup?: string;
  organizerText?: string;
  eventTypeId?: string;
  imageAssetId?: string;
  isInternalEvent?: boolean;
  isFree?: boolean;
  priceOrdinar?: number;
  priceStudent?: number;
  priceMedlem?: number;
  ticketUrl?: string;
  facebookUrl?: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedByOrganization?: string;
};

export type UploadImageResult = Result<string>;

export async function uploadEventImage(
  formData: FormData,
): Promise<UploadImageResult> {
  try {
    const file = formData.get("image");
    if (!(file instanceof File) || !file.size) {
      return err("Ingen fil mottatt");
    }
    if (!isAcceptedEventImageType(file.type)) {
      return err("Bildet må være JPEG, PNG eller WebP");
    }
    if (file.size > EVENT_IMAGE_MAX_SIZE_BYTES) {
      return err(`Bildet er for stort (maks ${formatEventImageMaxSize()})`);
    }
    const client = getWriteClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      contentType: file.type,
      filename: file.name,
    });
    return ok(asset._id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return err(message);
  }
}

export type SubmitEventResult = Result<string>;

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))
    return undefined;
  return trimmed;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !isNaN(d.getTime());
}

function validateEventInput(input: SubmitEventInput): string | null {
  if (!input.title?.trim()) return "Tittel er påkrevd";
  if (!input.submittedBy?.trim()) return "Navn er påkrevd";
  if (!input.submittedByEmail?.trim()) return "E-post er påkrevd";
  if (!EMAIL_RE.test(input.submittedByEmail.trim())) return "Ugyldig e-post";

  const validDates = (input.dates ?? []).filter(
    (d) => d.startDate && isValidDateString(d.startDate),
  );
  if (validDates.length === 0) return "Minst én gyldig dato er påkrevd";

  if (input.isRecurring && !input.rrule?.trim()) {
    return "RRule er påkrevd for gjentagende arrangementer";
  }

  return null;
}

export async function submitEvent(
  input: SubmitEventInput,
): Promise<SubmitEventResult> {
  const validationError = validateEventInput(input);
  if (validationError) return err(validationError);

  try {
    const client = getWriteClient();

    const slug = `${toSlug(input.title)}-${Date.now()}`;

    const doc: { _type: string; [key: string]: unknown } = {
      _type: "arrangement",
      title: input.title.trim(),
      slug: { _type: "slug", current: slug },
      approvalStatus: "pending",
      dates: input.dates.map((d) => ({
        _key: nanoid(),
        _type: "arrangementDate",
        startDate: d.startDate,
        ...(d.startTime ? { startTime: d.startTime } : {}),
        ...(d.endTime ? { endTime: d.endTime } : {}),
      })),
      submittedBy: input.submittedBy.trim(),
      submittedByEmail: input.submittedByEmail.trim(),
    };

    if (input.description?.trim()) {
      doc.description = [
        {
          _key: nanoid(),
          _type: "block",
          style: "normal",
          children: [
            { _key: nanoid(), _type: "span", text: input.description.trim() },
          ],
          markDefs: [],
        },
      ];
    }

    if (input.isRecurring && input.rrule) {
      doc.isRecurring = true;
      doc.rrule = input.rrule;
    }

    if (input.roomText?.trim()) {
      doc.roomText = input.roomText.trim();
    }

    if (input.organizerText?.trim()) {
      doc.organizerText = input.organizerText.trim();
    }

    if (input.submittedByOrganization?.trim()) {
      doc.submittedByOrganization = input.submittedByOrganization.trim();
    }

    if (input.isInternalEvent) {
      doc.isInternalEvent = true;
    }

    if (input.isFree) {
      doc.isFree = true;
    } else {
      if (input.priceOrdinar !== undefined && input.priceOrdinar >= 0) {
        doc.priceOrdinar = input.priceOrdinar;
      }
      if (input.priceStudent !== undefined && input.priceStudent >= 0) {
        doc.priceStudent = input.priceStudent;
      }
      if (input.priceMedlem !== undefined && input.priceMedlem >= 0) {
        doc.priceMedlem = input.priceMedlem;
      }
    }

    const ticketUrl = sanitizeUrl(input.ticketUrl);
    if (ticketUrl) doc.ticketUrl = ticketUrl;

    const facebookUrl = sanitizeUrl(input.facebookUrl);
    if (facebookUrl) doc.facebookUrl = facebookUrl;

    if (input.eventTypeId) {
      doc.eventType = {
        _type: "reference",
        _ref: input.eventTypeId,
      };
    }

    if (input.imageAssetId) {
      doc.image = {
        _type: "image",
        asset: { _type: "reference", _ref: input.imageAssetId },
      };
    }

    if (input.room) {
      doc.room = {
        _type: "reference",
        _ref: input.room,
      };
    }

    if (input.organizerGroup) {
      doc.organizerGroup = {
        _type: "reference",
        _ref: input.organizerGroup,
      };
    }

    const created = await client.create(doc);
    return ok(created._id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return err(message);
  }
}
