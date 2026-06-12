"use client";

import { Loader2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SlackFeedback() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/slack-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <section className="bg-foreground p-8 text-background shadow-hard-lg sm:p-12">
        <p className="font-heading text-2xl text-background">
          Thanks for sharing!
        </p>
        <p className="mt-1 text-lg text-background/75">
          We read every submission.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-foreground p-8 text-background shadow-hard-lg sm:p-12">
      <h2 className="font-heading text-3xl leading-none text-background sm:text-4xl">
        Noe på hjertet?
      </h2>
      <p className="mt-2 text-lg text-background/75">
        An anonymous tip line to #e-feedback.
      </p>

      <form className="mt-6 space-y-3" onSubmit={submit}>
        <Textarea
          className="max-w-"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I dag så var jeg på 'the place to be', og der... "
          rows={2}
          value={message}
        />
        <Button
          disabled={!message.trim() || status === "sending"}
          type="submit"
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
        {status === "error" && (
          <p className="text-sm text-destructive">
            Something went wrong. Try again.
          </p>
        )}
      </form>
    </section>
  );
}
