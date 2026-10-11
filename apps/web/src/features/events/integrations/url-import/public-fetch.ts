import { lookup } from "node:dns/promises"
import { BlockList, isIP } from "node:net"

// Editors paste arbitrary links, so the server must never be steered towards
// loopback, private, link-local or cloud metadata addresses.
const blocked = new BlockList()
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4")
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const)
  blocked.addSubnet(network, prefix, "ipv6")

export class UnsafeUrlError extends Error {
  constructor() {
    super("URL is not a public web page")
  }
}

export type ResolveHost = (
  hostname: string,
) => Promise<{ address: string; family: number }[]>

const resolveHost: ResolveHost = hostname => lookup(hostname, { all: true })

export async function assertPublicUrl(
  value: string,
  resolve: ResolveHost = resolveHost,
): Promise<URL> {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new UnsafeUrlError()
  }
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port)) ||
    isIP(host) ||
    !host.includes(".") ||
    /\.(?:local|localhost|internal)$/i.test(host)
  )
    throw new UnsafeUrlError()
  const addresses = await resolve(host)
  if (
    !addresses.length ||
    addresses.some(({ address, family }) =>
      blocked.check(address, family === 6 ? "ipv6" : "ipv4"),
    )
  )
    throw new UnsafeUrlError()
  return url
}

async function readBounded(response: Response, maxBytes: number) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error("Empty source response")
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error("Source exceeds size limit")
    }
    chunks.push(value)
  }
  return new Response(Buffer.concat(chunks), { headers: response.headers })
}

/** Fetch a public page, re-checking every redirect hop. */
export async function fetchPublic(
  value: string,
  maxBytes = 2_000_000,
  resolve: ResolveHost = resolveHost,
): Promise<Response> {
  let url = await assertPublicUrl(value, resolve)
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: {
        "user-agent": "SamfunnetBot/1.0 (+https://samfunnetibergen.no)",
        accept: "text/html,application/xhtml+xml,image/*",
      },
      cache: "no-store",
    })
    const location = response.headers.get("location")
    if (response.status >= 300 && response.status < 400 && location) {
      url = await assertPublicUrl(new URL(location, url).href, resolve)
      continue
    }
    if (!response.ok) throw new Error(`Source HTTP ${response.status}`)
    return readBounded(response, maxBytes)
  }
  throw new Error("Too many redirects")
}
