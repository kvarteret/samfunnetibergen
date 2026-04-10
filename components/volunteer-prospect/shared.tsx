"use client"

import { X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

export type VolunteerFormMessage = {
    status: "success" | "error"
    message: string
}

export function RequiredStar() {
    return (
        <span aria-hidden="true" className="text-destructive">
            *
        </span>
    )
}

export function RequiredLabel({
    htmlFor,
    children,
}: {
    htmlFor?: string
    children: React.ReactNode
}) {
    return (
        <Label className="flex items-center gap-1" htmlFor={htmlFor}>
            <span>{children}</span>
            <RequiredStar />
        </Label>
    )
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-sm text-destructive">{message}</p>
}

export function SelectionChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <button
            className="inline-flex items-center gap-2 border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-none"
            onClick={onRemove}
            type="button"
        >
            <span>{label}</span>
            <X aria-hidden="true" className="size-4" />
        </button>
    )
}

export function VolunteerFormMessageAlert({
    formMessage,
    successTitle,
    errorTitle,
}: {
    formMessage: VolunteerFormMessage | null
    successTitle: string
    errorTitle: string
}) {
    if (!formMessage) {
        return null
    }

    return (
        <Alert variant={formMessage.status === "error" ? "destructive" : "default"}>
            <AlertTitle>{formMessage.status === "success" ? successTitle : errorTitle}</AlertTitle>
            <AlertDescription>{formMessage.message}</AlertDescription>
        </Alert>
    )
}

export function getVisibleFieldError(meta?: { errors?: unknown[]; isTouched?: boolean }) {
    if (!meta?.isTouched) {
        return undefined
    }

    const [firstError] = meta.errors ?? []
    return typeof firstError === "string" ? firstError : undefined
}
