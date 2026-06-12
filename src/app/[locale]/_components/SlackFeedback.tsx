"use client"

import { Loader2, Send } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field-group"
import { Textarea } from "@/components/ui/textarea"

const FIELD_ID = "slack-feedback-message"
const ERROR_ID = "slack-feedback-error"

export function SlackFeedback() {
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus("sending")
    try {
      const res = await fetch("/api/slack-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      setStatus("sent")
      setMessage("")
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <section className="bg-[#f54b4b] p-8 text-white shadow-hard-lg sm:p-12">
        <p className="font-heading text-2xl text-white">
          Takk for at du delte.
        </p>
        <p className="mt-1 text-lg text-white/75">Vi leser alt.</p>
      </section>
    )
  }

  return (
    <section className="bg-[#f54b4b] p-8 text-white shadow-hard-lg sm:p-12">
      <h2 className="font-heading text-3xl leading-none text-white sm:text-4xl">
        Noe på hjertet?
      </h2>
      <p className="mt-1 text-sm text-white/60">E-tjenesten lytter</p>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <FieldGroup
          className="max-w-xl"
          error={
            status === "error" ? "Something went wrong. Try again." : undefined
          }
          errorId={ERROR_ID}
        >
          <Textarea
            aria-describedby={status === "error" ? ERROR_ID : undefined}
            aria-invalid={status === "error"}
            id={FIELD_ID}
            onChange={e => setMessage(e.target.value)}
            placeholder="I dag så var jeg på &apos;the place to be&apos;, og der..."
            rows={2}
            value={message}
          />
        </FieldGroup>

        <Button
          disabled={!message.trim() || status === "sending"}
          type="submit"
          variant="neutral"
        >
          {status === "sending" ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send aria-hidden />
              Send
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
