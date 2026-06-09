import { addHoursToDateTime, toDateTime } from "./datetime"
import type { EventRequestBody } from "./types"

// IDs from the live Crescat form (reverse-engineered from HAR)
const KARAOKE_SLUG = "studentersamfunnet-i-bergen-booking-av-karoke"
const KARAOKE_ROOM_ID = 98
const KARAOKE_FIELD_PEOPLE_ID = 1439211
const KARAOKE_META_PARENT_ID = 192383

export { KARAOKE_SLUG }

export interface KaraokeBookingInput {
  eventName: string
  startDate: string
  startTime: string
  durationHours: number
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  numberOfPeople: number
  priceType: "ordinær" | "student" | "frivillig"
}

export function buildKaraokeRequest(
  input: KaraokeBookingInput,
): EventRequestBody {
  const start = toDateTime(input.startDate, input.startTime)
  const end = addHoursToDateTime(
    input.startDate,
    input.startTime,
    input.durationHours,
  )

  const packageDescription = [
    "Vi tilbyr flere pakkeløsninger.",
    "Drikke kan bestilles som tillegg.",
    "",
    "Ordinær pakke:",
    "- Timepris på 79 kroner per person",
    "- Minimumspris på 395 kroner per time",
    "",
    "STUDENT:",
    "- Timepris på 59 kroner per person",
    "- Minimumspris på 295 kroner per time",
  ].join("\n")

  return {
    name: input.eventName,
    start,
    end,
    description: input.description,
    request_by_email: input.contactEmail,
    request_by_name: input.contactName,
    request_by_phone: input.contactPhone,
    request_by_country_code: "+47",
    model_id: null,
    model_type: null,
    sections: [
      {
        title: "Velg et rom!",
        description: "",
        type: "roomBooking",
        content: {
          roomBookings: [
            {
              title: "",
              room_id: KARAOKE_ROOM_ID,
              start,
              end,
            },
          ],
          description: "",
        },
      },
      {
        title: "Valg av karaokepakke",
        description: packageDescription,
        type: "metaData",
        content: {
          fields: [
            {
              id: KARAOKE_FIELD_PEOPLE_ID,
              title: "Antall personer",
              value: input.numberOfPeople,
              component: "field-number",
              options: null,
              class: "col-md-3",
              linebreak_after: false,
              required: false,
            },
          ],
          parent_id: KARAOKE_META_PARENT_ID,
        },
      },
      {
        title: "Akseptering av bruksvilkår",
        description:
          "Ved å krysse av denne boksen aksepterer jeg at jeg har lest, forstått og at jeg godkjenner vilkårene",
        type: "termsOfUse",
        content: { accepted: true },
      },
    ],
  }
}
