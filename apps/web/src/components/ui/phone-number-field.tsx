"use client"

import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown, Search } from "lucide-react"
import { type ComponentProps, type FocusEvent, useState } from "react"
import flags from "react-phone-number-input/flags"
import en from "react-phone-number-input/locale/en"
import nb from "react-phone-number-input/locale/nb"
import PhoneInput, {
  type Country,
  getCountryCallingCode,
} from "react-phone-number-input/max"

import { cn } from "@/lib/utils"

type CountryOption = {
  value?: Country
  label: string
  divider?: boolean
}

function normalizeCountrySearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("nb")
    .trim()
}

interface CountrySelectProps
  extends Omit<ComponentProps<"select">, "onChange" | "value"> {
  value?: Country
  onChange: (value?: Country) => void
  options: CountryOption[]
  iconComponent?: unknown
  readOnly?: boolean
  searchLabel?: string
  searchPlaceholder?: string
  emptyLabel?: string
}

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  iconComponent: _iconComponent,
  name,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
  searchLabel = "Søk etter land eller landskode",
  searchPlaceholder = "Søk etter land eller landskode",
  emptyLabel = "Ingen land funnet",
}: CountrySelectProps) {
  void _iconComponent
  const [searchValue, setSearchValue] = useState("")
  const countryOptions = options.filter(
    (option): option is CountryOption & { value: Country } => !!option.value,
  )
  const selectedOption = countryOptions.find(option => option.value === value)
  const callingCode = value ? getCountryCallingCode(value) : undefined
  const Flag = value ? flags[value] : undefined

  return (
    <Combobox.Root
      autoHighlight
      disabled={disabled || readOnly}
      filter={(option, query) => {
        const normalizedQuery = normalizeCountrySearch(query)
        const callingCode = getCountryCallingCode(option.value)

        if (/^\+?\d+$/.test(normalizedQuery)) {
          return callingCode.startsWith(normalizedQuery.replace(/^\+/, ""))
        }

        return normalizeCountrySearch(
          `${option.label} ${option.value}`,
        ).includes(normalizedQuery)
      }}
      inputValue={searchValue}
      isItemEqualToValue={(option, selected) => option.value === selected.value}
      itemToStringLabel={option => option.label}
      itemToStringValue={option => option.value}
      items={countryOptions}
      name={name}
      onInputValueChange={setSearchValue}
      onOpenChange={() => setSearchValue("")}
      onValueChange={nextOption => {
        onChange(nextOption?.value)
        setSearchValue("")
      }}
      value={selectedOption ?? null}
    >
      <Combobox.Trigger
        aria-label={ariaLabel}
        className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-base border-2 border-r-0 border-border bg-card px-3 text-foreground outline-none hover:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:bg-muted focus-brutal"
        onBlur={event =>
          onBlur?.(event as unknown as FocusEvent<HTMLSelectElement>)
        }
        onFocus={event =>
          onFocus?.(event as unknown as FocusEvent<HTMLSelectElement>)
        }
      >
        {Flag && (
          <span
            aria-hidden
            className="w-6 overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-4 [&>svg]:w-6"
          >
            <Flag title={selectedOption?.label ?? value ?? ""} />
          </span>
        )}
        <span aria-hidden className="font-mono text-sm tabular-nums">
          {callingCode ? `+${callingCode}` : "–"}
        </span>
        <Combobox.Icon>
          <ChevronDown aria-hidden className="size-4" />
        </Combobox.Icon>
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          className="z-50 max-w-[calc(100vw-2rem)] outline-none"
          sideOffset={6}
        >
          <Combobox.Popup
            aria-label={ariaLabel}
            className="w-80 max-w-[var(--available-width)] rounded-base border-2 border-border bg-card text-foreground shadow-shadow outline-none"
          >
            <div className="flex items-center gap-2 border-b-2 border-border px-3">
              <Search
                aria-hidden
                className="size-4 shrink-0 text-foreground-muted"
              />
              <Combobox.Input
                aria-label={searchLabel}
                autoComplete="off"
                className="h-11 min-w-0 flex-1 bg-transparent font-base text-foreground outline-none placeholder:text-foreground-muted"
                placeholder={searchPlaceholder}
              />
            </div>
            <Combobox.Empty className="text-sm text-foreground-muted">
              <div className="px-3 py-4">{emptyLabel}</div>
            </Combobox.Empty>
            <Combobox.List className="max-h-[min(22rem,var(--available-height))] overflow-y-auto p-1 outline-none">
              {(option: CountryOption & { value: Country }) => {
                const OptionFlag = flags[option.value]

                return (
                  <Combobox.Item
                    className="grid w-full cursor-pointer grid-cols-[1rem_1.5rem_1fr_auto] items-center gap-2 px-3 py-2 outline-none data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                    key={option.value}
                    value={option}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        "size-4",
                        option.value !== value && "opacity-0",
                      )}
                    />
                    <span
                      aria-hidden
                      className="w-6 overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-4 [&>svg]:w-6"
                    >
                      {OptionFlag && <OptionFlag title={option.label} />}
                    </span>
                    <span className="truncate">{option.label}</span>
                    <span className="font-mono text-sm tabular-nums">
                      +{getCountryCallingCode(option.value)}
                    </span>
                  </Combobox.Item>
                )
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

interface PhoneNumberFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  placeholder?: string
  error?: boolean
  describedBy?: string
  required?: boolean
  locale?: "nb" | "en"
}

export function PhoneNumberField({
  id,
  value,
  onChange,
  onBlur,
  className,
  placeholder = "412 34 567",
  error,
  describedBy,
  required,
  locale = "nb",
}: PhoneNumberFieldProps) {
  const labels = locale === "en" ? en : nb

  return (
    <PhoneInput
      addInternationalOption={false}
      aria-describedby={describedBy}
      aria-invalid={error}
      autoComplete="tel"
      className={cn("flex w-full max-w-sm items-center", className)}
      countryOptionsOrder={["NO", "SE", "DK", "GB", "US", "|", "..."]}
      countrySelectComponent={CountrySelect}
      countrySelectProps={
        locale === "en"
          ? {
              emptyLabel: "No countries found",
              searchLabel: "Search for country or calling code",
              searchPlaceholder: "Search for country or calling code",
            }
          : undefined
      }
      defaultCountry="NO"
      id={id}
      inputMode="tel"
      labels={labels}
      limitMaxLength
      numberInputProps={{
        className:
          "h-11 min-w-0 flex-1 rounded-base rounded-l-none border-2 border-border bg-card px-3 py-2 font-base text-foreground outline-none placeholder:text-foreground-muted focus-brutal disabled:cursor-not-allowed disabled:opacity-50",
      }}
      onBlur={onBlur}
      onChange={nextValue => onChange(nextValue ?? "")}
      placeholder={placeholder}
      required={required}
      type="tel"
      useNationalFormatForDefaultCountryValue
      value={value}
    />
  )
}
