interface RoomCapacityProps {
  standing?: number | null
  seated?: number | null
  standingLabel?: string
  seatedLabel?: string
}

export function RoomCapacity({
  standing,
  seated,
  standingLabel = "stående",
  seatedLabel = "sittende",
}: RoomCapacityProps) {
  const parts = [
    standing != null && `${standing} ${standingLabel}`,
    seated != null && `${seated} ${seatedLabel}`,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return <>{parts.join(" / ")}</>
}
