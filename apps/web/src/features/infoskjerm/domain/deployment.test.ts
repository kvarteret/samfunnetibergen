/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import {
  DEPLOYMENT_CHECK_INTERVAL_MS,
  watchScreenDeployment,
} from "./deployment"

const fetchMock = vi.fn<typeof fetch>()
const reload = vi.fn()
let stop: (() => void) | undefined

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  reload.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  stop?.()
  stop = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function flush() {
  await vi.advanceTimersByTimeAsync(0)
}

it("keeps matching deployments and reloads once when a new deployment appears", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ deploymentId: "old" }))
    .mockResolvedValue(Response.json({ deploymentId: "new" }))
  stop = watchScreenDeployment("old", reload)
  await flush()
  expect(reload).not.toHaveBeenCalled()
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/infoskjerm/version",
    expect.objectContaining({ cache: "no-store", credentials: "omit" }),
  )
  expect(fetchMock.mock.calls[0][1]?.headers).toBeUndefined()
  await vi.advanceTimersByTimeAsync(60 * 60 * 1_000 - 1)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(reload).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it.each([
  null,
  {},
  { deploymentId: null },
  { deploymentId: " " },
  { deploymentId: 1 },
])("keeps displaying for invalid version responses: %j", async data => {
  fetchMock.mockResolvedValue(Response.json(data))
  stop = watchScreenDeployment("old", reload)
  await flush()
  expect(reload).not.toHaveBeenCalled()
})

it("retries network errors, non-success responses, and malformed JSON", async () => {
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
    .mockResolvedValueOnce(new Response("not JSON"))
    .mockResolvedValueOnce(Response.json({ deploymentId: "new" }))
  stop = watchScreenDeployment("old", reload)
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS * 2)
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS)
  expect(reload).toHaveBeenCalledTimes(1)
})

it("avoids overlap, aborts hung requests, and retries", async () => {
  fetchMock.mockImplementationOnce(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        )
      }),
  )
  fetchMock.mockResolvedValue(Response.json({ deploymentId: "old" }))
  stop = watchScreenDeployment("old", reload)
  window.dispatchEvent(new Event("online"))
  expect(fetchMock).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(10_000)
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true)
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(reload).not.toHaveBeenCalled()
})

it("checks immediately on visibility and network recovery", async () => {
  fetchMock.mockResolvedValue(Response.json({ deploymentId: "old" }))
  stop = watchScreenDeployment("old", reload)
  await flush()
  document.dispatchEvent(new Event("visibilitychange"))
  await flush()
  window.dispatchEvent(new Event("online"))
  await flush()
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

it("aborts on cleanup, ignores late responses, and removes listeners and timers", async () => {
  let resolve: (response: Response) => void = () => {}
  fetchMock.mockReturnValue(
    new Promise(done => {
      resolve = done
    }),
  )
  stop = watchScreenDeployment("old", reload)
  stop()
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true)
  resolve(Response.json({ deploymentId: "new" }))
  await flush()
  window.dispatchEvent(new Event("online"))
  document.dispatchEvent(new Event("visibilitychange"))
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS * 2)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(reload).not.toHaveBeenCalled()
})

it("does not poll when the loaded document has no deployment ID", async () => {
  stop = watchScreenDeployment(undefined, reload)
  await vi.advanceTimersByTimeAsync(DEPLOYMENT_CHECK_INTERVAL_MS)
  expect(fetchMock).not.toHaveBeenCalled()
})
