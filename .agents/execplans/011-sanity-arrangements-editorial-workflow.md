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
- [x] (2026-07-29 10:22Z) Forenklet arrangementsskjemaet og
  serie-/festivalarbeidsflytene.
- [x] (2026-07-29 10:22Z) Endret offentlige spørringer slik at festivalperioden
  avledes fra
  festivaldagene og arrangementsidetekst kommer fra norske tekstfiler.
- [ ] (2026-07-29 10:22Z) La til tørrkjørbar datamigrering og gjennomførte
  anonym tørrkjøring (gjenstår: autentisert eksport og kontrollert skriving;
  CLI-en mangler innlogget bruker-token).
- [x] (2026-07-29 10:25Z) Regenererte Sanity-typer og fullførte automatisert
  verifisering, produksjonsbygg og offentlig visuell kontroll. Studio-bygget
  passerer; innlogget visuell Studio-kontroll gjenstår sammen med migreringen.
- [x] (2026-07-29 10:30Z) Flatet ut `Arrangementer` til én Studio-rute med
  segmentene `Arrangementer`, `Recurring`, `Festivaler` og `Fremhevede`, uten
  en ekstra navigasjonskolonne.
- [x] (2026-07-29 10:52Z) Flyttet `Innstillinger` til første kolonne, samlet
  `Frivilligfordeler` der, forenklet arrangementsfiltrene og la til
  sidepanel-navigasjon og festivaldaghandling på festivaler.
- [x] (2026-07-29) Plasserte `Innstillinger` nederst i første kolonne.
- [x] (2026-07-29 11:05Z) Rettet gjentakelsesvalget for utkast-ID-er, gjorde
  `Alle` til standard feltgruppe og dokumenterte første og siste dato i en
  gjentakende serie.
- [x] (2026-07-29 11:23Z) La «Legg til festivaldag» synlig øverst i
  festivaldokumentet og gjorde `Fremhevede` til en rangerbar
  liste som styrer de tre arrangementene øverst på forsiden.
- [x] (2026-07-29 11:28Z) Verifiserte oppfølgingen med 15 fokuserte tester,
  TypeScript, lint, Sanity TypeGen, Studio-bygg, Next.js-bygg og anonym
  GROQ-kontroll mot dagens datasett.
- [x] (2026-07-29 11:50Z) Begrenset fremheving til enkeltarrangementer,
  serieforeldre og festivalforeldre, la til søkbar «Legg til arrangement» og
  sentrerte én eller to fremhevede kort på forsiden.
- [x] (2026-07-29 11:52Z) Verifiserte fremhevingsoppfølgingen med ni
  fokuserte tester, lint, Studio-bygg, Next.js-bygg og anonym GROQ-kontroll.
  Full `tsc` stopper i en samtidig, ikke-relatert bookingtest.
- [x] (2026-07-29 12:07Z) Gjorde medlemskapet over og under skillelinjen
  stabilt, begrenset toppgruppen til én–tre arrangementer og avviser et fjerde
  arrangement med forklarende melding uten å endre den lagrede rekkefølgen.
- [x] (2026-07-29 12:08Z) Verifiserte den stabile toppgruppen med 23
  fokuserte tester, Sanity TypeGen, TypeScript, lint, Studio-bygg og
  Next.js-produksjonsbygg.
- [x] (2026-07-29 12:23Z) Lukket nullgruppe-kanttilfellet ved automatisk å
  flytte første kommende arrangement over linjen når listen har innhold, men
  ingen lagret toppplassering.
- [x] (2026-07-29 12:24Z) Verifiserte automatisk gjenoppretting med 11
  fokuserte tester, TypeScript, lint og Sanity Studio-bygg.
- [x] (2026-07-29 12:28Z) Endret flytting opp slik at den flyttede raden
  legges sist i toppgruppen uten å erstatte eller omrangere eksisterende
  toppvalg; gruppen vokser fra én til to og fra to til tre.
- [x] (2026-07-29 12:29Z) Verifiserte append-regelen med 12 fokuserte tester,
  TypeScript, lint og Sanity Studio-bygg.
- [x] (2026-07-29) Undersøkte den vedvarende dra-og-slipp-feilen mot
  ordningspluginens faktiske API og erstattet den simulerte skillelinjen med
  en kontrollert liste på ett–tre fremhevede arrangementer.
