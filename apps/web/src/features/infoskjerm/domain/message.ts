// Some signage URL pipelines interpret UTF-8 Norwegian letters as Latin-1 or
// Windows-1252, then encode the corrupted text into the message parameter.
// Repair only those known pairs after Next.js has decoded the query string.
const norwegianLetters: Record<string, string> = {
  "Ã¦": "æ",
  "Ã¸": "ø",
  "Ã¥": "å",
  "Ã†": "Æ",
  "Ã˜": "Ø",
  "Ã…": "Å",
  "Ã\u0086": "Æ",
  "Ã\u0098": "Ø",
  "Ã\u0085": "Å",
}

/**
 * Signage hotpatch: UTF-8 interpreted as Latin-1/Windows-1252 can turn
 * "spør" into "spÃ¸r" before the player URL-encodes its message.
 * After Next.js decodes the query, repair only the known æøåÆØÅ pairs.
 * Correctly encoded Norwegian, mixed Unicode/emoji and literal percent
 * escapes stay unchanged. Do not decodeURIComponent here: the query has
 * already been decoded, and another pass could alter intentional text.
 * This repairs display text without rewriting Scala's saved URL; correct
 * that URL in the player configuration to remove the underlying cause.
 */
export function getScreenMessage(
  message: string | string[] | undefined,
): string | undefined {
  const text = (Array.isArray(message) ? message[0] : message)?.trim()
  return text?.replace(
    /Ã[¦¸¥†˜…\u0086\u0098\u0085]/g,
    pair => norwegianLetters[pair],
  )
}
