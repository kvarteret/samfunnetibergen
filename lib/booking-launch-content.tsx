import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"

import type { AppLocale } from "@/i18n/routing"

export type RoomSummary = {
    name: string
    description: string
}


const messagesByLocale = {
    nb: nbMessages,
    en: enMessages,
} as const

function getMessages(locale: AppLocale) {
    return messagesByLocale[locale]
}

export function getRoomSummaries(locale: AppLocale) {
    return getMessages(locale).roomSummaries as RoomSummary[]
}