- [x] (2026-07-29) La til eksplisitt `promotedOrder`, migrering ved åpning,
  søkbart tillegg som alltid appenderer, fjerning med minimumsvern og
  dra-og-slipp som bare rangerer de valgte arrangementene.
- [x] (2026-07-29) Utvidet den kontrollerte listen til en ubegrenset kø:
  de tre første kommende arrangementene vises på forsiden, mens senere valg
  rykker automatisk frem når et tidligere arrangement avsluttes.
- [x] (2026-07-29) Rettet køens samtidighetsfeil: liveoppdateringer
  serialiseres og slås sammen, søkepanelet gjør ikke lenger egne
  mutasjonsutløste refetch, og hver kø-rad er én stabil draggable-enhet.
- [x] (2026-07-29) Fullførte nettleser-E2E av flytting, sletting med automatisk
  opprykk og søkbart gjenopptak. Fjernet den siste stale live-oppdateringen,
  gjorde lagring ikke-blokkerende og synkroniserte alltid både publisert
  dokument og eksisterende utkast.
- [x] (2026-07-29) Delte synlige og kølagte arrangementer i to faktiske
  droppsoner. Et arrangement som slippes under skillelinjen flyttes nå
  deterministisk til køen uten at et annet køelement flyttes opp.
- [x] (2026-07-29) Fjernet visuelle rammer rundt den tekniske kø-droppsonen og
  kølisten. Den store trefflaten er beholdt, men grensesnittet viser igjen bare
  arrangementskort og én køskillelinje.

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

- Observation: Den ferdige oppryddingsmigreringen kan lese det offentlige
  datasettet anonymt, men `--with-user-token` stopper før kjøring fordi denne
  arbeidskopien ikke har en innlogget Sanity-bruker.
  Evidence: `npm run sanity:migrate:arrangement-editorial-cleanup` svarte
  `no auth token could be found`; anonym tørrkjøring rapporterte 69 dokumenter,
  ett `festivalParent.dates`, 44 `arrangement.language`, fem kategorier, 19
  arrangementstyper, ett `eventsPage`-dokument og null innkommende referanser.

- Observation: Sanitys `useDocumentOperation` avviser ID-er med
  `drafts.`-prefiks selv om skjemafeltet naturlig leser utkastets `_id`.
  Evidence: Valg av Gjentakelse feilet i `editOpsOf`; samme installerte API
  godtar dokumentets publiserte ID og retter operasjonen mot utkastet.

- Observation: Den innebygde «All fields»-gruppen kan overstyres ved å
  registrere `ALL_FIELDS_GROUP` eksplisitt i dokumentets feltgrupper.
  Evidence: Installert Sanity 6.7 bruker gruppen med navn `all-fields` som
  innebygd reserve og velger den gruppen som har `default: true`.

- Observation: `@sanity/orderable-document-list` var allerede installert i
  siste versjon som støtter Sanity 6 og brukt for rom, grupper og
  arrangementstyper.
  Evidence: `package.json` har versjon `^2.0.18`; pakken eksponerer både
  `orderRankField` og den innebyggbare React-komponenten
  `OrderableDocumentList`.

- Observation: Seriefordelen på forsiden brukte tidligere bare
  serieforelderens første dato for å avgjøre om serien fortsatt var kommende.
  Evidence: `promotedParentEventsQuery` slo bare opp festivaldager; nå bruker
  både serie- og festivalforeldre sine godkjente barnedokumenter.

- Observation: Datasettet har fem godkjente, fremhevede arrangementer med
  kommende dager og fire fremhevede arrangementer som allerede er avsluttet.
  Ingen av de kommende dokumentene har en eksisterende `orderRank`.
  Evidence: Den samme GROQ-avgrensningen som Studio-listen bruker returnerte
  `5`; et anonymt feltuttrekk viste ni fremhevede dokumenter totalt og
  `orderRank: null`. Derfor viser Studio en engangsknapp for å klargjøre bare
  de urangerte dokumentene.

- Observation: To av de fem tidligere synlige fremhevede dokumentene var
  festivaldager, selv om festivalforelderen også var fremhevet.
  Evidence: Den nye foreldreavgrensningen returnerer nøyaktig tre kommende
  dokumenter: serien «Quiz!», festivalen «Velkomstuken 2026» og
  enkeltarrangementet «BSI: Sosialdans». Søkespørringen fant samtidig to
  kommende, ikke-fremhevede enkeltarrangementer som kan legges til.

