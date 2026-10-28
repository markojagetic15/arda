const STEPS = [
  {
    step: '01',
    title: 'Create a space',
    description: 'Spin up a space for your team, then add projects underneath it.',
  },
  {
    step: '02',
    title: 'Every project ships ready to go',
    description: 'New projects start with a document, a canvas, and a Kanban board already in place.',
  },
  {
    step: '03',
    title: 'Invite your team and go live',
    description: 'Share the workspace — edits, drawings, and card moves sync in real time as people join.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-current/10 bg-current/[0.02]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Up and running in minutes</h2>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map(({ step, title, description }) => (
            <li key={step} className="text-center sm:text-left">
              <span className="text-sm font-semibold tracking-wide opacity-50">{step}</span>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm opacity-70">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
