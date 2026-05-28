"use server"

import {
    type SubmitEventInput,
    submitEvent as submitEventAction,
    uploadEventImage as uploadEventImageAction,
} from "@/features/events/actions/submitEvent"

export async function uploadEventImage(formData: FormData) {
    return uploadEventImageAction(formData)
}

export async function submitEvent(input: SubmitEventInput) {
    return submitEventAction(input)
}