- Observation: Den installerte ordningspluginen eksponerer bare handlinger for
  å nullstille rangering og vise flytteknapper; den eksponerer ikke en
  `onDragEnd`-hendelse for innbygging.
  Evidence: `OrderableDocumentListProps` i
  `node_modules/@sanity/orderable-document-list/dist/index.d.ts` har bare
  `options` og `ref`. Studio-visningen fanger derfor identiteten til raden ved
  dragstart og avstemmer den mot den synkroniserte rangeringen.

- Observation: Ordningspluginen har én lineær `orderRank` og kan ikke uttrykke
  en separat, stabil underliste med eget medlemskap. Filtrerte ordningslister
  rangeres fortsatt mot alle dokumenter, og pluginen advarer selv om
  uventede resultater når flere filtrerte lister brukes.
  Evidence: `OrderableDocumentListProps` i installert versjon mangler
  `onDragEnd`, mens pluginens dokumentasjon beskriver global rangberegning for
  filtrerte dokumentsett. Pointer-avlytting og etterfølgende reparasjon av
  pluginens transaksjon kan derfor ikke gi atomisk gruppesemantikk.

- Observation: Første versjon av den nye kandidatspørringen brukte en
  GROQ-arrayfunksjon som ikke parses av det aktive Sanity-API-et.
  Evidence: En direkte anonym datasettspørring feilet; projeksjon av
  `dates[]{startDate}` og korrelerte `childDates` ble deretter validert mot
  dagens datasett.

- Observation: En normaliseringstransaksjon kunne utløse flere samtidige
  listeoppdateringer, som hver observerte mellomtilstand og forsøkte en ny
  normalisering. Når søkepanelet var åpent, lyttet det også til hver mutasjon
  og viste løkken som kontinuerlig refetch.
  Evidence: Next.js-feiloverlegget viste gjentatte Sanity
  `data/mutate/production`-feil med kallstakken
  `persistSelection` → `refresh`. Søkepanelets kandidatgrunnlag avhenger ikke
  av fremhevingsfeltene og trenger derfor ingen egen live-lytter.

- Observation: `visibility: "sync"` kunne bli stående uten svar i den
  innloggede Studio-klienten. Da ble alle rader permanent deaktivert selv om
  ingen mutasjon nådde datasettet.
  Evidence: Nettleser-E2E aksepterte droppet, men knappene forble deaktivert i
  flere minutter og publisert `promotedOrder` var uendret. Med
  `visibility: "async"` og lokal normalisering blir UI ferdig umiddelbart og
  rå datasettkontroll viste den nye rekkefølgen.

- Observation: En live-refresh umiddelbart etter asynkron lagring kunne lese
  den gamle søkeindeksen og overskrive den nettopp lagrede rekkefølgen.
  Evidence: `_updatedAt` ble oppdatert på alle fire dokumentene, men feltene
  endte tilbake i gammel rekkefølge. Uten den redundante live-lytteren forble
  både UI og rådata i den nye rekkefølgen.

- Observation: `drafts`-perspektivet skjuler at et arrangement kan ha både
  publisert dokument og et separat `drafts.`-dokument med gamle
  fremhevingsfelt.
  Evidence: Sletting av BSI oppdaterte først bare publisert dokument; rå
  API-kontroll viste fortsatt `isPromoted: true` på utkastet, som gjeninnførte
  raden ved neste last. En separat raw-spørring etter draft-ID-er gjør at begge
  kopier nå patches i samme transaksjon.

- Observation: Med én sammenhengende droppsone måtte det tredje kortet dras
  forbi midtpunktet til det første køkortet før biblioteket rapporterte
  destinasjonsindeks 3. Et slipp rett under skillelinjen ble derfor rapportert
  som indeks 2 og ignorert som en no-op.
  Evidence: Nettleser-E2E flyttet samme kort først ingen steder ved slipp under
  linjen, men til køen ved slipp nær køkortets nedre halvdel. Separate
  droppsoner med et stort, eksplisitt kømål gjør grensekryssingen entydig.

- Observation: En tom toppgruppe og en ikke-tom pool gjør både søk og
  dra-og-slipp utilstrekkelig.
  Evidence: Alle kommende arrangementer kan allerede ha `isPromoted == true`,
  slik at kandidatsøket er tomt, mens en linje med null medlemmer ikke gir et
  mål en pool-rad kan dras over.

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

