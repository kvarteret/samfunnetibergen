import type { GroupDocument, LocalizedItem } from "./groupLocales"

type EnglishGroupContent = {
  name: string
  summary: string
  description: string
}

export const initialEnglishGroupContent: Record<string, EnglishGroupContent> = {
  "10886aed-6785-4c27-ad68-92c1368482c7": {
    name: "Immaturus",
    summary:
      "Immaturus is an amateur theatre company with professional-level ambition and organisation. It is Norway's largest student theatre and Bergen's only student organisation dedicated to theatre and the performing arts.",
    description:
      "Immaturus is a place for students who want to work with theatre and the performing arts. The organisation combines an ambitious artistic environment with a strong social community and opportunities to contribute both on stage and behind the scenes.",
  },
  "455c64b8-a783-480c-ac88-a55471615d59": {
    name: "Blandede Akademikere",
    summary:
      "BLAK — the student choir Blandede Akademikere — is UiB's official mixed choir. It brings together students from all higher-education institutions in Bergen and is one of Kvarteret's user organisations.",
    description:
      "Blandede Akademikere is a mixed student choir for singers from across Bergen's higher-education institutions. The choir combines music, community and student life, and is part of the user-organisation community at Kvarteret.",
  },
  "490893e2-2b20-4468-92e1-6051c412ab7c": {
    name: "Aktive Studenters Forening",
    summary:
      "Aktive Studenters Forening (ASF) is one of Bergen's largest student-run concert promoters, hosting concerts at Teglverket at Kvarteret almost every Friday. As one of Kvarteret's operating organisations, ASF also has its own volunteer community.",
    description:
      "ASF creates live music experiences for Bergen's student community. Volunteers help organise concerts, welcome audiences and run the organisation, with regular events at Teglverket and a strong community around them.",
  },
  "7da03740-5ac6-47b7-a61b-92746a312a45": {
    name: "Arme Riddere",
    summary:
      "The men's choir Arme Riddere (MAR) is the official men's choir at the University of Bergen and one of Kvarteret's user organisations.",
    description:
      "Arme Riddere is the official men's choir of the University of Bergen. The choir brings together singers, performances and social activities as one of Kvarteret's user organisations.",
  },
  "aa0dda4a-a69e-44b7-9a33-3c5e60799d66": {
    name: "HF-revyen",
    summary:
      "Would you like to help put on the 2025 HF revue? Come and join us for an open rehearsal!",
    description:
      "HF-revyen is a student revue made by people who want to create a show together. Join an open rehearsal to find out how you can contribute on stage, backstage or in the production team.",
  },
  "b2b88b35-fde3-491a-a3ab-45f015c9a127": {
    name: "Bergen Realistforening",
    summary:
      "Bergen Realistforening (RF) is one of the city's largest student-run concert promoters, hosting concerts and other great events at Teglverket at Kvarteret almost every Thursday. As one of Kvarteret's operating organisations, RF also has its own volunteer community.",
    description:
      "Bergen Realistforening brings concerts and other events to Teglverket for Bergen's students. The organisation is run by volunteers who work with event production, audience experiences and the community around live music.",
  },
  "fcc20920-afac-45fc-a793-cf0ac2d8b61a": {
    name: "Sirenene",
    summary:
      "Sirenene is the official women's choir at the University of Bergen and one of Kvarteret's user organisations.",
    description:
      "Sirenene is the official women's choir of the University of Bergen. The choir combines singing, performances and a welcoming social community as one of Kvarteret's user organisations.",
  },
  "studentGroup-aktuelt": {
    name: "Current Affairs",
    summary:
      "Current Affairs hosts morning meetings with panel discussions about topics shaping the news right now, always with breakfast and coffee.",
    description:
      "Current Affairs creates accessible morning events where guests and audiences discuss issues in the news. Come for a panel discussion, breakfast and coffee — and help shape the conversation.",
  },
  "studentGroup-debattkomiteen": {
    name: "Debate",
    summary:
      "The Debate Committee organises debates most Thursdays. Topics range from politics to popular culture, but every event starts with a clearly defined disagreement.",
    description:
      "The Debate Committee brings people together for thoughtful, lively discussions. Volunteers help develop topics, invite participants and create events where disagreement becomes the starting point for conversation.",
  },
  "studentGroup-e-tjenesten": {
    name: "IT Team",
    summary:
      "The IT Team is Studentersamfunnet's technology group. It runs and develops the organisation's websites and internal databases.",
    description:
      "The IT Team keeps Studentersamfunnet's digital services running and builds new tools when the organisation needs them. The group works with websites, internal databases and other technology behind the scenes.",
  },
  "studentGroup-festkomiteen": {
    name: "Events",
    summary:
      "The Events Committee organises larger parties at the house, with full-house events as its main focus.",
    description:
      "The Events Committee creates some of the biggest parties at Kvarteret. Volunteers work with planning, production, hosting and the many details that make a full-house event happen.",
  },
  "studentGroup-finansdepartementet": {
    name: "Finance Department",
    summary:
      "The Finance Department manages Studentersamfunnet's finances. Accounting, reimbursements, travel bookings and grant applications are among its key responsibilities.",
    description:
      "The Finance Department supports the organisation with the practical work behind its finances. The group handles accounting, reimbursements, travel bookings and applications, helping the rest of Studentersamfunnet run responsibly.",
  },
  "studentGroup-grondahls": {
    name: "Grøndahls",
    summary:
      "Grøndahls is the pub with pace, variety and plenty of volunteer life after the shift.",
    description:
      "Grøndahls is a lively pub where volunteers work together to create a good atmosphere and serve a varied selection. The community continues after the shift, making it a social place to get involved.",
  },
  "studentGroup-halvtimen": {
    name: "Halvtimen",
    summary:
      "Halvtimen is a cocktail bar for people over 20 who want to explore cocktails in more depth.",
    description:
      "Halvtimen is a cocktail bar for guests over 20. Volunteers get to explore cocktail service, ingredients and hospitality in a relaxed environment with a keen interest in good drinks.",
  },
  "studentGroup-hello": {
    name: "HELLO",
    summary:
      "HELLO creates a social and inclusive community for new students, exchange students and young immigrants.",
    description:
      "HELLO helps new students, exchange students and young immigrants find community in Bergen. The group creates inclusive social activities where people can meet others and feel at home.",
  },
  "studentGroup-kokkegruppen": {
    name: "Kitchen Team",
    summary:
      "The Kitchen Team is for people who want to cook for the house and provide catering for events and concerts.",
    description:
      "The Kitchen Team prepares food for Kvarteret and provides catering for events and concerts. It is a practical, creative group for volunteers who enjoy cooking and working together behind the scenes.",
  },
  "studentGroup-kraftetaten": {
    name: "Technical Production",
    summary:
      "Technical Production (Kraft) handles sound and lighting at Studentersamfunnet. The group runs technical production for concerts, theatre, debates and other events, working with professional-level equipment.",
    description:
      "Kraft works with sound, lighting and technical production across Kvarteret's programme. Volunteers support concerts, theatre, debates and other events while learning to use professional-level equipment.",
  },
  "studentGroup-kultur": {
    name: "Culture",
    summary:
      "Culture organises talks, workshops and screenings about literature, art, religion and trends in popular culture.",
    description:
      "The Culture group creates events that explore ideas and creative work. Its programme can include talks, workshops and screenings about literature, art, religion and cultural trends.",
  },
  "studentGroup-pr-komiteen": {
    name: "Communications Department",
    summary:
      "The Communications Department (PR) markets Kvarteret and makes sure students see what is happening at the house.",
    description:
      "The Communications Department helps Kvarteret reach students. Volunteers work with marketing, content and communication to make the house, its events and its opportunities visible across Bergen's student community.",
  },
  "studentGroup-rettsvesenet": {
    name: "Legal Team",
    summary:
      "The Legal Team is Studentersamfunnet's legal working group. It helps with legal questions including contracts for purchases, investments, bookings and employment.",
    description:
      "The Legal Team supports Studentersamfunnet with legal questions and agreements. Its work can cover purchases, investments, bookings, employment contracts and other situations where the organisation needs legal insight.",
  },
  "studentGroup-romvesenet": {
    name: "Set & Build Team",
    summary:
      "The Set & Build Team is made up of volunteers who build, repair, paint and do carpentry — in short, the people who leave their mark on the house.",
    description:
      "The Set & Build Team gives Kvarteret its physical character. Volunteers build, repair, paint and make things for the house, working practically and creatively on projects behind the scenes.",
  },
  "studentGroup-samklang": {
    name: "Samklang",
    summary:
      "Samklang organises concerts outside the usual frame and seeks out the gems that the average student might otherwise miss.",
    description:
      "Samklang looks for distinctive artists and concerts beyond the mainstream. Volunteers help find, book and present music that students may not encounter elsewhere.",
  },
  "studentGroup-skjenkegruppen": {
    name: "Café & Bar Team",
    summary:
      "The Café & Bar Team is Kvarteret's team of cooks, servers and bartenders. It runs the house's regular bars and kitchen.",
    description:
      "The Café & Bar Team keeps Kvarteret's regular bars and kitchen running. Volunteers learn and work across cooking, serving and bartending while helping create the atmosphere guests come for.",
  },
  "studentGroup-sosialdepartementet": {
    name: "Social Department",
    summary:
      "The Social Department helps create a good environment for all volunteers.",
    description:
      "The Social Department works to make volunteering at Studentersamfunnet welcoming and enjoyable. It helps build community and supports a positive environment for everyone who contributes.",
  },
  "studentGroup-stjernesalen": {
    name: "Stjernesalen",
    summary:
      "Stjernesalen is a good fit for people who want to work with café service, coffee, mocktails and wine.",
    description:
      "Stjernesalen is a café and bar environment for volunteers interested in service, coffee, mocktails and wine. The team works together to give guests a warm and memorable experience.",
  },
  "studentGroup-upop": {
    name: "Upop",
    summary:
      "Upop is Studentersamfunnet's science committee. It hosts events about very niche but fascinating subjects — unpopular science in a pop-science format.",
    description:
      "Upop turns unusual research and niche subjects into accessible events. The group looks for fascinating science that many people do not know exists, then presents it in an engaging pop-science format.",
  },
  "studentGroup-vaktetaten": {
    name: "Security Team",
    summary:
      "The Security Team provides Kvarteret's stewards and security volunteers. Its main responsibility is the safety and wellbeing of volunteers and guests.",
    description:
      "The Security Team helps keep Kvarteret safe and welcoming. Volunteers work with stewarding, safety and guest care so that everyone at the house can enjoy events and volunteering with confidence.",
  },
  "0b2efc42-cb05-4f82-8ec4-01d257b14081": {
    name: "Disco Department",
    summary:
      "The Disco Department is part of Kvarteret's production department, where you can gain DJ experience and contribute to the club and concert programme.",
    description:
      "The Disco Department creates club nights and supports concerts at Kvarteret. Volunteers get hands-on DJ experience and help shape the music programme.",
  },
  "studentGroup-quiz-gruppen": {
    name: "Quiz Team",
    summary: "The Quiz Team organises quizzes in Stjernesalen at the house.",
    description:
      "Every Tuesday at 19:00, the Quiz Team hosts a quiz in Stjernesalen at the house. This group is for anyone with lots of fun facts up their sleeve!",
  },
}

