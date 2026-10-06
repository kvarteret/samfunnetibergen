/** Remove TicketCo marketing labels while preserving artist spelling. */
export function editorialArtistTitle(title: string): string {
  return title
    .split(/\s*\/\/\s*/)[0]
    .replace(/\s+(?:support|supp\.)\s*:?\s*.*$/i, "")
    .replace(/^(?:konsert med|concert with)\s+/i, "")
    .trim()
}