- Decision: Gjør `Recurring` og `Festivaler` til segmenter i den samme
  filtrerbare arrangementsvisningen, sammen med `Arrangementer` og
  `Fremhevede`.
  Rationale: Produkteier ønsker å spare en navigasjonskolonne og behandle disse
  som visninger av samme innhold. Festivalvisningen beholder en direkte
  «Ny festivaldag»-handling med riktig festivalmal.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Flytt `Innstillinger` til rotnavigasjonen og samle kategorier,
  arrangementstyper og frivilligfordeler der. Fjern den tomme
  «App og internt innhold»-gruppen.
  Rationale: Produkteier ønsker færre unødvendige navigasjonsnivåer og ett
  forståelig sted for sjeldnere vedlikehold.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Åpne arrangementer med Structure-modus i et sidepanel og tilby
  «Ny festivaldag» både i festivalfilteret og som dokumenthandling på
  festivalen.
  Rationale: Listen og filtrene skal bli stående mens redaktøren beveger seg
  mellom dokumenter, og festivalens vanligste neste handling skal være synlig
  fra begge arbeidsflater.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Gjør den eksplisitte feltgruppen `Alle` til standard i
  arrangementsdokumentet, og la en serie ha nøyaktig én første dato.
  Rationale: Redaktøren skal se hele dokumentet ved åpning, og generering av
  seriedager må ha én entydig startdato. Gjentakelsens sluttdato er siste
  mulige dag; uten sluttdato gjelder sikkerhetsgrensen på seks måneder.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Behold `Fremhevede` som segment i den eksisterende
  arrangementsvisningen, men rendrer pluginens rangerbare dokumentliste i
  segmentet og lagrer rekkefølgen i `orderRank`.
  Rationale: Dette bevarer den flate, plassbesparende navigasjonen og gir
  redaktørene velkjent dra-og-slipp-rekkefølge. De tre første markeres med en
  forklaring og en skillelinje; nettsiden sorterer på samme rangering.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Vis en egen «Legg til festivaldag»-kontroll som første synlige
  felt på festivalforelderen, i tillegg til dokumenthandlingen.
  Rationale: Dokumenthandlinger kan ligge i Sanitys handlingsmeny og oppleves
  derfor som manglende. En kontroll i selve skjemaet gjør festivalens vanligste
  neste steg synlig uten å lete.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Tillat bare enkeltarrangementer, serieforeldre og
  festivalforeldre i `Fremhevede`; tilby et søkbart valg som publiserer
  fremhevingen og legger den nye raden sist i rekkefølgen.
  Rationale: En generert seriedag eller festivaldag skal representeres av
  forelderen, ellers kan forsiden vise samme redaksjonelle arrangement flere
  ganger. Festivalen forblir synlig til og med siste godkjente festivaldag.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Vis maksimalt tre fremhevede kort på forsiden og sentrer raden når
  den inneholder ett eller to kort. I Studio legges skillelinjen etter det
  faktiske antallet når listen har færre enn tre.
  Rationale: Rekkefølgen og skillet skal beskrive det som faktisk vises, også
  når redaksjonen midlertidig har færre enn tre valg.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Lagre `promotedPlacement` som `top` eller `pool` separat fra
  `orderRank`, og bruk de tre første som bakoverkompatibel toppgruppe når ingen
  plassering ennå er lagret.
  Rationale: Rangeringen alene gjør at en annen rad automatisk flyter over
  linjen når én rad flyttes ned. Et separat medlemskap lar bare den raden som
  dras bytte gruppe, samtidig som dagens publiserte data fortsetter å vise de
  samme tre arrangementene uten en forhåndsmigrering.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Gjenopprett forrige `orderRank` og vis den avtalte meldingen hvis
  en redaktør drar et fjerde arrangement inn i toppgruppen. Bruk samme
  gjenoppretting når siste topparrangement forsøkes flyttet ned.
  Rationale: Gruppen skal ha maksimalt tre og minst ett medlem. En avvist
  handling skal derfor ikke indirekte endre verken medlemskap eller
  rekkefølge.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Når den filtrerte listen har minst ett arrangement, men null
  `top`-plasseringer, skal Studio automatisk lagre første arrangement som
  `top`.
  Rationale: Kravet om minst ett fremhevet arrangement skal repareres uten et
  ekstra redaksjonelt steg. Første rad er allerede redaktørens høyest rangerte
  valg, så automatisk gjenoppretting er deterministisk og endrer ikke
  rekkefølgen.
  Date/Author: 2026-07-29, user/Codex.

