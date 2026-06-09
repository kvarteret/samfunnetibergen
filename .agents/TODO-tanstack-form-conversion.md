# TODO: Convert remaining forms to @tanstack/react-form

RoomBookingForm is done. Two forms remain: KaraokeBookingForm and SubmitEventForm.

---

## What we learned

### The context pattern (the right way to share form state)

DO NOT pass `form` as a prop to sub-components. Use React context:

```ts
// bookingFormContext.ts
import { createContext, useContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BookingFormContext = createContext<any>(null);

export function useBookingForm() {
  const form = useContext(BookingFormContext);
  if (!form) throw new Error("useBookingForm must be used inside Provider");
  return form;
}
```

Wrap the form's JSX tree in `<BookingFormContext.Provider value={form}>`. Each
sub-component calls `const form = useBookingForm()` at the top of its body.
No prop drilling needed.

### TypeScript: the `any` problem

`@tanstack/react-form` v1 exports `ReactFormExtendedApi<TFormData>` with 12
required generic parameters. `ReactFormExtendedApi<BookingFormValues>` does
NOT compile because TypeScript doesn't resolve the defaults for the remaining
11 parameters. This is a known library limitation. The workaround is `any`
on the context, with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
on `(field: any)` callbacks inside `form.Field` render props.

DO NOT waste time on `createFormHookContexts()` — it is designed to pair with
`createFormHook()`, not standalone. The plain `createContext<any>()` approach
is simpler and works.

### The `useId()` rule

Every form section that needs label-input pairs should call `useId()` locally:

```tsx
export function BookingContactSection() {
  const uid = useId();
  const form = useBookingForm();
  // ...
  <Label htmlFor={`${uid}-email`}>E-post</Label>
  <Input id={`${uid}-email`} ... />
}
```

There is zero risk of collision because React guarantees `useId()` generates
unique IDs per component instance. This eliminates the `uid` prop that was
previously drilled from the parent through every section.

### Form field patterns

Read current values:
```tsx
const values = form.state.values;
const bookerType = values.bookerType; // cast: as BookerType
```

Write a value directly:
```tsx
form.setFieldValue("bookerType", option.type);
```

Render a field with `form.Field` render prop:
```tsx
<form.Field name="eventName">
  {(field: any) => (
    <Input
      onChange={(e) => field.handleChange(e.target.value)}
      value={field.state.value as string}
    />
  )}
</form.Field>
```

Conditional render based on a field value:
```tsx
<form.Subscribe selector={(s: any) => s.values.bookerType}>
  {(bookerType: BookerType) =>
    bookerType === "studentorg" ? <ExtraFields /> : null
  }
</form.Subscribe>
```

Submit state:
```tsx
form.state.isSubmitting        // boolean
form.state.isSubmitSuccessful  // boolean (show success view)
form.state.errorMap.onSubmit   // Error object | undefined
```

Submit handler:
```tsx
onSubmit: async ({ value }) => {
  const result = await submitBooking(value, room);
  if (!result.ok) throw new Error(result.error);
}
```

Keep derived `useMemo` values reading from `form.state.values` — they work
identically to the old `useReducer` state.

---

## KaraokeBookingForm (`src/features/karaoke/components/KaraokeBookingForm.tsx`)

**Current state:** 996 lines, 24 sub-components in one file. Uses `useReducer`
with `karaokeReducer` from `domain/formState.ts`. Submit status already folded
into reducer (no separate useState). Domain logic extracted to
`domain/availability.ts` and `domain/formState.ts`.

**What to do:**

1. Create `src/features/karaoke/components/karaokeFormContext.ts` (already
   created — just needs wiring)
2. Replace `useReducer(karaokeReducer, initialKaraokeState)` with
   `useForm({ defaultValues: initialKaraokeState, onSubmit: ... })`
3. Wrap the form JSX in `<KaraokeFormContext.Provider value={form}>`
4. Convert each sub-component:
   - Remove `state` / `setField` / `derived` / `dispatch` from props
   - Add `const form = useKaraokeForm()` at the top
   - Read values via `form.state.values.xxx`
   - Write via `form.setFieldValue("xxx", value)`
   - Keep `buildKaraokeDates()` and `dispatchDateSlotClear()` as local helpers
   - Keep `slotRangesForDate`, `slotOverlapsKaraokeBookings` from domain
