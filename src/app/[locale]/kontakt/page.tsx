import { Mail, Phone } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchKontaktPage } from "@/lib/sanity/fetch"

export const revalidate = 300

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kontakt">) {
  const locale = await resolvePageLocale(params)
  return buildPageMetadata({
    canonicalPath: `/${locale}/kontakt`,
    fallbackTitle: "Kontakt",
    fallbackDescription: "Kontaktinformasjon for Samfunnet i Bergen.",
  })
}

type KontaktPage = NonNullable<Awaited<ReturnType<typeof fetchKontaktPage>>>
type ContactGroup = NonNullable<KontaktPage["contactGroups"]>[number]
type ContactPerson = NonNullable<ContactGroup["persons"]>[number]

function AddressBlock({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="space-y-2">
      <p className="font-heading uppercase tracking-widest">{label}</p>
      <p className=" leading-6 text-foreground whitespace-pre-line">{value}</p>
    </div>
  )
}

function PersonCard({ person }: { person: ContactPerson }) {
  return (
    <div className="flex gap-4 py-4 border-t border-border first:border-t-0">
      <Avatar
        alt={person.name ?? "Kontaktperson"}
        name={person.name}
        src={person.imageUrl}
      />
      <div className="min-w-0 space-y-1">
        <p className="font-heading leading-snug text-foreground">
          {person.name}
        </p>
        {person.rolle && (
          <p className="text-sm text-foreground-muted">{person.rolle}</p>
        )}
        {person.email && (
          <a
            className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors"
            href={`mailto:${person.email}`}
          >
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {person.email}
          </a>
        )}
        {person.phone && (
          <a
            className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors"
            href={`tel:${person.phone.replace(/\s/g, "")}`}
          >
            <Phone className="size-3.5 shrink-0" aria-hidden />
            {person.phone}
          </a>
        )}
      </div>
    </div>
  )
}

export default async function KontaktPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const page = await fetchKontaktPage()

  return (
    <article className="flex w-full flex-col gap-12">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
          Kontakt
        </h1>
      </header>

      <div className="grid gap-10 lg:grid-two-one">
        <div className="space-y-10">
          {(page?.contactGroups ?? []).map((group: ContactGroup) => (
            <section key={group._key}>
              <h2 className="font-heading uppercase tracking-widest text-foreground mb-2">
                {group.title}
              </h2>
              <div>
                {(group.persons ?? []).map((person: ContactPerson) => (
                  <PersonCard key={person._key} person={person} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6 self-start panel">
          <AddressBlock label="Besøksadresse" value={page?.visitAddress} />
          <AddressBlock label="Postadresse" value={page?.postAddress} />
          {page?.generalContact && (
            <div className="space-y-2">
              <p className="font-heading uppercase tracking-widest">
                Generell kontakt
              </p>
              <p className=" leading-6 text-foreground whitespace-pre-line">
                {page.generalContact}
              </p>
            </div>
          )}
          {page?.pressContact && (
            <div className="space-y-2">
              <p className="font-heading uppercase tracking-widest">
                Pressekontakt
              </p>
              <p className=" leading-6 text-foreground whitespace-pre-line">
                {page.pressContact}
              </p>
            </div>
          )}
          {(page?.invoiceAddress || page?.invoiceEmail || page?.ehf) && (
            <div className="space-y-4 border-t border-border pt-4">
              <AddressBlock
                label="Fakturaadresse"
                value={page?.invoiceAddress}
              />
              {page?.invoiceEmail && (
                <AddressBlock
                  label="Faktura e-post"
                  value={page.invoiceEmail}
                />
              )}
              {page?.ehf && (
                <AddressBlock label="EHF / org.nr." value={page.ehf} />
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
