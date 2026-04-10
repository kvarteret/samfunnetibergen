const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(value: string) {
    return EMAIL_PATTERN.test(value.trim().toLowerCase())
}
