"use client"

import { useTranslations } from "next-intl"
import { posthog } from "posthog-js"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RoomSummary } from "@/lib/booking-launch-content"

export function BookingPage({ rom }: { rom : RoomSummary[] }) {
    const t = useTranslations("BookingPage")
    const [message, setMessage] = useState<string>("")

    const [selectedRoom, setSelectedRoom] = useState<string>("")


    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            
            
            <div className="grid grid-cols-1 gap-y-7 p-4">
                <Card className="bg-secondary-background p-6">
                    <CardHeader>
                        <CardTitle> {t("howToBookTitle")} </CardTitle>
                    </CardHeader>
                        <p>
                            {t("howToBookp1")}

                        </p>
                        <p>
                            {t("howToBookp2")}

                        </p>
                        <p>
                            {t("howToBookp3")}

                        </p>

                    <CardContent>
                    </CardContent>
                </Card>


                <Card className="bg-secondary-background p-6">
                    <CardHeader>
                        <CardTitle className="#f54b4b"> {t("bookHereTitle")} </CardTitle>
                    </CardHeader>
                        <p>
                            {/* TODO: add links */}
                            {t("rulesLink1")} <a href="https://kvarteret.no/avbestillingsvilkar/"> link</a><br></br>
                            {t("rulesLink2")} <a href="https://kvarteret.no/leievilkaar/"> link</a><br></br>
                            {/* {t("technicalSpecs")} */}
                        </p>
                        
                        <a href="https://app.crescat.io/venue-access/studentersamfunnet-i-bergen-bookingkalender">
                        <Button
                            type="button"
                            className="h-auto min-h-14 justify-start px-4 py-4"
                        >
                            {/* TEKST 1 */}
                            <span className="text-left">
                                <span className="block">
                                    {t("crescatButtonText")}
                                </span>
                            </span>
                        </Button>
                        </a>
                    <CardContent>
                    </CardContent>
                </Card>


                <Card className="bg-secondary-background p-6">
                    <CardHeader>
                        <CardTitle> {t("bookingTimesTitle")} </CardTitle>
                    </CardHeader>
                    <p>
                            {t("monday")} {t("to")} {t("wednesday")} : 13:00-01:30
                            <br></br>
                            {t("thursday")} {t("to")} {t("friday")} : 13:00-03:30
                            <br></br>
                            {t("saturday")} : 13:30-03:00
                            <br></br>
                            {t("sunday")}: 16:00-22:00


                        </p>

                    <CardContent>
                    </CardContent>
                </Card>

                
                <Card className="bg-secondary-background p-6">
                    <CardHeader>
                        <CardTitle> {t("servicesTitle")} </CardTitle>
                    </CardHeader>
                        <p>
                            {/* TODO: add links */}
                            {t("cateringInfo")}<br></br>
                            <a href="https://kvarteret.no/catering/"> Catering</a>
                        </p>
                        <p>
                            
                            {t("entertainment")}<br></br>
                            <a href="https://kvarteret.no/underholdningspakker/"> Silent Disco / Kareoke</a>
                        </p>

                    <CardContent>
                    </CardContent>
                </Card>

                
                
                <Card className="bg-secondary-background p-6">
                    <CardHeader>
                        <CardTitle> {t("linkWallTitle")} </CardTitle>
                    </CardHeader>
                        <p>
                            {t("doYouHaveAQuestion")} <a href="https://kvarteret.no/sporsmal-booking"> booking </a> <br></br>
                            {t("doYouHaveAQuestion")} <a href="https://kvarteret.no/vergeordningen/">{t("guardianArrangement")}</a> <br></br>
                            {t("doYouHaveAQuestion")} <a href="https://kvarteret.no/krav-promo/">promo</a>
                        </p>
                    <CardContent>
                    </CardContent>
                </Card>
                
                
                
{/* TODO: Add action when button pressed */}
                <Card className="bg-secondary-background">
                    <CardHeader>
                        <CardTitle> {t("roomInfoTitle")} </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            {rom.map(room => {
                                const active = selectedRoom === room.name
                                return (
                                    <Button
                                        key={room.name}
                                        type="button"
                                        onClick={() => setSelectedRoom(room.name)}
                                        className="h-auto min-h-14 justify-start px-4 py-4"
                                        variant={active ? "default" : "neutral"}
                                    >
                                        
                                        <div>
                                            <span className="block text-left">
                                                {room.name.toUpperCase()}
                                            </span>
                                            {/* TODO: fix overflow / dissappearing issue */}
                                            <p className="min-w-0 text-xs whitespace-normal">
                                                {room.description}
                                            </p>
                                        </div>
                                    </Button>
                                )
                            })}
                        </div>

                        {/* <div className="mt-4 text-xs text-muted-foreground">
                            {selectedRoom
                                ? t("selectedRoom", { room: selectedRoom })
                                : t("selectedRoomFallback")}
                        </div> */}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}


                        // <div className="space-y-2">
                        //                                 <Label htmlFor="message">{t("messageLabel")}</Label>
                        //                                 <Textarea
                        //                                     id="message"
                        //                                     value={message}
                        //                                     onChange={e => setMessage(e.target.value)}
                        //                                     placeholder={t("messagePlaceholder")}
                        //                                     rows={4}
                        //                                 />
                        //                             </div>
