# Forenkle arrangementsarbeidet i Sanity Studio

Denne ExecPlanen er et levende dokument. Seksjonene `Progress`,
`Surprises & Discoveries`, `Decision Log` og `Outcomes & Retrospective` skal
holdes oppdatert mens arbeidet pågår.

Planen skal vedlikeholdes i samsvar med `.agents/PLANS.md` fra roten av
repositoryet.

## Purpose / Big Picture

Arrangementer i Sanity Studio skal kunne driftes av en travel redaksjon som
ikke kjenner datamodellen eller tekniske Sanity-begreper. Etter endringen finner
redaktøren nye innsendinger under `Requests`, behandler dem med tydelige
handlinger, finner publiserte arrangementer gjennom én søkbar og filtrerbar
visning, og administrerer serier og festivaldager uten å møte ord som
«instans», «forelder», «slug» eller «RRULE».

Første kolonne under `Arrangementer` skal ha fire tydelige seksjoner:
`Requests`, `Arrangementer`, `Festivaler` og `Innstillinger`. Separate
menypunkter for kommende, tidligere, skjulte, avlyste, utsatte og absolutt alle
arrangementer erstattes av filtervalg i arrangementsvisningen. Et levende merke
ved `Requests` viser hvor mange forespørsler som ikke er behandlet.

Festivalens offentlige periode skal beregnes fra første til siste godkjente
festivaldag. Festivalen skal derfor ikke ha egne datoer som kan komme i konflikt
med dagene. Den redigerbare toppseksjonen «Innhold på arrangementsiden»
pensjoneres, og sidetittel og søkemotorbeskrivelse flyttes til nettsidens norske
tekstfiler.

Arbeidet er ferdig når en ny redaktør kan åpne Studio, forstå menyen og
gjennomføre hele arbeidsflyten uten muntlig forklaring, når nettsiden fortsatt
viser arrangementer, serier og festivaler korrekt, og når ubrukte
arrangementsfelt er fjernet fra både skjema og eksisterende data.

## Progress

- [x] (2026-07-29) Kartla dagens Studio-struktur, arrangementsskjema,
  statushandlinger, offentlige GROQ-spørringer og arrangementsider.
- [x] (2026-07-29) Verifiserte Sanity Studio 6.7.0 sine begrensninger for
  dynamiske menytitler og kombinerbare filtre i standard dokumentlister.
- [x] (2026-07-29) Reviderte det publiserte datasettet uten å endre det:
  86 arrangementer, én serie med 27 seriedager og én festival med åtte
  festivaldager.
- [x] (2026-07-29) Låste produktbeslutninger om språk, meny, filtre,
  festivalperiode, tilgang til gjenåpning, kategorivedlikehold og pensjonering
  av arrangementsidens innholdsdokument.
- [x] (2026-07-29 10:12Z) Implementerte den nye menyen, en draft-bevisst teller
  og den filtrerbare
  arrangementsvisningen.
- [x] (2026-07-29 10:14Z) Implementerte komplett og publiserende
  request-arbeidsflyt.
- [ ] (2026-07-29 10:14Z) Forenkle arrangementsskjemaet og
  serie-/festivalarbeidsflytene.
- [ ] Endre offentlige spørringer slik at festivalperioden avledes fra
  festivaldagene og arrangementsidetekst kommer fra norske tekstfiler.
- [ ] Legg til tørrkjørbar datamigrering, ta sikkerhetskopi og gjennomfør
  kontrollert opprydding.
- [ ] Regenerer Sanity-typer og fullfør automatisert, visuell og
  produksjonsnær verifisering.

## Surprises & Discoveries

- Observation: Standard `DocumentListBuilder` i installert Sanity-versjon har
  en fast GROQ-avgrensning, tekstsøk og sortering, men ingen API for
  redaksjonelle hurtigfiltre som kan kombineres av brukeren.
  Evidence: `node_modules/sanity/lib/types-pSwINOjF.d.ts` eksponerer
  `filter`, `params` og `defaultOrdering`, men ingen dynamisk filtermodell.

- Observation: Menypunktets tittel må være en statisk streng. En levende teller
  kan likevel rendres som en React-komponent i ikon-/merkeområdet på samme rad.
  Evidence: `ListItemBuilder.title` aksepterer `string`, mens
  `ListItemBuilder.icon` aksepterer en React-komponent eller React-node.

