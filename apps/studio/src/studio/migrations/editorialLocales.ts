type LocalizedItem = { _key: string; language: string; value: unknown }
type Block = {
  _key?: string
  children?: Array<{ text?: string; [key: string]: unknown }>
  [key: string]: unknown
}

const roomsSections: Record<string, { title: string; body: string[] }> = {
  "459dc7f1e082": {
    title: "How to book",
    body: [
      "Find the room that suits your event. Check capacity and facilities on the room page.",
      "Send a booking request with your event details, time slot and required facilities.",
      "The room coordinator will process your request and confirm by email. The booking is not valid until you have received written approval.",
    ],
  },
  c67ce756e62e: {
    title: "Rental hours",
    body: [
      "Monday to Thursday: 12:00–01:00",
      "Friday: 12:00–03:00",
      "Saturday: 14:00–03:00",
      "Sunday: 16:30–22:00",
    ],
  },
  b95a02c6562e: {
    title: "Questions and terms",
    body: [
      "Frequently asked questions",
      "Cancellation terms",
      "Rental terms",
      "The guardian arrangement",
    ],
  },
}

const usefulSections: Record<string, { title?: string; body?: string[] }> = {
  adkomst: {
    title: "Getting here",
    body: [
      "Kvarteret is in the centre of Bergen, a short walk from Bergen station, Bryggen and the University of Bergen. It is easy to reach by light rail or bus.",
    ],
  },
  billetter: {
    title: "Tickets and events",
    body: [
      "See what is happening at the house and find upcoming events under Events. Tickets are purchased directly on each event page.",
      "Events",
    ],
  },
  "7d0eec2032cc": {
    title: "The guardian arrangement",
    body: [
      "The guardian must be over 25 years old.",
      "The guardian must be family or someone close to the young person.",
      "There must be at least one guardian per minor.",
      "Applications must be submitted no later than one week before the event. We reserve the right to close applications when the maximum number of guardians has been reached.",
      "If your application is rejected, you are responsible for contacting the organiser about a ticket refund.",
      "Breaking the guardian arrangement leads to immediate removal.",
      "Submit an application here",
    ],
  },
  booking: {
    title: "Booking",
    body: [
      "Are you organising something at Kvarteret? Whether it is a party, meeting, concert or something entirely your own, we are happy to help you get started. Go to Booking to check available rooms and submit a request — we look forward to hearing from you!",
      "Booking",
    ],
  },
  gjenglemt: {
    title: "Lost and found",
    body: [
      "Have you lost something at Kvarteret? We keep everything we find at reception for three weeks. After that, we donate it to Fretex, while valuable items are handed to the police. Contact us or drop by, and we will help you look!",
    ],
  },
  servering: {
    title: "Food and drink",
    body: [
      "Stjernesalen, Kvarteret's café on the second floor, serves good meals and great coffee every weekday until 19:00.",
      "Need food for an event? Our kitchen creates tailored orders for small and large gatherings — see catering.",
      "Catering",
    ],
  },
}

const accessibility = {
  heading: "Accessibility",
  intro:
    "Studentersamfunnet should be a place everyone can use. Here you can find an overview of how our building is adapted and how to access the different floors.",
  items: {
    "tilgjengelighet-0": {
      title: "Lift and floors",
      body: [
        "The building has three floors and is mainly accessible by lift.",
        "The main lift runs between all floors",
        "The upper part of Tivoli can only be reached using the wheelchair lift. It is by the main entrance and serves one user at a time.",
        "The first and second floors can also be reached directly from outside the building.",
        "After 20:00, you need a lift card. You can borrow one at reception or call the operations manager on +47 406 26 601.",
      ],
    },
    "tilgjengelighet-1": {
      title: "Drop-off and pick-up",
      body: [
        "There are two places where users with reduced mobility can be dropped off:",
        "In the courtyard: Drive into the courtyard and use the entrance through Stjernesalen. Once inside, the lift is on your right just after you have driven through the venue.",
        "Håkonsgaten: We recommend stopping at the bottom of the steps to Johanneskirken. This lets you stop safely without blocking traffic. Use the entrance opposite Kinsarvik (the door below the neon sign) or around the corner at our main entrance (there is a ramp here).",
      ],
    },
    "tilgjengelighet-2": {
      title: "Accessible toilets",
      body: [
        "We have three accessible toilets:",
        "First floor: Outside the door to Teglverket",
        "Second floor: Outside reception",
        "Third floor: In the corridor by Halvtimen",
        "You can use the lift to reach all of them.",
      ],
    },
    "tilgjengelighet-3": {
      title: "Questions about accessibility?",
      body: [
        "Not all our entrances are open all the time. Most entrances open during the day are on the upper side of the building, which requires walking up a steep ramp.",
        "If you need ground-level access, call us and we will come and unlock the door. This is especially useful for people who cannot use the ramp or who need the shortest possible route inside.",
        "For help on arrival, call +47 406 26 601",
      ],
    },
  },
}

