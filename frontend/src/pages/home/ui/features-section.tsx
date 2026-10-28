import {
  FileText,
  FolderTree,
  KanbanSquare,
  MessageSquare,
  MousePointer2,
  PenTool,
  type LucideIcon,
} from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
  tint: string
  wide?: boolean
  full?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: 'Documents you can style down to the letter',
    text: 'Fonts, sizes, colors, highlights, letter spacing, tables, task lists, slash commands and more. Make every page look exactly how you want.',
    tint: 'from-sky-500/15 text-sky-600 dark:text-sky-400',
    wide: true,
  },
  {
    icon: PenTool,
    title: 'Infinite canvas',
    text: 'Sketch, diagram and brainstorm with shapes, arrows, text, images and freehand drawing.',
    tint: 'from-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    icon: KanbanSquare,
    title: 'Task boards',
    text: 'Custom columns, colored labels, due dates and drag-and-drop cards that move live.',
    tint: 'from-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    icon: MessageSquare,
    title: 'Comments everywhere',
    text: 'Start a thread on any text, shape or card. Resolve it when the work is done.',
    tint: 'from-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: MousePointer2,
    title: 'Live presence',
    text: 'See who is here, where their cursor is and what they are editing - instantly.',
    tint: 'from-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  {
    icon: FolderTree,
    title: 'Organized your way',
    text: 'Spaces, projects and unlimited nested pages in a drag-and-drop sidebar, plus quick search.',
    tint: 'from-rose-500/15 text-rose-600 dark:text-rose-400',
    full: true,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-accent">Everything in one place</p>
        <h2 className="font-display mt-2 text-4xl font-bold sm:text-5xl">Three tools. One calm workspace.</h2>
        <p className="mt-4 text-lg text-muted">
          Stop jumping between apps. Write the plan, sketch the idea and track the work side by side.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, tint, wide, full }) => (
          <article
            key={title}
            className={`group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              wide ? 'lg:col-span-2' : full ? 'sm:col-span-2 lg:col-span-3' : ''
            }`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tint} to-transparent to-60% opacity-60`} />
            <div className="relative">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border ${tint.split(' ').slice(1).join(' ')}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
