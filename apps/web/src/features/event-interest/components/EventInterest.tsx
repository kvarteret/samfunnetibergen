"use client"

import { Popover } from "@base-ui/react/popover"
import { useLocale, useTranslations } from "next-intl"
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import {
  type ClickBatch,
  FULL_HEART_TAPS,
  type InterestState,
  interestLevel,
  MAX_BATCH_CLICKS,
  validInterest,
} from "../domain/interest"
import { captureInterest } from "./analytics"
import styles from "./EventInterest.module.css"

export function EventInterest({ eventSlug }: { eventSlug: string }) {
  const t = useTranslations("EventInterest")
  const locale = useLocale()
  const id = useId()
  const endpoint = `/api/event-interest/${encodeURIComponent(eventSlug)}?locale=${locale}`
  const [saved, setSaved] = useState<InterestState | null>(null)
  const [taps, setTaps] = useState(0)
  const [failed, setFailed] = useState(false)
  const [sending, setSending] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const initialized = useRef(false)
  const loadSequence = useRef(0)
  const desired = useRef(0)
  const unsaved = useRef(0)
  const inFlight = useRef<ClickBatch | null>(null)
  const busy = useRef(false)
  const mounted = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const character = useRef<HTMLSpanElement>(null)
  const animation = useRef<Animation | null>(null)

  const load = useCallback(async () => {
    setFailed(false)
    const sequence = ++loadSequence.current
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      })
      if (!response.ok) throw new Error("Unavailable")
      const result: InterestState = await response.json()
      if (!validInterest(result)) throw new Error("Invalid response")
      if (!mounted.current || sequence !== loadSequence.current) return
      desired.current = result.taps
      setTaps(result.taps)
      setSaved(result)
      captureInterest("loaded", eventSlug, locale, {
        taps: result.taps,
        count: result.count,
      })
    } catch {
      if (mounted.current && sequence === loadSequence.current) {
        setFailed(true)
        captureInterest("failed", eventSlug, locale, { phase: "load" })
      }
    }
  }, [endpoint, eventSlug, locale])

  const flush = useCallback(async () => {
    if (busy.current || unsaved.current === 0) return
    busy.current = true
    setSending(true)
    setFailed(false)
    let phase: "initialize" | "save" = "initialize"
    try {
      if (!initialized.current) {
        // Establish the source cookie before any database write. If the first
        // response is lost, retrying initialization cannot duplicate a vote.
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initialize: true }),
          signal: AbortSignal.timeout(6000),
        })
        if (!response.ok) throw new Error("Unable to initialize")
        initialized.current = true
      }
      phase = "save"
      // Keep the same batch ID after a lost response. New clicks queue behind it;
      // independent tabs send distinct batches, so every click counts once.
      while (mounted.current && unsaved.current > 0) {
        const batch = inFlight.current ?? {
          clicks: Math.min(MAX_BATCH_CLICKS, unsaved.current),
          batch_id: crypto.randomUUID(),
        }
        inFlight.current = batch
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          signal: AbortSignal.timeout(6000),
          keepalive: true,
        })
        if (!response.ok) throw new Error("Unable to save")
        const result: InterestState = await response.json()
        if (!validInterest(result)) throw new Error("Invalid response")
        if (!mounted.current) return
        unsaved.current -= batch.clicks
        inFlight.current = null
        desired.current = result.taps + unsaved.current
        setTaps(desired.current)
        setSaved(result)
        captureInterest("batch_saved", eventSlug, locale, {
          requested_clicks: batch.clicks,
          taps: result.taps,
          count: result.count,
        })
      }
    } catch {
      if (mounted.current) {
        setFailed(true)
        captureInterest("failed", eventSlug, locale, { phase })
      }
    } finally {
      busy.current = false
      if (mounted.current) setSending(false)
    }
  }, [endpoint, eventSlug, locale])

  useEffect(() => {
    mounted.current = true
    void load()
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush()
    }
    document.addEventListener("visibilitychange", onHide)
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      animation.current?.cancel()
      void audio.current?.close().catch(() => {})
      audio.current = null
      document.removeEventListener("visibilitychange", onHide)
    }
  }, [load, flush])

  const level = interestLevel(taps)
  const pending = unsaved.current > 0
  const count = saved === null ? null : saved.count + unsaved.current
  const label =
    level === 0
      ? "empty"
      : level === 1
        ? "maybe"
        : level === 2
          ? "coming"
          : "definitely"

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    animation.current?.cancel()
    animation.current =
      character.current?.animate(
        [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(.94, 1.04) rotate(-3deg)", offset: 0.22 },
          { transform: "scale(1.08, .96) rotate(2deg)", offset: 0.48 },
          { transform: "scale(.99, 1.02) rotate(-1deg)", offset: 0.75 },
          { transform: "scale(1) rotate(0deg)" },
        ],
        { duration: 380, easing: "cubic-bezier(.22,.68,.3,1)" },
      ) ?? null
  }

  async function playSound(full: boolean, amount: number) {
    try {
      const context = audio.current ?? new AudioContext()
      audio.current = context
      await context.resume()
      if (!mounted.current || context.state !== "running") return
      const notes = full ? [660, 830, 990] : [360 + amount * 25]
      for (const [index, frequency] of notes.entries()) {
        const start = context.currentTime + index * 0.075
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(frequency, start)
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * 0.7,
          start + 0.12,
        )
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.045, start + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.onended = () => {
          oscillator.disconnect()
          gain.disconnect()
        }
        oscillator.start(start)
        oscillator.stop(start + 0.18)
      }
    } catch {
      // Audio is optional: a blocked or unsupported context must not stop a tap.
    }
  }

  function tap() {
    if (desired.current >= FULL_HEART_TAPS) return
    const previous = desired.current
    desired.current = previous + 1
    unsaved.current += 1
    const justFilled =
      previous < FULL_HEART_TAPS && desired.current === FULL_HEART_TAPS
    captureInterest("tapped", eventSlug, locale, { taps: desired.current })
    if (justFilled)
      captureInterest("full", eventSlug, locale, { taps: desired.current })
    celebrate()
    void playSound(justFilled, Math.min(FULL_HEART_TAPS, desired.current))
    if (
      justFilled &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      setConfetti(true)
    setTaps(desired.current)
    if (!timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        void flush()
      }, 350)
  }

  const status = failed
    ? t(saved === null ? "loadError" : "saveError")
    : sending || pending
      ? t("saving")
      : saved === null
        ? t("loading")
        : taps > 0
          ? t("saved")
          : ""

  return (
    <section className={styles.panel} aria-label={t("title")}>
      <div className={styles.row} data-level={level}>
        <Popover.Root>
          <Popover.Trigger
            openOnHover
            type="button"
            className={styles.button}
            disabled={saved === null || taps >= FULL_HEART_TAPS}
            aria-label={t(
              taps >= FULL_HEART_TAPS ? "maxTapLabel" : "tapLabel",
              {
                level: t(label),
              },
            )}
            onClick={tap}
            onPointerMove={event => {
              if (
                event.pointerType !== "mouse" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return
              const rect = event.currentTarget.getBoundingClientRect()
              const x = Math.max(
                -1,
                Math.min(
                  1,
                  (event.clientX - rect.left - rect.width / 2) /
                    (rect.width / 2),
                ),
              )
              const y = Math.max(
                -1,
                Math.min(
                  1,
                  (event.clientY - rect.top - rect.height / 2) /
                    (rect.height / 2),
                ),
              )
              event.currentTarget.style.setProperty("--look-x", `${x * 3}px`)
              event.currentTarget.style.setProperty("--look-y", `${y * 2}px`)
              event.currentTarget.style.setProperty("--lean", `${x * 7}deg`)
            }}
            onPointerLeave={event => {
              event.currentTarget.style.setProperty("--look-x", "0px")
              event.currentTarget.style.setProperty("--look-y", "0px")
              event.currentTarget.style.setProperty("--lean", "0deg")
            }}
          >
            <span ref={character} className={styles.character}>
              <svg
                aria-hidden="true"
                viewBox="0 0 80 76"
                className={styles.heart}
              >
                <defs>
                  <linearGradient
                    id={`${id}-color`}
                    x1="0"
                    y1="0"
                    x2="0.35"
                    y2="1"
                  >
                    <stop stopColor="var(--amber-300)" />
                    <stop offset="1" stopColor="var(--color-primary)" />
                  </linearGradient>
                  <clipPath id={`${id}-shape`}>
                    <path d="M40 68C32 65 7 47 7 27C7 9 29 5 40 22C51 5 73 9 73 27C73 47 48 65 40 68Z" />
                  </clipPath>
                </defs>
                <path
                  className={styles.body}
                  d="M40 68C32 65 7 47 7 27C7 9 29 5 40 22C51 5 73 9 73 27C73 47 48 65 40 68Z"
                />
                <g clipPath={`url(#${id}-shape)`}>
                  <rect
                    className={styles.fill}
                    x="7"
                    y="8"
                    width="66"
                    height="60"
                    fill={`url(#${id}-color)`}
                    style={{
                      transform: `translateY(${60 * (1 - Math.min(1, taps / FULL_HEART_TAPS))}px)`,
                    }}
                  />
                </g>
                <path
                  d="M17 25q2-7 9-7"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity=".65"
                />
                <g className={styles.face}>
                  <g className={styles.eyes}>
                    {level < 3 ? (
                      <>
                        <ellipse cx="29" cy="36" rx="2.2" ry="3" />
                        <ellipse cx="51" cy="36" rx="2.2" ry="3" />
                      </>
                    ) : (
                      <path
                        d="M25 37q4-7 8 0M47 37q4-7 8 0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                  {level < 2 ? (
                    <path
                      d="M35 45q5 5 10 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path d="M33 44h14q-1 10-7 10t-7-10" />
                  )}
                </g>
              </svg>
            </span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="top" sideOffset={8} className="z-[100]">
              <Popover.Popup
                initialFocus={false}
                className="border-2 border-border bg-card px-3 py-2 text-sm text-foreground shadow-shadow outline-none"
              >
                <Popover.Title>{t("coming")}</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        {confetti && (
          <span
            className={styles.confetti}
            aria-hidden="true"
            onAnimationEnd={() => setConfetti(false)}
          >
            {Array.from({ length: 12 }, (_, index) => {
              const angle = Math.PI + (index / 11) * Math.PI
              const distance = 38 + (index % 3) * 13
              return (
                <i
                  key={angle}
                  style={
                    {
                      "--x": `${Math.cos(angle) * distance}px`,
                      "--y": `${Math.sin(angle) * distance - 12}px`,
                      "--turn": `${index * 67}deg`,
                      "--confetti-color": [
                        "var(--color-primary)",
                        "var(--amber-300)",
                        "#db7890",
                      ][index % 3],
                    } as CSSProperties
                  }
                />
              )
            })}
          </span>
        )}
      </div>
      <output
        aria-live="off"
        className={styles.count}
        aria-label={count === null ? t("loading") : t("countLabel", { count })}
      >
        {count === null ? "—" : new Intl.NumberFormat(locale).format(count)}
      </output>
      <div className={styles.feedback} data-visible={failed}>
        <p className={styles.status} role="status" aria-live="polite">
          {status}
        </p>
        {failed && (
          <button
            className={styles.action}
            type="button"
            onClick={() => {
              captureInterest("retried", eventSlug, locale, {
                phase: saved === null ? "load" : "save",
              })
              void (saved === null ? load() : flush())
            }}
          >
            {t("retry")}
          </button>
        )}
      </div>
    </section>
  )
}
