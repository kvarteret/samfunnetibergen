/** Format Mime's answer and its referenced URLs for Slack Block Kit. */
const SECTION_LIMIT = 2900
const ANSWER_LIMIT = 36000
const LINK_LIMIT = 2000
const MAX_LINKS = 30

const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

type Link = { url: string; label: string }

/** Only surface actual HTTPS links in the answer; never construct a destination. */
export function relevantLinks(answer: string): Link[] {
  const links = new Map<string, Link>()
  // Code is illustrative text, not a source to promote into a link list.
  const prose = answer.replace(/```[\s\S]*?```|`[^`\n]*`/g, " ")
  const pattern =
    /<(https:\/\/[^\s<>|]+)(?:\|([^<>\n]+))?>|\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|(?<![\w/])(https:\/\/[^\s<>]+)/g
  for (const match of prose.matchAll(pattern)) {
    const raw = match[1] ?? match[4] ?? match[5].replace(/[.,;!?]+$/, "")
    const url = raw.replace(/&amp;/g, "&")
    try {
      const parsed = new URL(url)
      if (
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password ||
        url.length > LINK_LIMIT ||
        /[<>|\s]/.test(url)
      )
        continue
      const key = parsed.href
      const name = (match[2] ?? match[3] ?? parsed.hostname).trim()
      if (!name || links.has(key)) continue
      links.set(key, { url, label: name.slice(0, 120) })
      if (links.size >= MAX_LINKS) break
    } catch {
      // Invalid URLs remain in the answer, but aren't promoted to references.
    }
  }
  return [...links.values()]
}

/** Split on whitespace outside Slack links, keeping each link intact when possible. */
function sections(text: string): string[] {
  const chunks: string[] = []
  let current = ""
  const tokens = text.match(/<https:\/\/[^<>\n]+>|\S+|\s+/g) ?? []
  for (let token of tokens) {
    while (token.length) {
      const remaining = SECTION_LIMIT - current.length
      if (token.length <= remaining) {
        current += token
        break
      }
      if (current.trim()) {
        chunks.push(current.trim())
        current = ""
      } else {
        const part = token.slice(0, SECTION_LIMIT)
        if (part.trim()) chunks.push(part)
        current = ""
        token = token.slice(SECTION_LIMIT)
      }
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export function responseBlocks(answer: string) {
  const bounded =
    answer.length > ANSWER_LIMIT
      ? `${answer.slice(0, ANSWER_LIMIT - 1)}…`
      : answer
  const blocks = sections(bounded).map(text => ({
    type: "section",
    text: { type: "mrkdwn", text },
  }))
  const lines = relevantLinks(bounded).map(
    ({ url, label }) => `• <${escapeSlack(url)}|${escapeSlack(label)}>`,
  )
  const safeLines = lines.filter(line => line.length <= SECTION_LIMIT)
  if (safeLines.length) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "*Nyttige lenker*" },
    })
    for (const group of sections(safeLines.join("\n"))) {
      if (blocks.length >= 42) break
      blocks.push({ type: "section", text: { type: "mrkdwn", text: group } })
    }
  }
  return blocks
}
