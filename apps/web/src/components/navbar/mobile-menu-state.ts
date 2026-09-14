export function toggleMobileMenuGroup(
  openItemKey: string | null,
  itemKey: string,
): string | null {
  return openItemKey === itemKey ? null : itemKey
}

export function resetMobileMenuState(): null {
  return null
}
