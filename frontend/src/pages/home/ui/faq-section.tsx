import { Accordion } from '@heroui/react'

const FAQS = [
  {
    id: 'install',
    question: 'Do I need to install anything?',
    answer: 'No. proarda runs in your browser. Create an account and start working right away.',
  },
  {
    id: 'realtime',
    question: 'How does real-time editing work?',
    answer:
      'Every document, canvas and board syncs live. Edits from everyone merge automatically, so there are no conflicts and no "who has the latest version" moments.',
  },
  {
    id: 'offline',
    question: 'What happens if my connection drops?',
    answer:
      'You can keep working. proarda reconnects automatically and syncs your changes the moment you are back online.',
  },
  {
    id: 'style',
    question: 'How much can I customize my documents?',
    answer:
      'A lot: font family, size, weight, color, highlight, letter spacing, line height, alignment, headings, lists, task lists, tables, quotes, code blocks, links and images - down to a single letter.',
  },
  {
    id: 'price',
    question: 'Is it free?',
    answer: 'Yes. proarda is free to use while we grow.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="text-center">
        <p className="text-sm font-semibold text-accent">FAQ</p>
        <h2 className="font-display mt-2 text-4xl font-bold sm:text-5xl">Questions, answered</h2>
      </div>

      <Accordion className="mt-12 rounded-3xl border border-border bg-surface px-2" defaultExpandedKeys={['realtime']}>
        {FAQS.map(({ id, question, answer }) => (
          <Accordion.Item key={id} id={id}>
            <Accordion.Heading>
              <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-5 text-left text-base font-semibold">
                {question}
                <Accordion.Indicator className="h-4 w-4 shrink-0 text-muted" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-4 pb-5 text-sm leading-relaxed text-muted">{answer}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  )
}
