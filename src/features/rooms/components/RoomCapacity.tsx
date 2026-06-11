interface RoomCapacityProps {
  standing?: number | null
  seated?: number | null
}

export function RoomCapacity({ standing, seated }: RoomCapacityProps) {
  const parts = [
    standing != null && `${standing} stående`,
    seated != null && `${seated} sittende`,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return <>{parts.join(" / ")}</>
}
