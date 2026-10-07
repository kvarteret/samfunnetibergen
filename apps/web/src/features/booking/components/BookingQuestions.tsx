"use client"

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
    <section className="max-w-4xl space-y-5">
      <div className="paper-prose prose prose-neutral dark:prose-invert">
        <ReactMarkdown>
          {questions.length ? parsed.intro : content}
        </ReactMarkdown>
      </div>
      {categories.map((category, index) => (
        <div key={category ?? index} className="space-y-3">
          {category && <h3 className="font-heading text-xl">{category}</h3>}
          <Accordion>
            {questions
              .filter(item => item.category === category)
              .map(item => (
                <AccordionItem key={item._key} value={item._key}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionPanel>
                    <div className="paper-prose prose prose-neutral dark:prose-invert">
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      ))}
    </section>
  )
}