- Decision: En pool-rad som dras over linjen skal settes etter eksisterende
  toppvalg, uavhengig av nøyaktig slippunkt.
  Rationale: Handlingen betyr «legg til i toppgruppen», ikke «erstatt
  toppvalget på denne posisjonen». Dette gjør at medlemskapet øker fra én til
  to eller fra to til tre, mens den etablerte topprekkefølgen bevares.
  Date/Author: 2026-07-29, user/Codex.

- Decision: Erstatt den tidligere pluginlisten og skillelinjen med en
  kontrollert liste som bare inneholder de faktiske fremhevede valgene.
  `Legg til arrangement` appenderer et valg, `Fjern` tar det ut, og
  dra-og-slipp endrer bare rekkefølgen innenfor listen.
  Rationale: Pluginen tilbyr ikke de hendelsene eller den todelte datamodellen
  som kreves for trygg flytting mellom en toppgruppe og en pool. Den
  kontrollerte listen gjør minimum én, maksimum tre og append-semantikken
  entydig og atomisk.
  Date/Author: 2026-07-29, Codex; supersederer beslutningene om en synlig
  skillelinje og etterfølgende reparasjon av pluginens rangering.

- Decision: Lagre rekkefølgen blant de valgte i `promotedOrder` og behold
  `promotedPlacement` og `orderRank` bare som migrerings-/bakoverkompatible
  felt.
  Rationale: Arrangementenes øvrige administrative `orderRank` skal ikke
  blandes med den korte, eksplisitte forsidelisten. Ved første åpning
  normaliserer Studio eksisterende toppvalg, og når ingen finnes velges første
  kvalifiserte arrangement automatisk.
  Date/Author: 2026-07-29, Codex.

- Decision: Tillat flere enn tre valg i `Fremhevede`, men vis bare de tre
  første kvalifiserte arrangementene på forsiden. Vis resten under en tydelig
  kømarkør i Studio og la tillegg alltid havne sist.
  Rationale: Redaksjonen kan planlegge fremover uten å vente på at et synlig
  arrangement avsluttes. De offentlige spørringene fjerner avsluttede
  kandidater før `promotedOrder` sorteres og begrenses til tre, så neste køvalg
  rykker frem uten at Studio må åpnes.
  Date/Author: 2026-07-29, user/Codex; supersederer maksimum tre valg, men
  beholder maksimum tre synlige kort.

- Decision: Kjør aldri mer enn én fremhevet-refresh om gangen. Overlappende
  lytterhendelser samles til nøyaktig én påfølgende refresh, og kandidatvelgeren
  henter bare ved åpning.
  Rationale: Normalisering skriver til de samme dokumentene som live-lytteren
  observerer. Serialisering gjør skrive–lese-syklusen deterministisk, mens
  fjerning av den overflødige kandidatlytteren hindrer refetch-stormen uten å
  gjøre søkeresultatene utdaterte i den aktuelle brukerflyten.
  Date/Author: 2026-07-29, Codex.

- Decision: Fremhevet-panelet har ingen kontinuerlig dokumentlytter. Det
  henter ved åpning og etter eksplisitt tillegg; flytting og sletting bruker
  transaksjonsresultatet til å oppdatere lokal tilstand.
  Rationale: Panelet er en eksplisitt redaksjonell kø, ikke en generell
  sanntidsmonitor. Dette forhindrer at et stale query-resultat reverserer en
  nylig mutasjon, mens publikumssiden fortsatt beregner aktive toppvalg per
  request.
  Date/Author: 2026-07-29, Codex.

- Decision: Bruk asynkron mutation visibility for køendringer og hent
  eksisterende draft-ID-er separat med raw-perspektiv. Patch publisert ID og
  draft-ID sammen når begge finnes.
  Rationale: Studio skal ikke blokkere på søkeindeksen, og et utkast må aldri
  kunne gjenopplive en slettet eller eldre fremhevingsrekkefølge.
  Date/Author: 2026-07-29, Codex.

## Outcomes & Retrospective

