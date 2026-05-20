"use client"

import { usePathname } from "next/navigation"
import { posthog } from "posthog-js"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FeedbackType = "bug" | "feature" | "improvement"
type Status = "idle" | "submitting" | "submitted" | "error"

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
    { value: "bug", label: "Feil / noe fungerer ikke" },
    { value: "feature", label: "Forslag til ny funksjon" },
    { value: "improvement", label: "Annen tilbakemelding" },
]

export function FeedbackForm() {
    const pathname = usePathname()
    const [message, setMessage] = useState("")
    const [type, setType] = useState<FeedbackType>("improvement")
    const [contactEmail, setContactEmail] = useState("")
    const [status, setStatus] = useState<Status>("idle")

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!message.trim() || status === "submitting") return

        setStatus("submitting")

        const posthogSessionUrl =
            typeof posthog.get_session_replay_url === "function"
                ? posthog.get_session_replay_url({ withTimestamp: true })
                : undefined

        await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message.trim(),
                type,
                page: pathname,
                contactEmail: contactEmail.trim() || undefined,
                posthogSessionUrl,
            }),
        }).catch(() => {
            // Intentionally swallowed — always show success to the user.
        })

        setStatus("submitted")
    }

    if (status === "submitted") {
        return (
            <div className="space-y-2 border-2 border-border bg-card p-6">
                <p className="font-heading text-sm text-foreground">Takk for tilbakemeldingen!</p>
                <p className="text-sm text-foreground/60">
                    Vi har mottatt meldingen din og vil se på den.
                </p>
            </div>
        )
    }

    return (
        <form className="space-y-5" onSubmit={event => void handleSubmit(event)}>
            <div className="space-y-2">
                <Label htmlFor="feedback-type">Type tilbakemelding</Label>
                <select
                    className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    id="feedback-type"
                    value={type}
                    onChange={event => setType(event.target.value as FeedbackType)}
                >
                    {TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="feedback-message">
                    Melding <span aria-hidden>*</span>
                </Label>
                <Textarea
                    id="feedback-message"
                    name="message"
                    placeholder="Beskriv det du har lagt merke til eller foreslår..."
                    required
                    rows={5}
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="feedback-email">
                    E-post{" "}
                    <span className="text-foreground/50 font-normal text-xs">(valgfritt)</span>
                </Label>
                <Input
                    autoComplete="email"
                    id="feedback-email"
                    name="contactEmail"
                    placeholder="navn@example.com"
                    type="email"
                    value={contactEmail}
                    onChange={event => setContactEmail(event.target.value)}
                />
            </div>

            <Button
                className="w-full"
                disabled={!message.trim() || status === "submitting"}
                type="submit"
            >
                {status === "submitting" ? "Sender..." : "Send tilbakemelding"}
            </Button>
        </form>
    )
}
