import Script from "next/script";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Required for Sanity Manage dashboard compatibility */}
      <Script
        src="https://core.sanity-cdn.com/bridge.js"
        strategy="afterInteractive"
        type="module"
      />
      {children}
    </>
  );
}
