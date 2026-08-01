const norwegianLetters: Record<string, string> = {
  æ: "ae",
  ø: "o",
  å: "a",
}

export function studentGroupSlugFromName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("nb")
    .replace(/[æøå]/g, letter => norwegianLetters[letter] ?? letter)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
