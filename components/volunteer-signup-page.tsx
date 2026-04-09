"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { VolunteerGroupSummary } from "@/lib/volunteer-launch-content"
import { createClient } from "@/utils/supabase/client"

export function VolunteerSignupPage({
    groups,
}: {
    groups: VolunteerGroupSummary[]
}) {
    const t = useTranslations("VolunteerSignupPage")

    const [selectedGroup, setSelectedGroup] = useState<string>("")
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [consent, setConsent] = useState<boolean>(false)
    const [institution, setInstitution] = useState<string>("")

    const [error, setError] = useState<string>("")
    const [success, setSuccess] = useState<string>("")

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (!selectedGroup) return setError(t("groupRequired"))
        if (!name.trim()) return setError(t("nameRequired"))
        if (!isValidEmail(email)) return setError(t("emailInvalid"))
        if (!consent) {
            return setError(t("consentRequired"))
        }

        const signup = {
            email,
            name,
            group: selectedGroup,
            message,
            institution,
        }

        const supabase = createClient()
        const { error } = await supabase.from("volunteer_signup").insert(signup)

        if (error) {
            setError(error.message)
            return
        }

        setSuccess(t("successMessage"))
        setName("")
        setEmail("")
        setMessage("")
        setSelectedGroup("")
        setConsent(false)
    }

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-secondary-background">
                    <CardHeader>
                        <CardTitle>{t("selectGroupTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            {groups.map(group => {
                                const active = selectedGroup === group.name
                                return (
                                    <Button
                                        key={group.name}
                                        type="button"
                                        onClick={() => setSelectedGroup(group.name)}
                                        className="h-auto min-h-14 justify-start px-4 py-4"
                                        variant={active ? "default" : "neutral"}
                                    >
                                        <span className="text-left">
                                            <span className="block">{group.name.toUpperCase()}</span>
                                            <span className="mt-1 block text-xs font-normal normal-case opacity-80">
                                                {group.description}
                                            </span>
                                        </span>
                                    </Button>
                                )
                            })}
                        </div>

                        <div className="mt-4 text-xs text-muted-foreground">
                            {selectedGroup
                                ? t("selectedGroup", { group: selectedGroup })
                                : t("selectedGroupFallback")}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background">
                    <CardHeader>
                        <CardTitle>{t("contactInfoTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("nameLabel")}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t("namePlaceholder")}
                                    autoComplete="name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t("emailLabel")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={t("emailPlaceholder")}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="institution">{t("institutionLabel")}</Label>
                                <Input
                                    id="institution"
                                    value={institution}
                                    onChange={e => setInstitution(e.target.value)}
                                    placeholder={t("institutionPlaceholder")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">{t("messageLabel")}</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder={t("messagePlaceholder")}
                                    rows={4}
                                />
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="consent"
                                    checked={consent}
                                    onCheckedChange={v => setConsent(Boolean(v))}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="consent" className="cursor-pointer">
                                        {t("consentLabel")}
                                    </Label>
                                </div>
                            </div>

                            <Button type="submit" className="h-14 w-full">
                                {t("submit")}
                            </Button>

                            {error ? (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertTitle>{t("errorTitle")}</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : null}

                            {success ? (
                                <Alert className="mb-4">
                                    <AlertTitle>{t("successTitle")}</AlertTitle>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            ) : null}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
