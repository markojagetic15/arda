const STEPS = [
  {
    title: 'Create a space',
    text: 'Make a home for your team, a client or a side project.',
  },
  {
    title: 'Start a project',
    text: 'Every project comes with a document, a canvas and a task board, ready to go.',
  },
  {
    title: 'Work together, live',
    text: 'Edit at the same time, leave comments and watch progress happen in real time.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-surface-secondary/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="font-display mt-2 text-4xl font-bold sm:text-5xl">Up and running in minutes</h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ title, text }, index) => (
            <li key={title} className="relative rounded-3xl border border-border bg-surface p-7">
              <span className="brand-gradient font-display flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md">
                {index + 1}
              </span>
              <h3 className="font-display mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
