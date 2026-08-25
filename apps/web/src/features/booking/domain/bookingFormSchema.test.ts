import { describe, expect, test } from "vitest"
import { bookingFormSchema } from "./bookingFormSchema"
import { initialBookingState } from "./formState"

const validBooking = {
  ...initialBookingState,
  selectedRoomIds: [95],
  eventName: "Testarrangement",
  startDate: "2026-08-20",
  doorsTimes: ["18:00"],
  furniture: "Bord og stoler",
  invoiceAddress: "Testadresse 1",
  contactName: "Kari Nordmann",
  contactEmail: "kari@example.com",
  acceptTerms: true,
}

describe("bookingFormSchema", () => {
  test("distinguishes missing public doors time from get-in and get-out", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      doorsTimes: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["doorsTimes"],
            message: "Velg når dørene åpner for publikum.",
          }),
        ]),
      )
    }
  })

  test("accepts whitespace around an optional organization number", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      orgNumber: "  123456789  ",
    })

    expect(result.success).toBe(true)
  })

  test("rejects an organization number containing letters", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      orgNumber: "123ABC",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path[0] === "orgNumber"),
      ).toBe(true)
    }
  })

  test("accepts only E.164 when an optional phone number is provided", () => {
    expect(
      bookingFormSchema.safeParse({
        ...validBooking,
        contactPhone: "+447400123456",
      }).success,
    ).toBe(true)
    expect(
      bookingFormSchema.safeParse({
        ...validBooking,
        contactPhone: "7400 123456",
      }).success,
    ).toBe(false)
  })

  test("keeps conditional student organization and ticket rules in the schema", () => {
    const studentOrg = bookingFormSchema.safeParse({
      ...validBooking,
      bookerType: "studentorg",
      studentOrgName: "",
    })
    const paid = bookingFormSchema.safeParse({
      ...validBooking,
      freeOrPaid: "Betalt",
      ticketTypes: [{ name: "", price: "" }],
    })

    expect(studentOrg.success).toBe(false)
    expect(paid.success).toBe(false)
  })
})