- Observation: «Innhold på arrangementsiden» er ikke virkningsløst i dagens
  kode. Dokumentets tittel brukes på siden, og beskrivelsen brukes i metadata.
  Bare eyebrow-feltet hentes uten å bli rendret.
  Evidence: `src/app/[locale]/arrangementer/page.tsx` kaller
  `fetchEventsPageContent` både for sidetittel og metadata.

- Observation: Det publiserte `eventsPage`-dokumentet har ingen innkommende
  referanser i datasettet per 2026-07-29, så det kan pensjoneres kontrollert.
  Evidence: anonym GROQ-spørring med `count(*[references("eventsPage")])`
  returnerte `0`.

- Observation: Festivalen lagrer i dag fire egne datoer samtidig som den har
  åtte festivaldager. Dette er akkurat den doble sannhetskilden den nye
  arbeidsflyten skal fjerne.
  Evidence: datasettgjennomgangen fant `festivalParent` «Velkomstuken 2026»
  med fire datoer og åtte dokumenter med `eventKind == "festivalSession"`.

- Observation: Det finnes 44 eldre arrangementer med et skjult `language`-felt
  som verken finnes i gjeldende skjema eller leses av nettsiden. Ingen
  arrangementer har en lagret `adminNote`.
  Evidence: feltopptelling over publiserte arrangementer i datasettet.

## Decision Log

- Decision: Bruk de avtalte menynavnene `Requests`, `recurring` og `Avvist`;
  all annen redaksjonell tekst skal være vennlig og konsis norsk.
  Rationale: Dette er den eksplisitte språkblandingen produkteier valgte.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Bygg en egen Studio-visning for arrangementssøk og filtre.
  Rationale: Standard dokumentliste kan ikke kombinere dato, synlighet,
  arrangementsstatus og kategori slik kravene beskriver.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Vis request-telleren som et levende merke ved siden av menynavnet,
  ikke ved å erstatte hele navigasjonen.
  Rationale: Dette gir sanntidsoppdatering med betydelig mindre og mer
  vedlikeholdbar spesialkode enn en helt egen førsteskolonne.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Skjul seriedager og festivaldager fra den flate hovedlisten og gjør
  dem tilgjengelige under serien eller festivalen.
  Rationale: Den eksisterende serien har 27 dager; å vise alle flatt gjør
  hovedlisten ubrukelig.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Festivalens periode avledes fra første til siste godkjente
  festivaldag. Festivalforelderen lagrer ingen egne datoer.
  Rationale: Festivaldagene er den eneste meningsfulle kilden til varigheten,
  og avledning forhindrer motstridende datoer.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Festivalen krever bilde og tekst. Festivaldagene krever dato og
  starttid, men kan arve bilde, tekst og lenker; lenker er valgfrie.
  Rationale: Produkteier valgte at bare festivalens innhold skal være
  obligatorisk, mens dagene skal kunne være lette å opprette.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Både Sanity-rollene administrator og editor kan gjenåpne en avvist
  request.
  Rationale: Dette er valgt tilgangsnivå; visningsroller skal ikke få
  handlingen.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Kategorier og arrangementstyper beholdes under en egen,
  sekundær `Innstillinger`-seksjon.
  Rationale: De må kunne vedlikeholdes, men skal ikke konkurrere med daglige
  arbeidsoppgaver.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Pensjoner `eventsPage` fullstendig og bruk faste norske tekster på
  nettsiden.
  Rationale: Produkteier ønsker ingen redaksjonell toppseksjon; dagens
  nettsidekobling må derfor erstattes før dokumentet slettes.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Behold materialiserte serie- og festivaldager som egne
  arrangementdokumenter.
  Rationale: De gir hver dag varig nettadresse, individuell status og egne
  overstyringer. Endringen skal forenkle redaksjonsflaten, ikke reversere
  datamodellen fra ADR 005 og ADR 006.
  Date/Author: 2026-07-29, Codex.

## Outcomes & Retrospective

Planleggingen er fullført. Implementering, migrering og sluttverifisering
gjenstår. Denne seksjonen skal oppdateres ved slutten av hver milepæl med hva
som faktisk ble levert, avvik fra planen og lærdommer som påvirker videre
arbeid.

## Context and Orientation

Sanity Studio konfigureres i `sanity.config.ts`. Den redaksjonelle
førstekolonnen bygges i `src/studio/structure.ts`, mens arrangementsskjemaet
ligger i `src/studio/schemaTypes/documents/arrangement.ts`. Egendefinerte
dokumenthandlinger ligger under `src/studio/actions/`.