const initialEnglishGroupsPageContent = {
  eyebrow: "Groups at the house",
  title: "Meet the groups",
  description:
    "Meet Studentersamfunnet's working groups, committees and partner organisations — the people who fill the house with events, food and drink, safety, technology and a strong volunteer community!",
  sections: {
    arbeidsgrupper: {
      title: "Working groups and volunteering",
      body: [
        "Working groups keep the house running day to day. You will find everything from bars, kitchen, security and technical production to IT, marketing, production and people-focused work.",
        "Some groups recruit brand-new volunteers, while others are a better fit once you already have experience at the house. Browse the group pages to find out where you would like to start.",
      ],
    },
    samarbeidspartnere: {
      title: "Committees and partners",
      body: [
        "Alongside Kvarteret's own working groups, the house is home to committees, operating organisations and user organisations that arrange concerts, debates, theatre, film, quizzes and other student-cultural activities.",
      ],
    },
  },
  faq: {
    "groups-faq-1": {
      question: "What does it take to join Studentersamfunnet?",
      answer:
        "You need to be a student or connected to the student community in Bergen. Most importantly, you should want to contribute and be part of the community.",
    },
    "groups-faq-2": {
      question: "How much time does volunteering at Studentersamfunnet take?",
      answer:
        "It varies between groups, but most have one regular committee meeting each week in addition to events or shifts.",
    },
    "groups-faq-3": {
      question: "Can I volunteer for just one semester?",
      answer:
        "Yes. You can volunteer for one semester, although many people stay longer because the community is social and the work develops over time.",
    },
    "groups-faq-4": {
      question: "What do I get from volunteering at Studentersamfunnet?",
      answer:
        "As a volunteer, you get experience, training, a social community and the chance to take part in internal events.",
    },
    "groups-faq-5": {
      question: "How much does it cost to volunteer at Studentersamfunnet?",
      answer: "Volunteering at Studentersamfunnet is free.",
    },
  },
}

