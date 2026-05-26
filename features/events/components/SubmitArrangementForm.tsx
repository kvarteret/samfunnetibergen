"use client"

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useReducer,
    useState,
    useTransition,
} from "react"

import { submitArrangement, uploadEventImage } from "@/app/actions/submit-arrangement"
import type { ArrangementEventType, ArrangementGroup, ArrangementRoom } from "@/lib/sanity/fetch"
import {
    buildPreviewArrangement,
    initialState,
    reducer,
    type SetFormField,
    type SubmitStatus,
    type UpdateDateField,
} from "../domain/formState"
import {
    ArrangementDetailsFields,
    ArrangementImageField,
    ArrangementLinksFields,
    ArrangementListPreview,
    ArrangementOrganizerFields,
    ArrangementPlaceFields,
    ArrangementPriceFields,
    ArrangementScheduleFields,
    SubmitArrangementActions,
    SubmitterFields,
} from "./FormSections"

interface SubmitArrangementFormProps {
    rooms: ArrangementRoom[]
    eventTypes: ArrangementEventType[]
    groups: ArrangementGroup[]
}

export function SubmitArrangementForm({ rooms, eventTypes, groups }: SubmitArrangementFormProps) {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [isPending, startTransition] = useTransition()
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
    const [imageAssetId, setImageAssetId] = useState<string | null>(null)
    const [imageUploading, setImageUploading] = useState(false)
    const [imageUploadError, setImageUploadError] = useState("")
    const uid = useId()

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0]
        const firstId = state.dates[0].id
        dispatch({ type: "UPDATE_DATE", id: firstId, key: "startDate", value: today })
        dispatch({ type: "UPDATE_DATE", id: firstId, key: "startTime", value: "21:00" })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl)
            }
        }
    }, [imagePreviewUrl])

    const setField = useCallback<SetFormField>(
        key => value => dispatch({ type: "SET", key, value }),
        [],
    )

    const setRrule = useCallback(
        (rrule: string) => dispatch({ type: "SET", key: "rrule", value: rrule }),
        [],
    )

    const addDate = useCallback(() => dispatch({ type: "ADD_DATE" }), [])

    const removeDate = useCallback((id: string) => dispatch({ type: "REMOVE_DATE", id }), [])

    const updateDate = useCallback<UpdateDateField>(
        (id, key, value) => dispatch({ type: "UPDATE_DATE", id, key, value }),
        [],
    )

    const eventTypeOptions = useMemo(
        () =>
            eventTypes.map(eventType => ({
                value: eventType._id,
                label: eventType.taxonomyGroup
                    ? `${eventType.taxonomyGroup.name} — ${eventType.name}`
                    : eventType.name,
            })),
        [eventTypes],
    )

    const roomOptions = useMemo(
        () => rooms.map(room => ({ value: room._id, label: room.title })),
        [rooms],
    )

    const groupOptions = useMemo(
        () => groups.map(group => ({ value: group._id, label: group.name })),
        [groups],
    )

    const previewArrangement = useMemo(
        () => buildPreviewArrangement(state, imagePreviewUrl, rooms, groups, eventTypes),
        [state, imagePreviewUrl, rooms, groups, eventTypes],
    )

    const handleImageChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        const previewUrl = URL.createObjectURL(file)
        setImagePreviewUrl(previousUrl => {
            if (previousUrl) {
                URL.revokeObjectURL(previousUrl)
            }
            return previewUrl
        })
        setImageAssetId(null)
        setImageUploadError("")
        setImageUploading(true)

        const formData = new FormData()
        formData.append("image", file)

        const result = await uploadEventImage(formData)
        setImageUploading(false)

        if (result.ok) {
            setImageAssetId(result.assetId)
        } else {
            setImageUploadError(result.error)
        }
    }, [])

    const handleRemoveImage = useCallback(() => {
        setImagePreviewUrl(previousUrl => {
            if (previousUrl) {
                URL.revokeObjectURL(previousUrl)
            }
            return null
        })
        setImageAssetId(null)
        setImageUploadError("")
    }, [])

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()

        if (!state.title.trim() || !state.submittedBy.trim() || !state.submittedByEmail.trim()) {
            return
        }

        if (state.dates.every(date => !date.startDate) || imageUploading) {
            return
        }

        startTransition(async () => {
            const result = await submitArrangement({
                title: state.title,
                description: state.description || undefined,
                dates: state.dates
                    .filter(date => date.startDate)
                    .map(date => ({
                        startDate: date.startDate,
                        startTime: date.startTime || undefined,
                        endTime: date.endTime || undefined,
                    })),
                isRecurring: state.isRecurring,
                rrule: state.isRecurring ? state.rrule : undefined,
                room: state.room || undefined,
                roomText: state.roomText || undefined,
                organizerGroup: state.organizerGroup || undefined,
                organizerText: state.organizerText || undefined,
                submittedByOrganization: state.submittedByOrganization || undefined,
                eventTypeId: state.eventTypeId || undefined,
                imageAssetId: imageAssetId || undefined,
                isInternalEvent: state.isInternalEvent || undefined,
                isFree: state.isFree,
                priceOrdinar: state.priceOrdinar ? Number(state.priceOrdinar) : undefined,
                priceStudent: state.priceStudent ? Number(state.priceStudent) : undefined,
                priceMedlem: state.priceMedlem ? Number(state.priceMedlem) : undefined,
                ticketUrl: state.ticketUrl || undefined,
                facebookUrl: state.facebookUrl || undefined,
                submittedBy: state.submittedBy,
                submittedByEmail: state.submittedByEmail,
            })

            if (result.ok) {
                setSubmitStatus("success")
            } else {
                setSubmitStatus("error")
                setErrorMessage(result.error)
            }
        })
    }

    if (submitStatus === "success") {
        return <p className="font-heading text-green-600">yey</p>
    }

    return (
        <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[minmax(0,1fr)_360px]">
            <form className="min-w-0 space-y-14" noValidate onSubmit={handleSubmit}>
                <ArrangementDetailsFields
                    description={state.description}
                    eventTypeId={state.eventTypeId}
                    eventTypeOptions={eventTypeOptions}
                    isInternalEvent={state.isInternalEvent}
                    setField={setField}
                    title={state.title}
                    uid={uid}
                />
                <ArrangementImageField
                    imageAssetId={imageAssetId}
                    imagePreviewUrl={imagePreviewUrl}
                    imageUploadError={imageUploadError}
                    imageUploading={imageUploading}
                    onImageChange={handleImageChange}
                    onRemoveImage={handleRemoveImage}
                />
                <ArrangementScheduleFields
                    addDate={addDate}
                    dates={state.dates}
                    isRecurring={state.isRecurring}
                    removeDate={removeDate}
                    setField={setField}
                    setRrule={setRrule}
                    uid={uid}
                    updateDate={updateDate}
                />
                <ArrangementPlaceFields
                    room={state.room}
                    roomOptions={roomOptions}
                    roomText={state.roomText}
                    setField={setField}
                    uid={uid}
                />
                <ArrangementOrganizerFields
                    groupOptions={groupOptions}
                    organizerGroup={state.organizerGroup}
                    organizerText={state.organizerText}
                    setField={setField}
                    uid={uid}
                />
                <ArrangementPriceFields
                    isFree={state.isFree}
                    priceMedlem={state.priceMedlem}
                    priceOrdinar={state.priceOrdinar}
                    priceStudent={state.priceStudent}
                    setField={setField}
                    uid={uid}
                />
                <ArrangementLinksFields
                    facebookUrl={state.facebookUrl}
                    setField={setField}
                    ticketUrl={state.ticketUrl}
                    uid={uid}
                />
                <SubmitterFields
                    setField={setField}
                    submittedBy={state.submittedBy}
                    submittedByEmail={state.submittedByEmail}
                    submittedByOrganization={state.submittedByOrganization}
                    uid={uid}
                />
                <SubmitArrangementActions
                    errorMessage={errorMessage}
                    imageUploading={imageUploading}
                    isPending={isPending}
                    submitStatus={submitStatus}
                />
            </form>

            <ArrangementListPreview arrangement={previewArrangement} />
        </div>
    )
}
