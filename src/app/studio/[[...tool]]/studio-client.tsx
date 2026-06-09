"use client";

import dynamicImport from "next/dynamic";

const StudioClient = dynamicImport(
  async () => {
    const [{ NextStudio }, { default: config }] = await Promise.all([
      import("next-sanity/studio"),
      import("../../../../sanity.config"),
    ]);
    return function Studio() {
      return <NextStudio config={config} unstable__noScript={false} />;
    };
  },
  { ssr: false },
);

export default function StudioClientPage() {
  return <StudioClient />;
}
