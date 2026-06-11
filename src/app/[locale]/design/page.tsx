"use client"

import { use } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DetailRow } from "@/components/ui/detail-row"
import { Disclosure } from "@/components/ui/disclosure"
import { ErrorSummary } from "@/components/ui/error-summary"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { Input } from "@/components/ui/input"
import { PriceInput } from "@/components/ui/price-input"
import { SectionHeader } from "@/components/ui/section-header"
import { SelectField } from "@/components/ui/select-field"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { ToggleOption } from "@/components/ui/toggle-option"

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
            <p className="mt-1 text-sm text-foreground-subtle">
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

      {/* 11 — Card / Panel */}
      <Section header={<SectionHeader number="11" title="Card / Panel" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <p className="font-heading text-lg">Kort</p>
              <p className="mt-2 text-foreground-muted">Med CardContent.</p>
            </CardContent>
          </Card>
          <div className="border-2 border-border bg-card p-5 shadow-shadow">
            <p className="font-heading text-lg">Kanonisk panel</p>
            <p className="mt-2 text-foreground-muted">
              border-2 border-border bg-card p-5 shadow-shadow
            </p>
          </div>
        </div>
      </Section>

      {/* 12 — Text Emphasis */}
      <Section header={<SectionHeader number="12" title="Text Emphasis" />}>
        <div className="space-y-3 text-lg">
          <p className="text-foreground">foreground — primærtekst (100%)</p>
          <p className="text-foreground-muted">muted — dempet tekst (75%)</p>
          <p className="text-foreground-subtle">subtle — subtil tekst (60%)</p>
          <p className="text-foreground-faint">faint — svak tekst (45%)</p>
        </div>
      </Section>

      {/* 13 — Eyebrows */}
      <Section header={<SectionHeader number="13" title="Eyebrows" />}>
        <div className="space-y-4">
          <p className="text-eyebrow">text-eyebrow — 12px / 0.18em</p>
          <p className="text-eyebrow-sm">text-eyebrow-sm — 11px / 0.12em</p>
        </div>
      </Section>

      {/* 14 — Heading Scale */}
      <Section header={<SectionHeader number="14" title="Heading Scale" />}>
        <div className="space-y-4">
          <h1 className="font-heading text-4xl">h1 — Nivå 1 (text-4xl)</h1>
          <h2 className="font-heading text-3xl">h2 — Nivå 2 (text-3xl)</h2>
          <h3 className="font-heading text-2xl">h3 — Nivå 3 (text-2xl)</h3>
          <h4 className="font-heading text-xl">h4 — Nivå 4 (text-xl)</h4>
        </div>
      </Section>

      {/* 15 — Shadow Scale */}
      <Section header={<SectionHeader number="15" title="Shadow Scale" />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-2 border-border bg-card p-5 shadow-hard-sm">
            <p className="font-heading text-sm">shadow-hard-sm</p>
            <p className="mt-1 text-xs text-foreground-muted">2px 2px 0</p>
          </div>
          <div className="border-2 border-border bg-card p-5 shadow-shadow">
            <p className="font-heading text-sm">shadow (default)</p>
            <p className="mt-1 text-xs text-foreground-muted">4px 4px 0</p>
          </div>
          <div className="border-2 border-border bg-card p-5 shadow-hard-lg">
            <p className="font-heading text-sm">shadow-hard-lg</p>
            <p className="mt-1 text-xs text-foreground-muted">6px 6px 0</p>
          </div>
        </div>
      </Section>
    </div>
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