Alle offentlige arrangementdata leses fra Sanity gjennom
`src/lib/sanity/queries/events.ts` og normaliseres i
`src/lib/sanity/fetch/events.ts`. Nettsidene ligger under
`src/app/[locale]/arrangementer/`, mens forsiden, iCal og JSON-LD-feeden er
andre forbrukere av samme arrangementsmodell. Etter skjema- eller
spørringsendringer skal TypeGen regenerere
`src/lib/sanity/sanity.types.ts` og `src/studio/sanity.types.ts`; disse filene
skal aldri redigeres manuelt.

Et `arrangement` kan være et enkeltarrangement, en serie, en seriedag, en
festival eller en festivaldag. De tekniske lagringsverdiene er henholdsvis
`single`, `seriesParent`, `seriesInstance`, `festivalParent` og
`festivalSession`. Disse verdiene skal fortsette å eksistere i data og kode,
men skal ikke vises til redaksjonen.

`approvalStatus` styrer om et arrangement er godkjent for nettsiden. En request
har `pending`, en godkjent oppføring har `approved`, en midlertidig skjult
oppføring har `paused`, en avvist request har `rejected`, og en arkivert
oppføring har `archived`. `eventStatus` er en annen verdi og beskriver om det
virkelige arrangementet er planlagt, avlyst eller utsatt. De to statusene må
ikke blandes.

Innsendinger fra nettsiden opprettes av
`src/features/events/actions/submitEvent.ts` som publiserte Sanity-dokumenter
med `approvalStatus: "pending"` og innsenderens e-post. Direkte oppretting i
Studio må bruke egne maler og starte som godkjent, slik at interne
redaksjonsoppføringer ikke havner i Requests.

ADR 005 i
`docs/adr/005-materialized-event-instances-and-festival-event-graphs.md`
definerer hvorfor hver serie- og festivaldag er et eget dokument. ADR 006 i
`docs/adr/006-series-child-authoring-and-program-desk.md` definerer at disse
dagene skal være underordnet i Studio. Denne planen viderefører begge
beslutningene.

## Plan of Work

### Milestone 1: Ny navigasjon og filtervisning

Ombygg `src/studio/structure.ts` slik at `Arrangementer` bruker navngitte
skillelinjer og bare viser de avtalte menypunktene. Under `Requests` skal
`Requests` og `Avvist` være standard dokumentlister med redaksjonsvennlige
forhåndsvisninger. Requests-listen skal filtrere på `pending` og kjennetegn på
nettsideinnsending, i praksis at `submittedByEmail` finnes. Avvist-listen skal
bruke samme avgrensning med `rejected`.

Lag en liten React-komponent for request-merket. Den skal lytte på
draft-bevisste Sanity-data, telle unike, ubehandlede nettsideinnsendinger og
vise tallet i samme menyrad. Den må oppdatere seg når en request opprettes,
godkjennes, avvises eller gjenåpnes, uten full sidelasting.

Lag en egendefinert komponent-pane for arrangementer ved hjelp av Sanitys
`useClient`, komponenter fra `@sanity/ui` og `IntentLink` fra
`sanity/router`. Den skal hente forfattervendte dokumenter, aldri seriedager
eller festivaldager, og åpne et valgt dokument med vanlig Sanity
redigeringsintensjon.

Komponenten skal ha følgende filtertilstand:

- dato: alle datoer, kommende eller tidligere;
- synlighet: godkjent, skjult, arkivert eller alle tre;
- faktisk status: alle, planlagt, avlyst eller utsatt;
- kategori og arrangementstype;
- fritekstsøk i tittel.

Standardmenyen `Arrangementer` bruker godkjent synlighet, alle datoer og
arrangementrollene enkeltarrangement og serie. `recurring` bruker samme visning
med et låst filter for `isRecurring == true`. `Fremhevede arrangementer`
bruker et låst filter for `isPromoted == true`. Festivaler holdes utenfor disse
tre og administreres under sin egen seksjon. Filtervisningen skal vise
resultatantall, aktiv filtertilstand, en tydelig «Nullstill filtre»-handling og
forståelige tomtilstander.

Behold kategori- og arrangementstypelistene under `Innstillinger`. De skal
fortsatt bruke eksisterende rekkefølgefunksjon.