const sponsors: Record<string, { title: string; body: string[] }> = {
  "universitetet-i-bergen": {
    title: "University of Bergen",
    body: [
      "The University of Bergen, with 14,800 students and around 3,600 employees, is a medium-sized European university. Key parts of the campus are located in the city centre. The University of Bergen is both an educational institution and a research institution covering most academic fields, organised into six faculties and around 40 institutes and academic centres.",
      "The University of Bergen is also part of a global network of students, researchers and knowledge institutions.",
    ],
  },
  "bergen-kommune": {
    title: "Bergen municipality",
    body: [
      "Bergen is a city and municipality in Vestland and Norway's second-largest city, with 270,000 inhabitants. It is often considered the regional capital of Western Norway.",
    ],
  },
  "velferdstinget-vest": {
    title: "Velferdstinget Vest",
    body: [
      "Velferdstinget Vest brings together the student democracies of all educational institutions affiliated with Sammen, the student welfare organisation in Western Norway. It works on student-policy issues that are not institution-specific, including student housing, mental-health services, health centres, student sports and student culture.",
    ],
  },
  sammen: {
    title: "Sammen — Student Welfare Organisation of Western Norway",
    body: [
      "Sammen provides student welfare services for around 30,000 students in Western Norway. Its vision is: You should thrive as a student in Bergen.",
      "Together with educational institutions, Sammen works to develop the overall learning environment for students in Western Norway. By offering good welfare services and high-quality academic programmes, it works to make Bergen an attractive student city. Much of this cooperation takes place through Education in Bergen.",
    ],
  },
  kulturrom: {
    title: "Kulturrom",
    body: [
      "Kulturrom helps provide rehearsal spaces and good technical conditions for music, dance and theatre performances across Norway.",
    ],
  },
}

function localized(field: string, value: unknown): LocalizedItem[] {
  return [{ _key: `en-${field}`, language: "en", value }]
}

function portableText(blocks: Block[] | null | undefined, texts: string[]) {
  if (!blocks) return undefined
  return blocks.map((block, index) => ({
    ...block,
    children: block.children?.map(child => ({
      ...child,
      text: texts[index] ?? child.text,
    })),
  }))
}

export function buildEditorialLocalePatch(document: {
  _type: string
  sections?: Array<Record<string, unknown>>
  sponsors?: Array<Record<string, unknown>>
}) {
  const patch: Record<string, unknown> = {}
  const sectionMap =
    document._type === "roomsPage" ? roomsSections : usefulSections

  for (const section of document.sections ?? []) {
    const key = String(section._key ?? "")
    const translation = sectionMap[key]
    if (translation) {
      patch[`sections[_key == "${key}"].localizedTitle`] = localized(
        "localizedTitle",
        translation.title,
      )
      const body = portableText(
        section.body as Block[] | undefined,
        translation.body ?? [],
      )
      if (body) {
        patch[`sections[_key == "${key}"].localizedBody`] = localized(
          "localizedBody",
          body,
        )
      }
    }

    if (section._type === "infoAddressBlock" && translation) {
      patch[`sections[_key == "${key}"].localizedHeading`] = localized(
        "localizedHeading",
        translation.title,
      )
    }

    if (key === "tilgjengelighet") {
      patch[`sections[_key == "${key}"].localizedHeading`] = localized(
        "localizedHeading",
        accessibility.heading,
      )
      patch[`sections[_key == "${key}"].localizedIntro`] = localized(
        "localizedIntro",
        accessibility.intro,
      )
      for (const item of (section.items as
        | Array<Record<string, unknown>>
        | undefined) ?? []) {
        const itemTranslation =
          accessibility.items[
            String(item._key) as keyof typeof accessibility.items
          ]
        if (!itemTranslation) continue
        patch[
          `sections[_key == "${key}"].items[_key == "${item._key}"].localizedTitle`
        ] = localized("localizedTitle", itemTranslation.title)
        const body = portableText(
          item.body as Block[] | undefined,
          itemTranslation.body,
        )
        if (body)
          patch[
            `sections[_key == "${key}"].items[_key == "${item._key}"].localizedBody`
          ] = localized("localizedBody", body)
      }
    }
  }

  for (const sponsor of document.sponsors ?? []) {
    const translation = sponsors[String(sponsor._key ?? "")]
    if (!translation) continue
    patch[`sponsors[_key == "${sponsor._key}"].localizedTitle`] = localized(
      "localizedTitle",
      translation.title,
    )
    const body = portableText(
      sponsor.description as Block[] | undefined,
      translation.body,
    )
    if (body)
      patch[`sponsors[_key == "${sponsor._key}"].localizedDescription`] =
        localized("localizedDescription", body)
  }

  return patch
}
