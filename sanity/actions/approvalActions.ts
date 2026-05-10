import { CheckmarkIcon, CloseIcon } from "@sanity/icons"
import { useClient } from "sanity"

export function ApproveAction({ id, onComplete }: { id: string; onComplete: () => void }) {
    const client = useClient({ apiVersion: "2024-01-01" })
    return {
        label: "Godkjenn",
        icon: CheckmarkIcon,
        tone: "positive" as const,
        onHandle: async () => {
            await client.patch(id).set({ approvalStatus: "approved" }).commit()
            onComplete()
        },
    }
}

export function RejectAction({ id, onComplete }: { id: string; onComplete: () => void }) {
    const client = useClient({ apiVersion: "2024-01-01" })
    return {
        label: "Avvis",
        icon: CloseIcon,
        tone: "critical" as const,
        onHandle: async () => {
            await client.patch(id).set({ approvalStatus: "rejected" }).commit()
            onComplete()
        },
    }
}
