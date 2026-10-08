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
          <div key={category ?? index} className="space-y-4">
            {category && (
              <h2 className="font-heading text-sm uppercase tracking-widest text-foreground-muted">
                {category}
              </h2>
            )}
            <Accordion
              className="gap-3 border-t-0"
              defaultValue={categoryQuestions.map(item => item._key)}
              multiple
            >
              {categoryQuestions.map(item => (
                <AccordionItem
                  key={item._key}
                  className="border border-border bg-background px-5 sm:px-6"
                  value={item._key}
                >
                  <AccordionTrigger className="py-5 text-lg leading-6 sm:text-xl">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionPanel>
                    <div className="paper-prose prose prose-neutral max-w-none text-foreground-muted prose-p:leading-7 dark:prose-invert">
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )
      })}
    </section>
  )
}