Milepælen er godkjent når første kolonne har riktig hierarki, request-merket
oppdateres direkte, filter kombineres uten navigasjon til nye menypunkter, og
alle rader åpner riktig dokument.

### Milestone 2: Komplett request- og statusarbeidsflyt

Utvid statusmodellen og dokumenthandlingene under `src/studio/actions/`.
Handlingene skal vise redaksjonelle verb, ikke rå statusverdier. Minst følgende
overganger skal finnes:

- ubehandlet til godkjent eller avvist;
- avvist til ubehandlet med «Gjenåpne request»;
- godkjent til midlertidig skjult eller arkivert;
- skjult til godkjent eller arkivert;
- arkivert til godkjent.

Godkjenning skal ta med siste redigerte utkast, skrive `approved`, publisere
resultatet og fjerne et eventuelt foreldet utkast som én sammenhengende
brukerhandling. Avslag og gjenåpning skal tilsvarende bevare siste redigerte
innhold. Ikke la en request forsvinne fra køen bare fordi utkastet har fått ny
status mens den publiserte versjonen fortsatt er `pending`.

Bruk `currentUser.roles` til å vise «Gjenåpne request» bare for rollene
`administrator` og `editor`. Stol fortsatt på Sanity-prosjektets
skrivebeskyttelse som autoritativ tilgangskontroll; skjuling av handlingen er
den redaksjonelle brukerflaten, ikke en erstatning for datasettets roller.

Skjul det rå `approvalStatus`-feltet i arrangementsskjemaet. Behold
`eventStatus`, men presenter det som et enkelt valg med ordene «Planlagt»,
«Avlyst» og «Utsatt» og en kort forklaring om at avlyste og utsatte
arrangementer fortsatt kan være synlige med merking.

Milepælen er godkjent når godkjenning flytter dokumentet fra Requests til
Arrangementer og faktisk gjør siste redigerte versjon tilgjengelig for
offentlige spørringer, avslag flytter det til Avvist, og tillatte brukere kan
gjenåpne det.

### Milestone 3: Redaksjonsvennlige arrangementer og serier

Revider alle titler, beskrivelser, valg og valideringsmeldinger i
arrangementsskjemaet. Ikke vis «instans», «forelder», «slug», «RRULE»,
«materialisert», «sterk referanse» eller lagringsverdiene for
`eventKind`. Bruk blant annet «Nettadresse», «Gjentakelse», «Serie»,
«Seriedag», «Festival» og «Festivaldag».

Skjul `eventKind`, `parentEvent` og den lagrede gjentakelsesregelen fra vanlig
skjemaredigering. Lag en synlig `recurring`-boks for enkeltarrangementer og
serier. En egen feltkomponent skal skrive både `isRecurring` og korrekt
`eventKind`, og presentere frekvens, ukedager og sluttdato med vanlige ord mens
den serialiserer den eksisterende regelen internt. Boksen kan ikke slås av når
serien har dager; redaktøren skal få en forklaring og lenke til dagene.

Legg til tydelige opprettingsmaler:

- nytt arrangement: `single`, `approved`, `scheduled`;
- ny festival: `festivalParent`, `approved`, `scheduled`;
- ny festivaldag, bare tilgjengelig inne i en festival:
  `festivalSession`, riktig `parentEvent`, `approved`, `scheduled`.

Seriedager skal fortsatt genereres, ikke opprettes fra den globale
opprettingsmenyen. Flytt eksisterende genereringslogikk til en gjenbrukbar,
klientsikker grense hvis nødvendig, og legg til dokumenthandlingen «Opprett
eller oppdater dager» på serier. Handlingen skal vise hvilke dager som blir
opprettet, hvilke som allerede finnes og hvilke tidligere genererte dager som
ikke lenger følger mønsteret før den skriver. Den eksisterende grensen på ett
semester, maksimalt seks måneder, og beskyttelsen av redigerte, avlyste eller
utsatte dager skal beholdes. recurring-visningen skal merke serier som mangler
kommende dager innen åtte uker, men dette skal ikke være et eget menypunkt.

Milepælen er godkjent når en redaktør kan opprette et arrangement, merke det
som recurring, angi gjentakelsen uten teknisk syntaks og opprette dagene fra
Studio.

### Milestone 4: Festivaler og avledet festivalperiode

Behold festivalen som `festivalParent` og hver dag som `festivalSession`, men
endre all redaksjonell tekst til festival og festivaldag. Når en festival
åpnes fra menyen, skal neste nivå tilby «Rediger festival» og
«Festivaldager». Listen over festivaldager sorteres etter dato og starttid.

