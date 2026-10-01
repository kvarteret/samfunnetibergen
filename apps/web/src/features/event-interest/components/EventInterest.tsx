"use client"

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
  type InterestState,
  interestLevel,
  interestWeight,
  MAX_TAPS,
  validTaps,
} from "../domain/interest"
import styles from "./EventInterest.module.css"

const particleAngles = Array.from({ length: 14 }, (_, index) => index * 137.5)

export function EventInterest({ eventSlug }: { eventSlug: string }) {
  const t = useTranslations("EventInterest")
  const locale = useLocale()
  const id = useId()
  const endpoint = `/api/event-interest/${encodeURIComponent(eventSlug)}?locale=${locale}`
  const [saved, setSaved] = useState<InterestState | null>(null)
  const [taps, setTaps] = useState(0)
  const [failed, setFailed] = useState(false)
  const [sending, setSending] = useState(false)
  const [burst, setBurst] = useState(0)
  const initialized = useRef(false)
  const loadSequence = useRef(0)
  const desired = useRef(0)
  const acknowledged = useRef(0)
  const busy = useRef(false)
  const mounted = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const character = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLElement>(null)
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
      if (!validTaps(result.taps)) throw new Error("Invalid response")
      if (!mounted.current || sequence !== loadSequence.current) return
      desired.current = acknowledged.current = result.taps
      setTaps(result.taps)
      setSaved(result)
    } catch {
      if (mounted.current) setFailed(true)
    }
  }, [endpoint])

  const flush = useCallback(async () => {
    if (busy.current || desired.current === acknowledged.current) return
    busy.current = true
    setSending(true)
    setFailed(false)
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
      // Absolute cumulative counts make retries safe. Serialize requests so the
      // first cookie is established before later taps leave this browser.
      while (mounted.current && desired.current !== acknowledged.current) {
        const sent = desired.current
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taps: sent }),
          signal: AbortSignal.timeout(6000),
          keepalive: true,
        })
        if (!response.ok) throw new Error("Unable to save")
        const result: InterestState = await response.json()
        if (!validTaps(result.taps)) throw new Error("Invalid response")
        if (!mounted.current) return
        if (sent === 0) initialized.current = false
        acknowledged.current = result.taps
        // Another tab may have already saved a higher level.
        if (sent > 0) desired.current = Math.max(desired.current, result.taps)
        setTaps(desired.current)
        setSaved(result)
      }
    } catch {
      if (mounted.current) setFailed(true)
    } finally {
      busy.current = false
      if (mounted.current) setSending(false)
    }
  }, [endpoint])

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
      document.removeEventListener("visibilitychange", onHide)
    }
  }, [load, flush])

  const level = interestLevel(taps)
  const pending = saved !== null && taps !== saved.taps
  const label =
    level === 0
      ? "maybe"
      : level === 1
        ? "maybe"
        : level === 2
          ? "coming"
          : "definitely"
  const score =
    saved === null
      ? null
      : saved.score - interestWeight(saved.taps) + interestWeight(taps)

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setBurst(previous => previous + 1)
    animation.current?.cancel()
    animation.current =
      character.current?.animate(
        [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(1.13, .82) rotate(-5deg)", offset: 0.22 },
          { transform: "scale(.94, 1.14) rotate(4deg)", offset: 0.48 },
          { transform: "scale(1.04, .97) rotate(-2deg)", offset: 0.75 },
          { transform: "scale(1) rotate(0deg)" },
        ],
        { duration: 540, easing: "cubic-bezier(.22,.68,.3,1)" },
      ) ?? null
  }

  function tap() {
    celebrate()
    desired.current = Math.min(MAX_TAPS, desired.current + 1)
    setTaps(desired.current)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), 350)
  }

  return (
    <section
      ref={panel}
      className={styles.panel}
      aria-labelledby={`${id}-title`}
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
            (event.clientX - rect.left - rect.width / 2) / (rect.width / 2),
          ),
        )
        const y = Math.max(
          -1,
          Math.min(
            1,
            (event.clientY - rect.top - rect.height / 2) / (rect.height / 2),
          ),
        )
        event.currentTarget.style.setProperty("--look-x", `${x * 3}px`)
        event.currentTarget.style.setProperty("--look-y", `${y * 2}px`)
        event.currentTarget.style.setProperty("--tilt", `${x * 5}deg`)
      }}
      onPointerLeave={() => {
        panel.current?.style.setProperty("--look-x", "0px")
        panel.current?.style.setProperty("--look-y", "0px")
        panel.current?.style.setProperty("--tilt", "0deg")
      }}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        {t("title")}
      </h2>
      <div className={styles.stage} data-level={level}>
        <button
          type="button"
          className={styles.button}
          disabled={saved === null}
          aria-label={t("tapLabel", { level: t(label) })}
          aria-describedby={`${id}-hint`}
          onClick={tap}
        >
          <span className={styles.tilt}>
            <span ref={character} className={styles.character}>
              <span
                className={styles.fill}
                style={
                  {
                    "--fill": `${taps === 0 ? 0 : 18 + (taps / MAX_TAPS) * 82}%`,
                  } as CSSProperties
                }
              />
              <svg
                className={styles.face}
                aria-hidden="true"
                viewBox="0 0 64 48"
              >
                <g className={styles.eyes}>
                  {level < 3 ? (
                    <>
                      <ellipse cx="22" cy="20" rx="3" ry="4" />
                      <ellipse cx="42" cy="20" rx="3" ry="4" />
                    </>
                  ) : (
                    <path
                      d="M17 21q5-10 10 0M37 21q5-10 10 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}
                </g>
                {level < 2 ? (
                  <path
                    d="M25 31q7 7 14 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path d="M23 29h18q-1 14-9 14t-9-14" />
                    <path d="M27 39q5-6 10 0" fill="#f26887" />
                  </>
                )}
                <ellipse
                  cx="14"
                  cy="29"
                  rx="5"
                  ry="2.5"
                  fill="#f26887"
                  opacity={level ? ".7" : "0"}
                />
                <ellipse
                  cx="50"
                  cy="29"
                  rx="5"
                  ry="2.5"
                  fill="#f26887"
                  opacity={level ? ".7" : "0"}
                />
              </svg>
              <span className={styles.label}>{t(label)}</span>
              <span className={styles.shine} />
            </span>
          </span>
        </button>
        {burst > 0 && (
          <span key={burst} className={styles.particles} aria-hidden="true">
            {particleAngles.slice(0, level >= 3 ? 14 : 8).map(angle => (
              <span
                key={angle}
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--distance": `${58 + (angle % 4) * 18}px`,
                    "--delay": `${(angle % 3) * 18}ms`,
                  } as CSSProperties
                }
              >
                {angle % 3 === 0 ? "✦" : angle % 3 < 1.5 ? "●" : "✧"}
              </span>
            ))}
          </span>
        )}
      </div>
      <p id={`${id}-hint`} className={styles.hint}>
        {t(taps >= MAX_TAPS ? "maxHint" : "hint")}
      </p>
      <div className={styles.total}>
        <span>{t("score")}</span>
        <strong>
          {score === null
            ? "—"
            : new Intl.NumberFormat(locale, {
                maximumFractionDigits: 2,
              }).format(score)}
        </strong>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {failed
          ? t("error")
          : sending || pending
            ? t("saving")
            : saved === null
              ? t("loading")
              : taps > 0
                ? t("saved")
                : t("empty")}
      </p>
      <div className={styles.actions}>
        {failed && (
          <button
            type="button"
            onClick={() => void (saved === null ? load() : flush())}
          >
            {t("retry")}
          </button>
        )}
        {saved !== null && taps > 0 && (
          <button
            type="button"
            disabled={sending || pending}
            onClick={() => {
              desired.current = 0
              setTaps(0)
              void flush()
            }}
          >
            {t("reset")}
          </button>
        )}
      </div>
      <details className={styles.privacy}>
        <summary>{t("privacyTitle")}</summary>
        <p>{t("privacy")}</p>
      </details>
    </section>
  )
}
