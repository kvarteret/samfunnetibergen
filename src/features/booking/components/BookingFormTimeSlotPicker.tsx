import { FieldHint, SelectField } from "@/components/ui/form-fields";
import {
  type ClosedDate,
  combineOpeningRangesForDate,
  hasOpeningHoursRows,
  isHouseClosed,
  minutesToTime,
  type OpeningHours,
} from "@/lib/opening-hours";

const SLOT_STEP_MIN = 30;
const MINUTES_IN_DAY = 24 * 60;

interface TimeOption {
  value: string;
  label: string;
  min: number;
}

// 30-minute marks within the day's open range(s), as absolute minutes from
// midnight (values ≥ 1440 mark post-midnight slots).
function slotMarks(
  date: string,
  hours: OpeningHours | null,
  roomHours: OpeningHours | null,
  closed: ClosedDate[],
): number[] {
  const marks = new Set<number>();
  for (const range of combineOpeningRangesForDate(
    date,
    hours,
    roomHours,
    closed,
  )) {
    for (let m = range.startMin; m <= range.endMin; m += SLOT_STEP_MIN)
      marks.add(m);
  }
  return Array.from(marks).toSorted((a, b) => a - b);
}

const toOption = (min: number): TimeOption => ({
  value: minutesToTime(min),
  label: minutesToTime(min),
  min,
});

interface BookingFormTimeSlotPickerProps {
  uid: string;
  date: string;
  openingHours: OpeningHours | null;
  roomOpeningHours: OpeningHours | null;
  closedDates: ClosedDate[];
  startTime: string;
  endTime: string;
  doorsTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDoorsChange: (value: string) => void;
}

export function BookingFormTimeSlotPicker({
  uid,
  date,
  openingHours,
  roomOpeningHours,
  closedDates,
  startTime,
  endTime,
  doorsTime,
  onStartChange,
  onEndChange,
  onDoorsChange,
}: BookingFormTimeSlotPickerProps) {
  if (!date) {
    return <FieldHint>Velg en dato for å se ledige tidspunkt.</FieldHint>;
  }
  if (isHouseClosed(date, closedDates)) {
    return (
      <FieldHint>Huset er stengt denne dagen. Velg en annen dato.</FieldHint>
    );
  }

  const marks = slotMarks(date, openingHours, roomOpeningHours, closedDates);
  const hasConfiguredHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours);

  if (marks.length === 0 && hasConfiguredHours) {
    return (
      <FieldHint>
        Ingen tilgjengelige tidspunkt for valgt rom denne dagen.
      </FieldHint>
    );
  }

  // No registered opening hours → fall back to an unconstrained day so the
  // form still works when siteMetadata has no hours.
  if (marks.length === 0) {
    return (
      <UnconstrainedTimes
        uid={uid}
        startTime={startTime}
        endTime={endTime}
        doorsTime={doorsTime}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        onDoorsChange={onDoorsChange}
      />
    );
  }

  const options = marks.map(toOption);
  const startMin =
    options.find((option) => option.value === startTime)?.min ?? marks[0];
  const startOptions = options
    .filter((option) => option.min < MINUTES_IN_DAY)
    .slice(0, -1);
  const endOptions = options.filter((option) => option.min > startMin);
  const doorsOptions = options.filter((option) => option.min <= startMin);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SelectField
        id={`${uid}-doorsTime`}
        label="Dørene åpner"
        onChange={onDoorsChange}
        options={doorsOptions}
        placeholder="Ikke relevant"
        value={doorsTime}
      />
      <SelectField
        id={`${uid}-startTime`}
        label="Starter *"
        onChange={onStartChange}
        options={startOptions}
        placeholder="Velg"
        value={startTime}
      />
      <SelectField
        id={`${uid}-endTime`}
        label="Slutter *"
        onChange={onEndChange}
        options={endOptions}
        placeholder="Velg"
        value={endTime}
      />
    </div>
  );
}

const FALLBACK_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return { value: `${h}:${m}`, label: `${h}:${m}` };
});

interface UnconstrainedTimesProps {
  uid: string;
  startTime: string;
  endTime: string;
  doorsTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDoorsChange: (value: string) => void;
}

function UnconstrainedTimes({
  uid,
  startTime,
  endTime,
  doorsTime,
  onStartChange,
  onEndChange,
  onDoorsChange,
}: UnconstrainedTimesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SelectField
        id={`${uid}-doorsTime`}
        label="Dørene åpner"
        onChange={onDoorsChange}
        options={FALLBACK_OPTIONS}
        placeholder="Ikke relevant"
        value={doorsTime}
      />
      <SelectField
        id={`${uid}-startTime`}
        label="Starter *"
        onChange={onStartChange}
        options={FALLBACK_OPTIONS}
        value={startTime}
      />
      <SelectField
        id={`${uid}-endTime`}
        label="Slutter *"
        onChange={onEndChange}
        options={FALLBACK_OPTIONS}
        value={endTime}
      />
    </div>
  );
}