Festivalen skal kreve tittel, nettadresse, bilde og beskrivelse. Den skal ikke
vise eller validere et eget datofelt. Festivaldagen skal kreve én dato og
starttid; sluttid er valgfri. Manglende tekst, billettlenke og Facebook-lenke
skal fortsatt arves feltvis fra festivalen.

Legg til et lagret, virkningsfullt boolsk felt på festivaldager med internt navn
`useFestivalImage` og synlig navn «Bruk festivalbildet». Det skal være valgt
som standard. Når det er valgt, skjules eget bilde og nettsidens
innholdsoppløsning bruker festivalbildet. Når det ikke er valgt, krever
valideringen et eget bilde, og manglende bilde skal ikke falle tilbake til
festivalen på offentlige flater. Eldre festivaldager uten feltet tolkes som at
festivalbildet skal brukes.

Endre arrangementsprojeksjonen i
`src/lib/sanity/queries/events.ts` slik at `festivalParent` får en avledet
`dates`-liste fra godkjente festivaldager, sortert etter dato og tid. Andre
arrangementroller beholder dagens `dates`. Forsidevisning av en fremhevet
festival skal bruke kommende godkjente festivaldager for å avgjøre om
festivalen er aktuell. Det offentlige TypeScript-grensesnittet
`PublishedEvent` og feltet `dates` skal beholde formen sin; forbrukerne skal
ikke måtte kjenne til en ny festival-datotype.

Studio kan vise perioden ut fra alle lagrede festivaldager for å hjelpe
redaktøren, mens nettsiden bare bruker godkjente festivaldager. En festival
uten godkjente dager skal ikke vises som kommende på forsiden.

Milepælen er godkjent når endring av første eller siste festivaldag automatisk
endrer festivalperioden, arvet og eget bilde virker, og festivalen ikke har et
redigerbart datofelt.

### Milestone 5: Pensjoner arrangementsidetekst og fjern ubrukte felt

Legg til en fast `title` i `EventsPage`-seksjonen i
`src/messages/nb.json`, og bruk eksisterende `Metadata.eventsDescription` som
søkemotorbeskrivelse. Fjern `fetchEventsPageContent` fra side og metadata,
fjern GROQ-spørringen og fetch-typen, og la nettsiden alltid bruke
oversettelsesfilen.

Fjern `eventsPage` fra skjemaindeks, singletonregistre, presentasjonsoppsett,
lenkevelger og strukturen. Ruten `/arrangementer` må fortsatt kunne velges som
en intern sti. Oppdater den historiske nyttig-info-migreringen og testene slik
at lenken til Arrangementer bruker `internalPath: "/arrangementer"` i stedet
for en referanse til `eventsPage`.

Fjern følgende felt fra skjema og spørringer fordi de ikke har noen nåværende
forbruker:

- `arrangement.adminNote`;
- det eldre, allerede skjulte `arrangement.language`;
- `eventTaxonomyGroup.slug` og `eventTaxonomyGroup.isActive`;
- `eventType.slug` og `eventType.description`.

Behold `eventType.isActive`, siden det styrer hvilke typer som kan velges i
innsendingsskjemaet. Behold navn, kategorireferanser og `orderRank`, siden de
styrer etiketter, filtre og rekkefølge. Behold innsenderfeltene, siden de er
nødvendige for å identifisere og behandle Requests selv om de ikke vises
offentlig.

Milepælen er godkjent når nettsiden ikke leser `eventsPage`, Studio ikke
eksponerer dokumenttypen eller de ubrukte feltene, og arrangementsiden har
riktig tittel og metadata uten Sanity-dokumentet.

### Milestone 6: Migrering, utrulling og sluttkontroll

Lag en egen migrering med tørrkjøring som standard og en eksplisitt
miljøvariabel for skriving, etter mønsteret til eksisterende migreringer under
`scripts/`. Tørrkjøringen skal rapportere antall berørte dokumenter og
feltverdier uten å skrive.

Migreringen skal:

- fjerne `language` og `adminNote` fra arrangementer;
- fjerne egne `dates` fra `festivalParent`;
- fjerne de avtalte, ubrukte feltene fra kategori- og
  arrangementstypedokumenter;
- slette `eventsPage` bare etter en ny kontroll som viser null innkommende
  referanser.

