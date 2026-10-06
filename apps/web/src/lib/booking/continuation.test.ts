import { expect, test, vi } from "vitest"

vi.mock("next/headers", () => ({ cookies: vi.fn() }))

import { signBookingReceipt, verifyBookingReceipt } from "./continuation"

test("receipt is bound to signature, identity and expiration", () => {
  const id = "123e4567-e89b-42d3-a456-426614174001"
  const secret = "0123456789abcdef0123456789abcdef"
  const token = signBookingReceipt(id, id, secret, 1000)
  expect(verifyBookingReceipt(token, secret, 2000)?.receiptId).toBe(id)
  expect(verifyBookingReceipt(`${token}x`, secret, 2000)).toBeNull()
  expect(verifyBookingReceipt(token, "different", 2000)).toBeNull()
  expect(verifyBookingReceipt(token, secret, 3601000)).toBeNull()
})