function appendEnglish<T>(
  current: LocalizedItem<T>[] | undefined,
  field: string,
  value: T,
) {
  if (current?.some(item => item.language === "en")) return undefined
  return [...(current ?? []), { _key: `en-${field}`, language: "en", value }]
}

function portableText(value: string) {
  return [
    {
      _key: "en-description",
      _type: "block",
      children: [
        { _key: "en-description-span", _type: "span", marks: [], text: value },
      ],
      markDefs: [],
      style: "normal",
    },
  ]
}

export function buildInitialEnglishGroupPatch(document: GroupDocument) {
  if (document._type === "studentGroup") {
    const content = initialEnglishGroupContent[document._id]
    if (!content) return {}
    const patch: Record<string, unknown> = {}
    const name = appendEnglish(
      document.localizedName,
      "localizedName",
      content.name,
    )
    const summary = appendEnglish(
      document.localizedSummary,
      "localizedSummary",
      content.summary,
    )
    const body = appendEnglish(
      document.localizedBody,
      "localizedBody",
      portableText(content.description),
    )
    if (name) patch.localizedName = name
    if (summary) patch.localizedSummary = summary
    if (body) patch.localizedBody = body
    return patch
  }

  const patch: Record<string, unknown> = {}
  const eyebrow = appendEnglish(
    document.localizedEyebrow,
    "localizedEyebrow",
    initialEnglishGroupsPageContent.eyebrow,
  )
  const title = appendEnglish(
    document.localizedTitle,
    "localizedTitle",
    initialEnglishGroupsPageContent.title,
  )
  const description = appendEnglish(
    document.localizedDescription,
    "localizedDescription",
    initialEnglishGroupsPageContent.description,
  )
  if (eyebrow) patch.localizedEyebrow = eyebrow
  if (title) patch.localizedTitle = title
  if (description) patch.localizedDescription = description

  for (const section of document.sections ?? []) {
    const content =
      initialEnglishGroupsPageContent.sections[
        section._key as keyof typeof initialEnglishGroupsPageContent.sections
      ]
    if (!content) continue

    const title = appendEnglish(
      section.localizedTitle,
      "localizedTitle",
      content.title,
    )
    const body = appendEnglish(
      section.localizedBody,
      "localizedBody",
      content.body.flatMap(paragraph => portableText(paragraph)),
    )
    if (title) {
      patch[`sections[_key == "${section._key}"].localizedTitle`] = title
    }
    if (body) {
      patch[`sections[_key == "${section._key}"].localizedBody`] = body
    }
  }

  for (const item of document.faq ?? []) {
    const content =
      initialEnglishGroupsPageContent.faq[
        item._key as keyof typeof initialEnglishGroupsPageContent.faq
      ]
    if (!content) continue

    const question = appendEnglish(
      item.localizedQuestion,
      "localizedQuestion",
      content.question,
    )
    const answer = appendEnglish(
      item.localizedAnswer,
      "localizedAnswer",
      content.answer,
    )
    if (question) {
      patch[`faq[_key == "${item._key}"].localizedQuestion`] = question
    }
    if (answer) {
      patch[`faq[_key == "${item._key}"].localizedAnswer`] = answer
    }
  }

  return patch
}
