"use client"

import { use, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DateScroller } from "@/components/ui/date-scroller"
import { DetailRow } from "@/components/ui/detail-row"
import { Disclosure } from "@/components/ui/disclosure"
import { ErrorSummary } from "@/components/ui/error-summary"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { ImageDropzone } from "@/components/ui/image-dropzone"
import { Input } from "@/components/ui/input"
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
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-12">
      <h1 className="font-heading text-4xl">Design System Gallery</h1>

      {/* 01 — Button */}
      <Section header={<SectionHeader number="01" title="Button" />}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <Button variant="default">Default</Button>
            <Button variant="neutral">Neutral</Button>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      {/* 02 — Input */}
      <Section header={<SectionHeader number="02" title="Input" />}>
        <div className="grid gap-6 sm:grid-cols-2">
          <FieldGroup>
            <Input id="in-default" placeholder="Standard input" />
          </FieldGroup>
          <FieldGroup>
            <Input disabled id="in-disabled" placeholder="Disabled input" />
          </FieldGroup>
          <FieldGroup error="Dette feltet er påkrevd" errorId="in-err">
            <Input
              aria-describedby="in-err"
              aria-invalid
              defaultValue="feil verdi"
              id="in-err"
            />
            <FieldError id="in-err">Dette feltet er påkrevd</FieldError>
          </FieldGroup>
          <FieldGroup>
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
            <Textarea id="ta-default" placeholder="Standard tekstområde" />
          </FieldGroup>
          <FieldGroup error="Maks 500 tegn" errorId="ta-err">
            <Textarea
              aria-describedby="ta-err"
              aria-invalid
              defaultValue="for lang"
              id="ta-err"
            />
            <FieldError id="ta-err">Maks 500 tegn</FieldError>
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
            onChange={() => {}}
            options={[
              { value: "a", label: "Alternativ A" },
              { value: "b", label: "Alternativ B" },
            ]}
            value="a"
          />
          <div className="max-w-28">
            <PriceInput
              id="price-demo"
              label="Pris"
              onChange={() => {}}
              value="150"
            />
          </div>
        </div>
      </Section>

      {/* 05 — CheckboxField */}
      <Section header={<SectionHeader number="05" title="CheckboxField" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxField
            checked={false}
            id="cb-off"
            label="Ukrysset"
            onChange={() => {}}
          />
          <CheckboxField
            checked
            id="cb-on"
            label="Krysset av"
            onChange={() => {}}
          />
          <CheckboxField
            checked={false}
            disabled
            id="cb-disabled"
            label="Deaktivert"
            onChange={() => {}}
          />
          <CheckboxField
            checked={false}
            hint="Dette er en hjelpetekst"
            id="cb-hint"
            label="Med hjelpetekst"
            onChange={() => {}}
          />
          <CheckboxField
            checked={false}
            id="cb-children"
            label="Med ekstra innhold"
            onChange={() => {}}
          >
            <p className="mt-1 text-base text-foreground-muted">
              Her kan du legge til ekstra innhold.
            </p>
          </CheckboxField>
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
        <ErrorSummary
          errors={[
            { fieldId: "demo-name", message: "Skriv inn navn." },
            { fieldId: "demo-email", message: "Skriv inn en gyldig e-post." },
          ]}
        />
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
        <Card className="max-w-xl">
          <CardContent className="p-5">
            <p className="font-heading text-lg">Kort</p>
            <p className="mt-2 text-foreground-muted">
              Den kanoniske panelsurfacen.
            </p>
          </CardContent>
        </Card>
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
            <p className="font-heading text-base">shadow-hard-sm</p>
            <p className="mt-1 text-sm text-foreground-muted">2px 2px 0</p>
          </div>
          <div className="panel shadow-shadow">
            <p className="font-heading text-base">shadow (default)</p>
            <p className="mt-1 text-sm text-foreground-muted">4px 4px 0</p>
          </div>
          <div className="panel shadow-hard-lg">
            <p className="font-heading text-base">shadow-hard-lg</p>
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
        <ImageDropzone onImageChange={() => {}} />
      </Section>
    </div>
  )
}

// ─── Interactive control demos ───────────────────────────────────────────────

function SegmentedControlDemo() {
  const [frequency, setFrequency] = useState("weekly")
  return (
    <div className="space-y-2">
      <p className="font-heading text-base uppercase tracking-widest text-foreground-muted">
        pills (default)
      </p>
      <SegmentedControl
        onChange={setFrequency}
        options={[
          { value: "daily", label: "Hver dag" },
          { value: "weekly", label: "Hver uke" },
          { value: "monthly", label: "Hver måned" },
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
        <p className="font-heading text-base uppercase tracking-widest text-foreground-muted">
          default — multi-select
        </p>
        <ToggleGroup
          onChange={setNeeds}
          options={[
            { value: "scene", label: "Scene" },
            { value: "lyd", label: "Lydanlegg" },
            { value: "lys", label: "Lysrigg" },
          ]}
          value={needs}
        />
      </div>
      <div className="space-y-2">
        <p className="font-heading text-base uppercase tracking-widest text-foreground-muted">
          sm — weekdays
        </p>
        <ToggleGroup
          onChange={setDays}
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
  const today = new Date().toISOString().split("T")[0]!
  const dates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split("T")[0]!
  })
  const [selected, setSelected] = useState(dates[2])
  return (
    <DateScroller
      dates={dates}
      getDateAvailability={date =>
        dates.indexOf(date) % 4 === 3 ? "unavailable" : "available"
      }
      onChange={setSelected}
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
  return <SlotGrid onChange={setSlot} selectedValue={slot} slots={slots} />
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
          <p className="text-base text-foreground-muted">{room.detail}</p>
        </SelectableCard>
      ))}
      <SelectableCard disabled value="eldorado">
        <p className="font-heading">Eldorado</p>
        <p className="text-base text-foreground-muted">Ikke tilgjengelig</p>
      </SelectableCard>
    </SelectableCardGroup>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

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
