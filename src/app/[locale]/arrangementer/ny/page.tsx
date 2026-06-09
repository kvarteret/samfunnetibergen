import { CalendarPlus } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { SubmitEventForm } from "@/features/events/components/SubmitEventForm";
import { Link } from "@/i18n/navigation";
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale";
import {
  fetchEventGroups,
  fetchEventRooms,
  fetchEventTypes,
} from "@/lib/sanity/fetch";

export const revalidate = 300;

export async function generateMetadata() {
  return {
    title: "Legg til arrangement | Samfunnet i Bergen",
    description:
      "Arrangerer du eller din organisasjon noe på Samfunnet i Bergen? Legg til arrangementet i listen her.",
  };
}

export default async function NyttArrangementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolvePageLocale(params);
  activateRequestLocale(locale);

  const [rooms, eventTypes, groups] = await Promise.all([
    fetchEventRooms(),
    fetchEventTypes(),
    fetchEventGroups(),
  ]);

  return (
    <article className="flex w-full flex-col gap-12">
      <SubmitEventPageIntro />
      <SubmitEventForm rooms={rooms} eventTypes={eventTypes} groups={groups} />
    </article>
  );
}

function SubmitEventPageIntro() {
  return (
    <header className="space-y-6">
      <Link
        className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4 text-foreground/60 hover:text-foreground transition-colors"
        href="/arrangementer"
      >
        ← Arrangementer
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary flex items-center justify-center shrink-0">
              <CalendarPlus
                className="size-5 text-primary-foreground"
                aria-hidden
              />
            </div>
            <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground/60">
              Ny innmelding
            </p>
          </div>
          <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
            Legg til arrangement
          </h1>
          <p className="text-lg leading-7 text-foreground/70 max-w-xl">
            Arrangerer du eller din organisasjon noe på Samfunnet i Bergen? Fyll
            ut skjemaet nedenfor, så vurderer PR-gruppen innmeldingen og legger
            det til i listen.
          </p>
        </div>

        <Surface className="space-y-3 lg:min-w-64">
          <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
            Slik fungerer det
          </p>
          <ol className="space-y-2 text-sm text-foreground/80 leading-6">
            <li className="flex gap-2.5">
              <span className="font-heading text-primary shrink-0">1.</span>
              Fyll ut skjemaet og send inn
            </li>
            <li className="flex gap-2.5">
              <span className="font-heading text-primary shrink-0">2.</span>
              Vi gjennomgår innmeldingen
            </li>
            <li className="flex gap-2.5">
              <span className="font-heading text-primary shrink-0">3.</span>
              Godkjente arrangementer publiseres på nettsiden
            </li>
          </ol>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-foreground/55">
              Vil du endre et arrangement etter innmelding? Send e-post til{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground transition-colors"
                href="mailto:pr@kvarteret.no"
              >
                pr@kvarteret.no
              </a>
            </p>
          </div>
        </Surface>
      </div>
    </header>
  );
}