Kodeimplementeringen er fullført. Studio har den nye navigasjonen,
request-telleren, kombinerbare filtre, publiserende statusoverganger,
redaksjonell gjentakelsesbygger, trygg generering av seriedager og egne
festival-/festivaldagmaler. Festivalforelderen har en synlig snarvei for nye
dager, og fremhevede foreldrearrangementer kan søkes frem, legges til og
rangeres direkte i segmentet. Nettsiden avleder festivalperioden fra godkjente
dager, sentrerer én eller to fremhevede kort, håndterer eksplisitt bildearv,
bruker den redaksjonelle rekkefølgen på forsiden og bruker faste norske tekster
uten `eventsPage`.

Sanity TypeGen, TypeScript, lint, Studio-bygg, Next.js-produksjonsbygg og hele
testsuiten passerer. Offentlig runtime-kontroll viste 38 arrangementer med
riktig overskrift og metadata. Det eneste gjenstående arbeidet er operasjonelt:
Sanity CLI må autentiseres, datasettet eksporteres til en fil utenfor
repositoryet, oppryddingsmigreringen kjøres i skrivemodus og de innloggede
Studio-flytene kontrolleres visuelt. Dette ble ikke omgått eller simulert,
fordi arbeidskopien mangler bruker-token og Studio stopper på innlogging.

Fremhevede er nå en egen, kontrollert kø i stedet for en lineær pluginliste
med en simulert skillelinje. Søk og «Legg til» appenderer uten å erstatte
eksisterende kort, «Fjern» er deaktivert ved ett valg, og dra-og-slipp rangerer
hele køen. De tre første kommende arrangementene vises; resten merkes som kø
og rykker automatisk frem når et tidligere valg avsluttes. Forsiden leser samme
medlemskap og `promotedOrder`; eldre `orderRank` og `promotedPlacement`
normaliseres automatisk ved første åpning. Hvis alle lagrede valg har
forsvunnet, velger Studio automatisk første gjenværende kvalifiserte
arrangement.

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
med et låst filter for `isRecurring == true`. `Fremhevede`
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
    promotedPlacement?: "top" | "pool"
    promotedOrder?: number

`useFestivalImage` er bare relevant for `festivalSession`, og `undefined`
behandles som `true` for eksisterende data. `promotedPlacement` er et skjult
redaksjonelt medlemsfelt på fremhevede toppnivådokumenter, og `promotedOrder`
er den nullbaserte rekkefølgen i den kontrollerte listen. Når dokumentene
mangler det nye rekkefølgefeltet, brukes eksisterende `orderRank` bare til å
velge og normalisere inntil tre legacy-valg.

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

Plan revision note (2026-07-29 10:22Z): Milepæl 3–5 er implementert.
Oppryddingsmigreringen er implementert og tørrkjørt anonymt. Produksjonseksport
og skrivemodus gjenstår fordi Sanity CLI ikke har bruker-token; denne
begrensningen og ferske datasettall er dokumentert i Progress og
Surprises & Discoveries.

Plan revision note (2026-07-29 10:25Z): Sluttverifisering er oppdatert med
238 passerende tester, TypeScript, lint, begge produksjonsbygg og offentlig
runtime-kontroll. Outcomes & Retrospective skiller ferdig kode fra den
autentiseringsavhengige produksjonsmigreringen og innlogget Studio-kontroll.

Plan revision note (2026-07-29 10:30Z): Oppfølging fra produkteier er
implementert: `recurring` er rettet til `Recurring`, festivaler er flyttet inn
i arrangementsvisningen, og de tidligere undermenypunktene er erstattet av ett
segmentert filter i samme pane.

Plan revision note (2026-07-29 10:52Z): Andre oppfølgingsrunde er implementert.
Innstillinger og frivilligfordeler er samlet i første kolonne,
arrangementssegmentet heter `Alle`, statusfilteret bruker `Alle statuser` og
`Kommende`, og festivaldagmalen brukes nå fra både festivalvisningen og
festivalens dokumenthandling. Arrangementlenker ber eksplisitt om sidepanel i
Structure-modus.

Plan revision note (2026-07-29): `Innstillinger` er flyttet til bunnen av
første kolonne etter produkteiers presisering; innholdet i seksjonen er
uendret.

Plan revision note (2026-07-29 11:05Z): Gjentakelsesfeltet normaliserer nå
utkast-ID før dokumentoperasjoner. Arrangementsdokumentet åpner i `Alle`, og
skjemaet forklarer at seriens dato er første dag mens gjentakelsesfeltet styrer
siste mulige dag.

