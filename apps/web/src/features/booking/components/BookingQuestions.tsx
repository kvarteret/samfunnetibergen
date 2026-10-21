"use client"

import type { FaqIconName } from "@samfunnet/content-domain/faq-icons"
import {
  Armchair,
  Baby,
  Banknote,
  Beer,
  Clock,
  Info,
  type LucideIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wrench,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  type BookingQuestion,
  parseBookingQuestions,
} from "../domain/questions"

const ICONS: Record<FaqIconName, LucideIcon> = {
  age: Baby,
  room: Armchair,
  bar: Beer,
  equipment: Wrench,
  safety: ShieldCheck,
  ticket: Ticket,
  cleaning: Sparkles,
  clock: Clock,
  money: Banknote,
  contact: Mail,
  info: Info,
}

export function BookingQuestions({
  content,
  faq,
}: {
  content: string
  faq: BookingQuestion[]
}) {
  const parsed = parseBookingQuestions(content)
  const questions = faq.length ? faq : parsed.questions
  const categories = Array.from(new Set(questions.map(q => q.category)))
  return (
    <section className="w-full max-w-4xl space-y-10">
      <div className="paper-prose prose prose-neutral max-w-none dark:prose-invert">
        <ReactMarkdown>
          {questions.length ? parsed.intro : content}
        </ReactMarkdown>
      </div>
      {categories.map((category, index) => {
        const categoryQuestions = questions.filter(
          item => item.category === category,
        )
        return (
          <div key={category ?? index} className="space-y-6">
            {category && (
              <h2 className="font-heading text-3xl leading-tight text-foreground sm:text-4xl">
                {category}
              </h2>
            )}
            <Accordion
              className="border-t-0"
              defaultValue={categoryQuestions.map(item => item._key)}
              multiple
            >
              {categoryQuestions.map(item => {
                const Icon = item.icon
                  ? ICONS[item.icon as FaqIconName]
                  : undefined
                return (
                  <AccordionItem key={item._key} value={item._key}>
                    <AccordionTrigger className="py-5 text-lg leading-6 sm:text-xl">
                      <span className="flex items-center gap-4">
                        {Icon && (
                          <span className="flex size-10 shrink-0 items-center justify-center bg-primary">
                            <Icon
                              aria-hidden
                              className="size-5 text-primary-foreground"
                            />
                          </span>
                        )}
                        {item.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionPanel>
                      <div className="paper-prose prose prose-neutral max-w-none text-foreground-muted prose-p:leading-7 dark:prose-invert">
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        )
      })}
    </section>
  )
}
