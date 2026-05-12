"use server"

import {
    type SubmitArrangementInput,
    submitArrangement as submitArrangementAction,
    uploadEventImage as uploadEventImageAction,
} from "@/features/events/actions/submitArrangement"

export async function uploadEventImage(formData: FormData) {
    return uploadEventImageAction(formData)
}

export async function submitArrangement(input: SubmitArrangementInput) {
    return submitArrangementAction(input)
}
