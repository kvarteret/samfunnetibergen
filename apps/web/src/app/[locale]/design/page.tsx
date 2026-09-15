"use client"

import { use, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import {
  CheckboxGroup,
  CheckboxGroupItem,
} from "@/components/ui/checkbox-group"
import { DateScroller } from "@/components/ui/date-scroller"
import { DetailRow } from "@/components/ui/detail-row"
import { Disclosure } from "@/components/ui/disclosure"
import { ErrorSummary } from "@/components/ui/error-summary"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PriceInput } from "@/components/ui/price-input"
import { SectionHeader } from "@/components/ui/section-header"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import {
  SelectableCard,
  SelectableCardGroup,
} from "@/components/ui/selectable-card"
import { SlotGrid } from "@/components/ui/slot-grid"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup } from "@/components/ui/toggle-group"

export default function DesignGallery({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  // Resolve params (Next.js 15+ async params)
  use(params)
  const [checkboxValues, setCheckboxValues] = useState(["scene"])
  const [checkboxStates, setCheckboxStates] = useState({
    off: false,
    on: true,
    hint: false,
    children: false,
    error: false,
  })
  const [selectValue, setSelectValue] = useState("a")
  const [price, setPrice] = useState("150")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("not-an-email")
  const [fileName, setFileName] = useState<string | null>(null)
  const [buttonMessage, setButtonMessage] = useState(
    "Ingen handling utført ennå.",
  )

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      <header className="max-w-3xl space-y-3">
        <p className="font-heading uppercase tracking-widest text-foreground-muted">
          Samfunnet i Bergen
        </p>
        <h1 className="font-heading text-4xl">Design System Gallery</h1>
        <p className="text-lg text-foreground-muted">
          En levende referanse for struktur, tastaturfokus, hover- og
          trykkfeedback, valgte og deaktiverte tilstander og validering. Prøv
          alle kontrollene med både peker og tastatur.
        </p>
      </header>

      {/* 00 — Interaction state reference */}
      <Section
        header={<SectionHeader number="00" title="Interaction states" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatePreview label="Default">
            <Button className="pointer-events-none">Action</Button>
          </StatePreview>
          <StatePreview label="Hover">
            <Button className="pointer-events-none -translate-x-0.5 -translate-y-0.5 shadow-[6px_6px_0_var(--shadow-color)]">
              Action
            </Button>
          </StatePreview>
          <StatePreview label="Focus">
            <Button className="pointer-events-none outline-3 outline-primary outline-offset-0">
              Action
            </Button>
          </StatePreview>
          <StatePreview label="Pressed">
            <Button className="pointer-events-none translate-x-0.5 translate-y-0.5 shadow-[2px_2px_0_var(--shadow-color)]">
              Action
            </Button>
          </StatePreview>
          <StatePreview label="Disabled">
            <Button className="pointer-events-none" disabled>
              Action
            </Button>
          </StatePreview>
        </div>
        <p className="mt-4 text-sm text-foreground-muted">
          Fokus bruker en tydelig primærring og er aldri avhengig av farge
          alene. Valgt, deaktivert og ugyldig innhold viser både visuell og
          semantisk tilstand.
        </p>
      </Section>

      {/* 01 — Button */}
      <Section header={<SectionHeader number="01" title="Button" />}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <Button
              onClick={() => setButtonMessage("Default-knappen ble aktivert.")}
              variant="default"
            >
              Default
            </Button>
            <Button variant="neutral">Neutral</Button>
            <Button variant="plain">Pressed visual</Button>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <Button disabled>Disabled</Button>
          </div>
          <p aria-live="polite" className="text-sm text-foreground-muted">
            {buttonMessage}
          </p>
        </div>
      </Section>

      {/* 02 — Input */}
      <Section header={<SectionHeader number="02" title="Input" />}>
        <div className="grid gap-6 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="in-default">Navn</Label>
            <Input
              id="in-default"
              onChange={event => setName(event.target.value)}
              placeholder="Standard input"
              value={name}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="in-disabled">Deaktivert</Label>
            <Input disabled id="in-disabled" placeholder="Disabled input" />
          </FieldGroup>
          <FieldGroup error="Dette feltet er påkrevd" errorId="in-err">
            <Label htmlFor="in-err">Påkrevd felt</Label>
            <Input
              aria-describedby="in-err"
              aria-invalid
              id="in-err"
              value="feil verdi"
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="in-phone">Telefon</Label>
            <Input
              id="in-phone"
              inputMode="tel"
              placeholder="Telefon"
              type="tel"
            />
            <FieldHint>Telefonnummer (8 siffer)</FieldHint>
          </FieldGroup>
        </div>
      </Section>

      {/* 03 — Textarea */}
      <Section header={<SectionHeader number="03" title="Textarea" />}>
        <div className="grid gap-6 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="ta-default">Beskrivelse</Label>
            <Textarea id="ta-default" placeholder="Standard tekstområde" />
          </FieldGroup>
          <FieldGroup error="Maks 500 tegn" errorId="ta-err">
            <Label htmlFor="ta-err">Valideringsfeil</Label>
            <Textarea
              aria-describedby="ta-err"
              aria-invalid
              defaultValue="for lang"
              id="ta-err"
            />
          </FieldGroup>
        </div>
      </Section>

      {/* 04 — SelectField / PriceInput */}
      <Section
        header={<SectionHeader number="04" title="SelectField / PriceInput" />}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            id="sel-demo"
            label="Velg kategori"
            onChange={setSelectValue}
            options={[
              { value: "a", label: "Alternativ A" },
              { value: "b", label: "Alternativ B" },
              { disabled: true, value: "c", label: "Alternativ C" },
            ]}
            value={selectValue}
          />
          <SelectField
            disabled
            id="sel-disabled"
            label="Deaktivert valg"
            onChange={() => {}}
            options={[{ value: "disabled", label: "Ikke tilgjengelig" }]}
            value="disabled"
          />
          <div className="max-w-28">
            <PriceInput
              id="price-demo"
              label="Pris"
              onChange={setPrice}
              value={price}
            />
          </div>
        </div>
      </Section>

      {/* 05 — CheckboxField */}
      <Section header={<SectionHeader number="05" title="CheckboxField" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxField
            checked={checkboxStates.off}
            id="cb-off"
            label="Ukrysset"
            onChange={checked =>
              setCheckboxStates(current => ({ ...current, off: checked }))
            }
          />
          <CheckboxField
            checked={checkboxStates.on}
            id="cb-on"
            label="Krysset av"
            onChange={checked =>
              setCheckboxStates(current => ({ ...current, on: checked }))
            }
          />
          <CheckboxField
            checked={false}
            disabled
            id="cb-disabled"
            label="Deaktivert"
            onChange={() => {}}
          />
          <CheckboxField
            checked={checkboxStates.hint}
            hint="Dette er en hjelpetekst"
            id="cb-hint"
            label="Med hjelpetekst"
            onChange={checked =>
              setCheckboxStates(current => ({ ...current, hint: checked }))
            }
          />
          <CheckboxField
            checked={checkboxStates.children}
            id="cb-children"
            label="Med ekstra innhold"
            onChange={checked =>
              setCheckboxStates(current => ({ ...current, children: checked }))
            }
          >
            <p className="mt-1 text-foreground-muted">
              Her kan du legge til ekstra innhold.
            </p>
          </CheckboxField>
          <CheckboxField
            aria-invalid
            checked={checkboxStates.error}
            error="Du må bekrefte valget"
            errorId="cb-error"
            id="cb-error-field"
            label="Med valideringsfeil"
            onChange={checked =>
              setCheckboxStates(current => ({ ...current, error: checked }))
            }
          />
          <CheckboxGroup
            aria-label="Utstyrsbehov"
            className="sm:col-span-2"
            onValueChange={setCheckboxValues}
            value={checkboxValues}
          >
            <CheckboxGroupItem label="Scene" value="scene" />
            <CheckboxGroupItem label="Lydanlegg" value="sound" />
            <CheckboxGroupItem label="Lysrigg" value="lights" />
          </CheckboxGroup>
        </div>
      </Section>

      {/* 06 — Tag */}
      <Section header={<SectionHeader number="06" title="Tag" />}>
        <div className="flex flex-wrap gap-3">
          <Tag variant="neutral">Nøytral</Tag>
          <Tag variant="success">Suksess</Tag>
          <Tag variant="warning">Advarsel</Tag>
          <Tag variant="destructive">Feil</Tag>
          <Tag variant="outline">Outline</Tag>
        </div>
      </Section>

      {/* 07 — Alert */}
      <Section header={<SectionHeader number="07" title="Alert" />}>
        <div className="space-y-4">
          <Alert>Info: Dette er en informasjonsmelding.</Alert>
          <Alert variant="success">Suksess: Handlingen ble gjennomført.</Alert>
          <Alert variant="destructive">
            Feil: Noe gikk galt. Prøv igjen senere.
          </Alert>
        </div>
      </Section>

      {/* 08 — ErrorSummary */}
      <Section header={<SectionHeader number="08" title="ErrorSummary" />}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FieldGroup error="Skriv inn navn." errorId="demo-name-error">
              <Label htmlFor="demo-name">Navn</Label>
              <Input
                aria-describedby="demo-name-error"
                aria-invalid
                id="demo-name"
                onChange={event => setName(event.target.value)}
                value={name}
              />
            </FieldGroup>
            <FieldGroup
              error="Skriv inn en gyldig e-post."
              errorId="demo-email-error"
            >
              <Label htmlFor="demo-email">E-post</Label>
              <Input
                aria-describedby="demo-email-error"
                aria-invalid
                id="demo-email"
                onChange={event => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </FieldGroup>
          </div>
          <ErrorSummary
            errors={[
              { fieldId: "demo-name", message: "Skriv inn navn." },
              { fieldId: "demo-email", message: "Skriv inn en gyldig e-post." },
            ]}
          />
        </div>
      </Section>

      {/* 09 — Disclosure */}
      <Section header={<SectionHeader number="09" title="Disclosure" />}>
        <div className="space-y-4">
          <Disclosure summary="Lukket — klikk for å åpne">
            <p className="text-foreground-muted">
              Innhold skjult som standard. Fungerer uten JavaScript via native
              {` <details>`}.
            </p>
          </Disclosure>
          <Disclosure open summary="Åpen — klikk for å lukke">
            <p className="text-foreground-muted">
              Denne er åpen når siden lastes.
            </p>
          </Disclosure>
        </div>
      </Section>

      {/* 10 — DetailRow */}
      <Section header={<SectionHeader number="10" title="DetailRow" />}>
        <div className="max-w-md space-y-3">
          <DetailRow label="Dato">12. juni 2026</DetailRow>
          <DetailRow label="Tid">kl. 21:00–02:00</DetailRow>
          <DetailRow label="Sted">Grøndahls</DetailRow>
        </div>
      </Section>

      {/* 11 — Card */}
      <Section header={<SectionHeader number="11" title="Card" />}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Komplett kort</CardTitle>
              <CardDescription>
                Header, tittel, beskrivelse, innhold og footer i en tydelig
                leserekkefølge.
              </CardDescription>
              <CardAction>
                <Button
                  aria-label="Åpne kortmeny"
                  size="icon"
                  variant="neutral"
                >
                  …
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>
                Bruk dette mønsteret når innholdet trenger en overskrift og en
                sekundær handling.
              </p>
            </CardContent>
            <CardFooter className="justify-between border-t-2 border-border">
              <span className="text-sm text-foreground-muted">
                Oppdatert nå
              </span>
              <Button size="sm">Fortsett</Button>
            </CardFooter>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle>Statuskort</CardTitle>
              <CardDescription>
                En visuell status skal også ha en tekstlig forklaring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-success/10 p-4 text-success-foreground">
                <p className="font-heading">Klar til innsending</p>
                <p className="mt-1 text-sm">
                  Alle obligatoriske felt er fylt ut.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <div className="flex aspect-[2/1] items-end bg-primary p-6 text-primary-foreground">
              <div>
                <p className="font-heading text-2xl">Mediefelt</p>
                <p className="mt-1">
                  Legg media før CardContent når det gir mening.
                </p>
              </div>
            </div>
            <CardContent className="p-5">
              <p className="text-foreground-muted">
                Et kort med et tydelig visuelt anker og vanlig innhold.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Oppsummeringskort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Dato">12. juni 2026</DetailRow>
              <DetailRow label="Tid">21:00–02:00</DetailRow>
              <DetailRow label="Sted">Grøndahls</DetailRow>
            </CardContent>
            <CardFooter className="border-t-2 border-border">
              <Button className="w-full" variant="neutral">
                Rediger oppsummering
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* 12 — Text Emphasis */}
      <Section header={<SectionHeader number="12" title="Text Emphasis" />}>
        <div className="space-y-3 text-lg">
          <p className="text-foreground">foreground — primærtekst (100%)</p>
          <p className="text-foreground-muted">muted — dempet tekst (75%)</p>
        </div>
      </Section>

      {/* 13 — Heading Scale */}
      <Section header={<SectionHeader number="13" title="Heading Scale" />}>
        <div className="space-y-4">
          <h1 className="font-heading text-4xl">h1 — Nivå 1 (text-4xl)</h1>
          <h2 className="font-heading text-3xl">h2 — Nivå 2 (text-3xl)</h2>
          <h3 className="font-heading text-2xl">h3 — Nivå 3 (text-2xl)</h3>
          <h4 className="font-heading text-xl">h4 — Nivå 4 (text-xl)</h4>
        </div>
      </Section>

      {/* 14 — Shadow Scale */}
      <Section header={<SectionHeader number="14" title="Shadow Scale" />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel shadow-hard-sm">
            <p className="font-heading">shadow-hard-sm</p>
            <p className="mt-1 text-sm text-foreground-muted">2px 2px 0</p>
          </div>
          <div className="panel shadow-shadow">
            <p className="font-heading">shadow (default)</p>
            <p className="mt-1 text-sm text-foreground-muted">4px 4px 0</p>
          </div>
          <div className="panel shadow-hard-lg">
            <p className="font-heading">shadow-hard-lg</p>
            <p className="mt-1 text-sm text-foreground-muted">6px 6px 0</p>
          </div>
        </div>
      </Section>

      {/* 15 — SegmentedControl */}
      <Section header={<SectionHeader number="15" title="SegmentedControl" />}>
        <SegmentedControlDemo />
      </Section>

      {/* 16 — ToggleGroup */}
      <Section header={<SectionHeader number="16" title="ToggleGroup" />}>
        <ToggleGroupDemo />
      </Section>

      {/* 17 — DateScroller */}
      <Section header={<SectionHeader number="17" title="DateScroller" />}>
        <DateScrollerDemo />
      </Section>

      {/* 18 — SlotGrid */}
      <Section header={<SectionHeader number="18" title="SlotGrid" />}>
        <SlotGridDemo />
      </Section>

      {/* 19 — SelectableCard */}
      <Section header={<SectionHeader number="19" title="SelectableCard" />}>
        <SelectableCardDemo />
      </Section>

      {/* 20 — ImageDropzone */}
      <Section header={<SectionHeader number="20" title="ImageDropzone" />}>
        <ImageDropzone
          onImageChange={event =>
            setFileName(event.target.files?.[0]?.name ?? null)
          }
        />
        <p aria-live="polite" className="mt-3 text-sm text-foreground-muted">
          {fileName ? `Valgt fil: ${fileName}` : "Ingen fil valgt."}
        </p>
      </Section>
    </div>
  )
}

// ─── Interactive control demos ───────────────────────────────────────────────

function SegmentedControlDemo() {
  const [frequency, setFrequency] = useState("weekly")
  return (
    <div className="space-y-2">
      <p className="font-heading uppercase tracking-widest text-foreground-muted">
        pills (default)
      </p>
      <SegmentedControl
        onValueChange={setFrequency}
        options={[
          { value: "daily", label: "Hver dag" },
          { value: "weekly", label: "Hver uke" },
          { disabled: true, value: "monthly", label: "Hver måned" },
        ]}
        value={frequency}
      />
    </div>
  )
}

function ToggleGroupDemo() {
  const [needs, setNeeds] = useState<string[]>(["scene"])
  const [days, setDays] = useState<string[]>(["man", "ons"])
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-heading uppercase tracking-widest text-foreground-muted">
          default — multi-select
        </p>
        <ToggleGroup
          onValueChange={setNeeds}
          options={[
            { value: "scene", label: "Scene" },
            { value: "lyd", label: "Lydanlegg" },
            { disabled: true, value: "lys", label: "Lysrigg" },
          ]}
          value={needs}
        />
      </div>
      <div className="space-y-2">
        <p className="font-heading uppercase tracking-widest text-foreground-muted">
          sm — weekdays
        </p>
        <ToggleGroup
          onValueChange={setDays}
          options={["man", "tir", "ons", "tor", "fre", "lør", "søn"].map(
            day => ({ value: day, label: day }),
          )}
          size="sm"
          value={days}
        />
      </div>
    </div>
  )
}

function DateScrollerDemo() {
  const dates = [
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
    "2026-09-20",
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-09-24",
  ]
  const today = dates[0]
  const [selected, setSelected] = useState(dates[2])
  return (
    <DateScroller
      dates={dates}
      getDateAvailability={date =>
        dates.indexOf(date) % 4 === 3 ? "unavailable" : "available"
      }
      onValueChange={setSelected}
      selectedDate={selected}
      today={today}
    />
  )
}

function SlotGridDemo() {
  const [slot, setSlot] = useState<string | null>("19:00")
  const slots = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map(
    time => ({
      value: time,
      label: time,
      availability:
        time === "18:00" ? ("taken" as const) : ("available" as const),
    }),
  )
  return <SlotGrid onValueChange={setSlot} slots={slots} value={slot} />
}

function SelectableCardDemo() {
  const [selected, setSelected] = useState("storsalen")
  const rooms = [
    { value: "storsalen", title: "Storsalen", detail: "350 stående" },
    { value: "tivoli", title: "Tivoli", detail: "120 stående" },
  ]
  return (
    <SelectableCardGroup
      className="sm:grid-cols-3"
      onValueChange={setSelected}
      value={selected}
    >
      {rooms.map(room => (
        <SelectableCard key={room.value} value={room.value}>
          <p className="font-heading">{room.title}</p>
          <p className=" text-foreground-muted">{room.detail}</p>
        </SelectableCard>
      ))}
      <SelectableCard disabled value="eldorado">
        <p className="font-heading">Eldorado</p>
        <p className=" text-foreground-muted">Ikke tilgjengelig</p>
      </SelectableCard>
    </SelectableCardGroup>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function StatePreview({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="font-heading text-sm uppercase tracking-widest text-foreground-muted">
        {label}
      </p>
      <div className="flex min-h-16 items-center">{children}</div>
    </div>
  )
}

function Section({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      {header}
      <div className="mt-4">{children}</div>
    </section>
  )
}