Plan revision note (2026-07-29 11:23Z): Festivaldagsnarveien er flyttet inn i
selve festivaldokumentet. `Fremhevede` bruker den installerte
ordningspluginen, og nettsiden viser de tre første fremtidige arrangementene i
den lagrede rekkefølgen.

Plan revision note (2026-07-29 11:28Z): Sluttverifisering og dagens
datasettobservasjon er lagt inn. Innlogget visuell Studio-kontroll kunne ikke
utføres fordi den lokale Studio-ruten stoppet ved Sanity-innlogging; begge
produksjonsbygg og alle målrettede kontroller passerer.

Plan revision note (2026-07-29): Segmentet heter nå `Fremhevede`, og den
valgfrie «Vis flytteknapper»-kontrollen er fjernet etter produkteiers
presisering. Dra-og-slipp og engangsklargjøring av manglende rangering består.

Plan revision note (2026-07-29 11:50Z): Fremheving er begrenset til
enkeltarrangementer og serie-/festivalforeldre. Segmentet har søkbar
tilleggshandling, skillelinjen følger ett til tre faktiske valg, forsiden
sentrerer korte rader, og festivalens siste dag bestemmer når den forsvinner.

Plan revision note (2026-07-29 11:52Z): Verifiseringsresultatene og den
ikke-relaterte TypeScript-feilen i den samtidige bookingtesten er dokumentert,
slik at planens status kan gjenopptas uten å blande arbeidsområdene.

Plan revision note (2026-07-29 12:07Z): Skillelinjen er gjort til en lagret,
stabil gruppe på én–tre arrangementer. Planen dokumenterer
bakoverkompatibiliteten, dragavstemmingens pluginbegrunnelse og at ulovlige
flyttinger gjenoppretter forrige rangering.

Plan revision note (2026-07-29 12:08Z): Verifiseringsdelen er oppdatert med 23
fokuserte tester, regenererte Sanity-typer og vellykkede TypeScript-, lint-,
Studio- og Next.js-bygg.

Plan revision note (2026-07-29 12:23Z): Kanttilfellet med en ikke-tom pool og
tom toppgruppe er dokumentert og løst ved deterministisk automatisk
fremheving av første rad.

Plan revision note (2026-07-29 12:24Z): Verifisering av kanttilfellet er
dokumentert med fokuserte tester og komplette Studio-kontroller.

Plan revision note (2026-07-29 12:28Z): Semantikken ved flytting opp er
presisert og implementert som append til toppgruppen, med bevaring av
eksisterende toppvalg og maksimum tre.

Plan revision note (2026-07-29 12:29Z): Append-regelen er verifisert med egne
én-til-to- og to-til-tre-scenarier samt komplette Studio-kontroller.

Plan revision note (2026-07-29): Den kroniske pluginfeilen er undersøkt mot
installert API og offisiell dokumentasjon. Den simulerte todelingen er
supersedert av en kontrollert én–tre-liste med dedikert `promotedOrder`,
automatisk legacy-normalisering, søkbart append og intern dra-og-slipp.

Plan revision note (2026-07-29): Produkteiers addendum utvider den kontrollerte
listen til en fremtidskø uten maksimum. Bare de tre første kvalifiserte
arrangementene vises på forsiden; senere valg beholdes i rekkefølge og rykker
automatisk frem ved utløp.

Plan revision note (2026-07-29): Oppfølgingsfeilen ved flytting og sletting er
sporet til overlappende normaliseringsrefresh og en redundant live-lytter i
søkepanelet. Refresh er nå serialisert og koalesert, og draggable-raden
omslutter både kømarkør og kort i én målt enhet.

Plan revision note (2026-07-29): Full E2E avdekket at synkron mutation
visibility, stale listelytting og separate draft-felt var tre uavhengige
årsaker til heng og tilbakerulling. Panelet bruker nå asynkron lagring med
lokal normalisering, ingen live-lyttere og eksplisitt draft-/published-patching.

Plan revision note (2026-07-29): Synlig toppgruppe og kø er nå egne droppsoner.
Dette fjerner den tvetydige indeksgrensen der et slipp under linjen fortsatt
kunne bli tolket som tredje plass, og bevarer eksplisitt én til tre synlige
arrangementer uten å trekke et annet arrangement opp fra køen.

Plan revision note (2026-07-29): De separate droppsonene er nå visuelt
transparente. Den tekniske inndelingen er beholdt for pålitelig dra-og-slipp,
uten å tegne et tomt ekstra panel eller en ytre ramme rundt køkortene.
