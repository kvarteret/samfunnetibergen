"use client"

import { useEffect, useRef } from "react"
import type { PartyAction, PartyInput } from "./input"

const actions: { action: PartyAction; label: string; symbol: string }[] = [
  { action: "left", label: "Venstre", symbol: "←" },
  { action: "right", label: "Høyre", symbol: "→" },
  { action: "drop", label: "Hopp ned", symbol: "↓" },
  { action: "jump", label: "Hopp / dobbelthopp", symbol: "↑" },
]

export function TouchControls({ input }: { input: PartyInput }) {
  const heldPointers = useRef(new Set<string>())
  useEffect(() => {
    const pointers = heldPointers.current
    const release = () => {
      for (const source of pointers) input.release(source)
      pointers.clear()
    }
    const onVisibility = () => {
      if (document.hidden) release()
    }
    window.addEventListener("blur", release)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      release()
      window.removeEventListener("blur", release)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [input])

  return (
    <fieldset
      className="party-touch-controls"
      data-party-controls
      aria-label="Spillkontroller"
    >
      {actions.map(({ action, label, symbol }) => (
        <button
          type="button"
          key={action}
          aria-label={label}
          onPointerDown={event => {
            if (event.button !== 0) return
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            const source = `pointer:${event.pointerId}`
            heldPointers.current.add(source)
            input.press(source, action)
          }}
          onPointerUp={event => {
            const source = `pointer:${event.pointerId}`
            heldPointers.current.delete(source)
            input.release(source)
          }}
          onPointerCancel={event => {
            const source = `pointer:${event.pointerId}`
            heldPointers.current.delete(source)
            input.release(source)
          }}
          onLostPointerCapture={event => {
            const source = `pointer:${event.pointerId}`
            heldPointers.current.delete(source)
            input.release(source)
          }}
          onKeyDown={event => {
            if (event.key !== " " && event.key !== "Enter") return
            event.preventDefault()
            input.press(`button:${action}:${event.key}`, action)
          }}
          onKeyUp={event => input.release(`button:${action}:${event.key}`)}
          onBlur={() => {
            input.release(`button:${action}: `)
            input.release(`button:${action}:Enter`)
          }}
        >
          <span aria-hidden>{symbol}</span>
        </button>
      ))}
    </fieldset>
  )
}
