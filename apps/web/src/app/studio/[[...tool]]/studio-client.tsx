"use client"

import dynamicImport from "next/dynamic"

const StudioClient = dynamicImport(
  async () => {
    const [{ NextStudio }, studioConfig] = await Promise.all([
      import("next-sanity/studio"),
      import("@samfunnet/studio/config"),
    ])
    return function Studio() {
      return (
        <NextStudio
          config={studioConfig.embeddedConfig}
          unstable__noScript={false}
        />
      )
    }
  },
  { ssr: false },
)

export default function StudioClientPage() {
  return <StudioClient />
}
