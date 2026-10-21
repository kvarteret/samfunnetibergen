/** Icon names editors can pick for a FAQ item; the web app maps each to a lucide icon. */
export const FAQ_ICONS = [
  { name: "age", title: "Aldersgrense" },
  { name: "room", title: "Rom og møbler" },
  { name: "bar", title: "Bar og drikke" },
  { name: "equipment", title: "Teknisk utstyr" },
  { name: "safety", title: "HMS og sikkerhet" },
  { name: "ticket", title: "Billetter" },
  { name: "cleaning", title: "Rydding" },
  { name: "clock", title: "Tid" },
  { name: "money", title: "Pris og betaling" },
  { name: "contact", title: "Kontakt" },
  { name: "info", title: "Informasjon" },
] as const

export type FaqIconName = (typeof FAQ_ICONS)[number]["name"]
