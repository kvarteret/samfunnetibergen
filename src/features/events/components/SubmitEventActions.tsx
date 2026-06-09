"use client";

import { CalendarPlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SubmitStatus } from "../domain/formState";

interface SubmitEventActionsProps {
  errorMessage: string;
  imageUploading: boolean;
  isPending: boolean;
  submitStatus: SubmitStatus;
}

export function SubmitEventActions({
  errorMessage,
  imageUploading,
  isPending,
  submitStatus,
}: SubmitEventActionsProps) {
  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {submitStatus === "error" && (
        <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
          <X aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-heading text-destructive">
              Det oppstod en feil
            </p>
            <p className="mt-0.5 text-sm text-foreground/70">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm leading-6 text-foreground/60">
        Arrangementet sendes til godkjenning hos PR-gruppen på Kvarteret. Det
        vil ikke vises på nettsiden før det er godkjent. Vi tar vanligvis 1-3
        virkedager.
      </p>

      <Button
        className="w-full sm:w-auto"
        disabled={isPending || imageUploading}
        size="lg"
        type="submit"
      >
        {isPending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            Sender inn...
          </>
        ) : imageUploading ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            Laster opp bilde...
          </>
        ) : (
          <>
            <CalendarPlus aria-hidden />
            Send inn arrangement
          </>
        )}
      </Button>
    </section>
  );
}
