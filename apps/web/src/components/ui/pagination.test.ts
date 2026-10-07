import { expect, it } from "vitest"

import { pageNumbers } from "./pagination"

it("lists first, last and neighbouring pages with gaps", () => {
  expect(pageNumbers(5, 9)).toEqual([1, null, 4, 5, 6, null, 9])
  expect(pageNumbers(1, 3)).toEqual([1, 2, 3])
  expect(pageNumbers(1, 1)).toEqual([1])
})