Før skriving skal datasettet eksporteres til en datert sikkerhetskopi utenfor
repositoryet. Migreringen skal bruke små, repeterbare transaksjoner og tåle å
kjøres på nytt. Dersom referanser til `eventsPage` oppdages, skal den stoppe
uten å slette dokumentet og skrive ut dokument-ID-ene som må konverteres.

Rull først ut nettside- og Studio-koden som ikke lenger avhenger av feltene.
Kjør deretter migreringen og avslutt med produksjonskontroller av Requests,
arrangementssøk, recurring, fremhevede arrangementer, festivaler,
arrangementssider, forsiden og event-feeden.

## Concrete Steps

Alle kommandoer kjøres fra
`/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Etter hver skjema- eller GROQ-milepæl:

    npm run sanity:typegen
    npx tsc --noEmit

For smale enhetstester under utvikling brukes Vitest med aktuell testfil, for
eksempel:

    npx vitest run src/studio/actions/approvalStatus.test.ts
    npx vitest run src/lib/sanity/queries/events.test.ts

Før utrulling:

    npm run sanity:typegen
    npm test
    npx tsc --noEmit
    npm run lint
    npm run studio:build
    npm run build

For migreringen skal `package.json` få to navngitte scripts etter samme mønster
som dagens migreringer:

    npm run sanity:migrate:arrangement-editorial-cleanup
    npm run sanity:migrate:arrangement-editorial-cleanup:write

Den første skal alltid være tørrkjøring. Den andre skal kreve både bruker-token
og en eksplisitt skrivemodus i migreringskoden.

Etter bygg startes Studio og nettsiden lokalt. Åpne `/studio/structure` gjennom
prosjektets Studio-rute og `/nb/arrangementer` på nettsiden. Bruk en testrequest
eller et reversibelt testdokument for å kontrollere statusovergangene. Ikke
endre eller avvis ekte redaksjonelle forespørsler under manuell testing.

## Validation and Acceptance

Automatiserte tester skal dekke:

- alle tillatte og forbudte statusoverganger;
- rollefilteret for «Gjenåpne request»;
- draft-bevisst og duplikatfri request-opptelling;
- arrangementsfilterets kombinasjoner og nullstilling;
- at hovedlisten ekskluderer `seriesInstance`, `festivalSession` og
  `festivalParent`;
- at recurring og fremhevede forhåndsvalg returnerer riktige dokumenter;
- at festival krever bilde og beskrivelse;
- at festivaldag krever dato og starttid;
- at `useFestivalImage` arver ved `true` eller manglende legacy-verdi og krever
  eget bilde ved `false`;
- at festivalperioden avledes fra godkjente festivaldager;
- at offentlige arrangementsspørringer fortsatt bruker
  `approvalStatus == "approved"` og riktig legacy-fallback for manglende
  `eventKind`;
- at de pensjonerte feltene og `eventsPage` ikke finnes i aktivt skjema;
- at brukerrettet arrangementsinnhold ikke inneholder de forbudte tekniske
  ordene.

Manuell Studio-akseptanse:

1. En ny innsending fra nettsiden øker request-merket og vises i `Requests`.
2. Redigering etterfulgt av godkjenning publiserer siste innhold, reduserer
   telleren og gjør dokumentet synlig i riktig arrangementsvisning.
3. Avslag flytter dokumentet til `Avvist`; administrator og editor kan
   gjenåpne det, mens andre roller ikke ser handlingen.
4. Dato, synlighet, faktisk status, kategori, type og tekstsøk kan kombineres.
   Resultatantall og tomtilstand er forståelige.
5. En serie viser «Dager», kan opprette eller oppdatere dem fra Studio og
   fyller ikke hovedlisten med hver enkelt dag.
6. En festival viser «Festivaldager». Ny dag arver festivalbildet som standard,
   og eget bilde kan velges eksplisitt.
7. Ingen synlig tekst bruker «instans», «forelder», «slug» eller «RRULE».

Manuell nettside-akseptanse:

1. `/nb/arrangementer` har fast norsk tittel og metadata uten `eventsPage`.
2. Godkjente enkeltarrangementer og serie-/festivaldager vises som før.
3. En fremhevet festival bruker første og siste godkjente festivaldag som
   periode.
4. Endring av festivaldagens bildevalg, tekst eller lenker gir riktig arvet
   eller overstyrt innhold.
5. Avlyst og utsatt merking, arrangementdetaljer, forsiden og
   `/api/events/feed` fungerer fortsatt.

## Idempotence and Recovery

Kodeendringene er vanlige, versjonskontrollerte endringer og kan rulles tilbake
med en ny korrigerende commit. Generering av seriedager skal fortsatt bruke
deterministiske dokument-ID-er og `createIfNotExists`, slik at samme
genereringshandling kan kjøres flere ganger uten duplikater eller overskriving
av redigerte dager.

Datamigreringen er additiv i rapporteringsfasen og destruktiv bare i eksplisitt
skrivemodus. Den skal bruke `unset` for felt, kontrollere referanser før sletting
og være trygg å kjøre på nytt. Datasetteksporten er gjenopprettingskilden hvis
innhold må hentes tilbake. `eventsPage` skal aldri slettes før nettsiden er
rullet ut med faste tekster og referansekontrollen fortsatt viser null.

Hvis produksjonskontrollen finner en feil etter migrering, rull tilbake
applikasjonskoden bare dersom den fortsatt tåler manglende legacy-felt. Ellers
rett fremover eller gjenopprett de konkrete dokumentfeltene fra eksporten;
ikke importer hele datasettet over nyere redaksjonelle endringer.

## Artifacts and Notes

Kildekartleggingen 2026-07-29 fant:

    arrangementer totalt: 86
    serieforeldre: 1
    seriedager: 27
    festivalforeldre: 1
    festivaldager: 8
    godkjente arrangementer: 86
    eventsPage-referanser: 0
    legacy language-felt: 44
    adminNote-felt med data: 0

Disse tallene er kun planleggingsgrunnlag. Migreringens tørrkjøring skal
rapportere ferske tall, og de ferske tallene er autoritative ved utrulling.

## Interfaces and Dependencies

Det offentlige `PublishedEvent`-grensesnittet fra
`src/lib/sanity/fetch/events.ts` skal beholde dagens `dates`-form. For en
festivalforelder fylles verdien av festivaldagene i GROQ i stedet for egne
lagrede datoer. Ingen ekstern route eller feed skal få et nytt
festivalspesifikt wire-format.

Arrangementsskjemaet får ett nytt lagret felt:

    useFestivalImage?: boolean

Feltet er bare relevant for `festivalSession`. `undefined` behandles som
`true` for eksisterende data.

Den egendefinerte arrangementsvisningen skal ha en intern filtermodell med
disse stabile verdiene:

    date: "all" | "upcoming" | "past"
    visibility: "approved" | "paused" | "archived" | "all"
    eventStatus: "all" | "scheduled" | "cancelled" | "postponed"
    taxonomyGroupId: string | null
    eventTypeId: string | null
    query: string
    preset: "arrangements" | "recurring" | "promoted"

Filterlogikken skal ligge i rene funksjoner som kan enhetstestes uavhengig av
React-komponenten. Dokumentnavigasjon skal bruke `IntentLink` fra
`sanity/router`; datatilgang skal bruke `useClient` fra `sanity`; visuelle
kontroller skal bruke `@sanity/ui`. Ikke introduser en ny tredjeparts
filter- eller tabellavhengighet.

Statushandlingene skal bygge på én sentral overgangsmodell, slik at
handlingstekster, roller og tester ikke kan drive fra hverandre. Handlingene
skal operere på arrangementdokumenter og bruke Sanitys dokumentoperasjoner
eller transaksjoner på en måte som publiserer siste utkast før de rapporterer
fullført.

Plan revision note (2026-07-29): Opprettet fra den godkjente samtaleplanen og
utvidet til en selvstendig ExecPlan med implementeringsmilepæler,
datamigrering, grensesnitt, gjenoppretting og observerbare akseptansekriterier.

Plan revision note (2026-07-29 10:07Z): Implementeringen er startet. Progress
viser nå at milepæl 1 er aktiv, slik at neste bidragsyter kan fortsette fra
planen alene.

Plan revision note (2026-07-29 10:12Z): Milepæl 1 er implementert og verifisert
med fire fokuserte tester samt `npx tsc --noEmit`. Progress viser at
request-arbeidsflyten nå er aktiv.

Plan revision note (2026-07-29 10:14Z): Milepæl 2 er implementert med én
sentral overgangsmodell og transaksjonell publisering av siste utkast. Seks
fokuserte tester og TypeScript-kontrollen passerer. Skjema- og
serie-/festivalarbeidet er nå aktivt.
