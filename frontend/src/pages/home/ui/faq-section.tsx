import { Accordion } from '@heroui/react'

const FAQS = [
  {
    id: 'accounts',
    question: 'Do I need to install anything?',
    answer: 'No — Arda runs entirely in your browser. Create an account and start collaborating right away.',
  },
  {
    id: 'realtime',
    question: 'How does real-time sync work?',
    answer:
      'Every document, canvas, and board is backed by a CRDT (Yjs) over a WebSocket connection, so edits from every connected user merge automatically without conflicts.',
  },
  {
    id: 'offline',
    question: 'What happens if my connection drops?',
    answer:
      'Your local changes keep working — the page reconnects automatically and re-syncs the moment your connection comes back.',
  },
  {
    id: 'comments',
    question: 'Can I leave feedback without editing?',
    answer:
      'Yes — select any text, canvas shape, or task card and start a comment thread. Everyone watching the page sees it appear live.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>

      <Accordion className="mt-10" defaultExpandedKeys={['realtime']}>
        {FAQS.map(({ id, question, answer }) => (
          <Accordion.Item key={id} id={id}>
            <Accordion.Heading>
              <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left text-base font-medium">
                {question}
                <Accordion.Indicator className="h-4 w-4 shrink-0 opacity-60" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="pb-4 text-sm opacity-70">{answer}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  )
}