5. Replace useEffect-based submit with `form.handleSubmit`
6. Use `form.state.isSubmitting` instead of `useTransition().isPending`
7. Use `form.state.isSubmitSuccessful` instead of `submitStatus === "success"`
8. The `derived` state from `deriveKaraokeState(state)` can stay as
   `useMemo(() => deriveKaraokeState(form.state.values), [form.state.values])`

**Sub-component mapping:**
- KaraokeBookingForm → main entry, creates provider
- KaraokeDetailsSection → receives derived, bookings, today via props (not form state)
- KaraokePackageSection → reads/writes priceType, numberOfPeople, duration
- KaraokeContactSection → reads/writes contact fields
- KaraokeTermsSection → reads/writes acceptTerms, studentProofAccepted
- KaraokeSubmitSection → reads submitStatus, isPending from form
- KaraokeSlotPicker → receives bookings, operationsManagerHours from props; writes startSlotMin, startDate
- KaraokeDateScroller, KaraokeDateButton → UI only (receives callbacks from parent)
- KaraokeSlotGrid, KaraokeSlotButton → UI only (receives callbacks)
- KaraokePriceTypeTabs → writes priceType
- KaraokePeopleField → reads/writes numberOfPeople
- KaraokeOrderPreview, KaraokeSummaryRow, KaraokePriceSummary → reads values
- KaraokeRoomCard → receives room via props (not form state)
- KaraokePackageNotice, KaraokeSelect, KaraokeTotalPrice → UI only

**Karaoke-specific gotchas:**
- The form currently fetches `bookings` in a useEffect — this can stay
  as a local useState since bookings are API data, not form state.
- The slot-picking UI (date scroller + slot grid) is complex with many
  callbacks. These callbacks should use `form.setFieldValue` directly.
- The `CLEAR_SLOT` dispatch effect should become a `form.setFieldValue("startSlotMin", null)` call when the selected slot becomes invalid.

---

## SubmitEventForm (`src/features/events/components/SubmitEventForm.tsx`)

**Current state:** Uses `useReducer` with `reducer` from `domain/formState.ts`.
The form was recently split — 10 individual section component files under
`events/components/`. Each section still receives `state` and `setField` props.

**What to do:**

1. Create `src/features/events/components/submitEventFormContext.ts`
2. Replace `useReducer` with `useForm`
3. Wrap in provider
4. Convert each section:
   - EventDetailsFields → writes title, description, eventTypeId, isInternalEvent
   - EventImageField → has local image state (preview URL, uploading flag) — keep useState for those; only imageAssetId goes to form
   - EventScheduleFields → writes dates, isRecurring, rrule
   - EventPlaceFields → writes room, roomText
   - EventOrganizerFields → writes organizerGroup, organizerText
   - EventPriceFields → writes isFree, priceOrdinar, priceStudent, priceMedlem
   - EventLinksFields → writes ticketUrl, facebookUrl
   - SubmitterFields → writes submittedBy, submittedByEmail, submittedByOrganization
   - SubmitEventActions → reads submitStatus, isPending from form
   - EventListPreview → reads values (read-only)

**SubmitEventForm gotchas:**
- Image upload state (imagePreviewUrl, imageAssetId, imageUploading, imageUploadError)
  should stay as local `useState` — these are transient upload state, not form data.
- `imageAssetId` gets written to the form once upload completes.
- The `addDate`, `removeDate`, `updateDate` callbacks manipulate the `dates` array
  — these need `form.setFieldValue("dates", newDates)`.
- `setField("isRecurring")` and other boolean toggles become:
  `(v) => form.setFieldValue("isRecurring", v)`

---

## Checklist

- [ ] Create karaokeFormContext.ts (DONE — wire it up)
- [ ] Convert KaraokeBookingForm: useForm + Provider + all sub-components
- [ ] Create submitEventFormContext.ts
- [ ] Convert SubmitEventForm: useForm + Provider + all sections
- [ ] Run `npx tsc --noEmit` and `npx eslint src/` — all clean
- [ ] Manual test: submit a booking, karaoke booking, and event

---

## Commands

```bash
# Verify after each form conversion
npx tsc --noEmit
npx eslint src/ --ext .ts,.tsx

# Build check
npx next build

# Format
npx prettier --write 'src/**/*.{ts,tsx}'
```
