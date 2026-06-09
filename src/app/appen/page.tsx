import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

const APP_STORE_URL = "https://apps.apple.com/app/kvarteret/id6578415973"
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.kvarteret.internbevis.intern_bevis_kvarteret&hl=no"

function IconApple() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="size-5 shrink-0"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function IconAndroid() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="size-5 shrink-0"
    >
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
    </svg>
  )
}

export default async function AppenPage() {
  const h = await headers()
  const ua = (h.get("user-agent") ?? "").toLowerCase()

  if (/android/.test(ua)) redirect(GOOGLE_PLAY_URL)
  if (/iphone|ipad|ipod/.test(ua)) redirect(APP_STORE_URL)

  // Desktop / unknown — show both options
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 bg-background">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl">Last ned appen</h1>
        <p className="text-foreground/60 text-sm">
          Tilgjengelig for iOS og Android
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={APP_STORE_URL}
          rel="noreferrer"
          target="_blank"
          className="flex items-center gap-3 border border-border bg-card hover:bg-muted transition-colors px-5 py-3 rounded"
        >
          <IconApple />
          <span className="text-sm font-medium leading-tight">
            <span className="block text-[10px] text-foreground/50 uppercase tracking-wide">
              Last ned på
            </span>
            App Store
          </span>
        </a>

        <a
          href={GOOGLE_PLAY_URL}
          rel="noreferrer"
          target="_blank"
          className="flex items-center gap-3 border border-border bg-card hover:bg-muted transition-colors px-5 py-3 rounded"
        >
          <IconAndroid />
          <span className="text-sm font-medium leading-tight">
            <span className="block text-[10px] text-foreground/50 uppercase tracking-wide">
              Last ned på
            </span>
            Google Play
          </span>
        </a>
      </div>

      <Link
        href="/nb"
        className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        ← Tilbake til forsiden
      </Link>
    </main>
  )
}
