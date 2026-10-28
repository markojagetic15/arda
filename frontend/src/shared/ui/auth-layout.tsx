import { CheckCircle2, FileText, KanbanSquare, PenTool } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Logo, LogoMark } from './logo'
import { ThemeToggle } from './theme-toggle'

interface AuthLayoutProps {
  title: string
  description?: ReactNode
  footer?: ReactNode
}

const HIGHLIGHTS = [
  { icon: FileText, title: 'Rich documents', text: 'Style every letter - fonts, colors, highlights, tables, tasks.' },
  { icon: PenTool, title: 'Infinite canvas', text: 'Sketch, diagram and brainstorm on a shared whiteboard.' },
  { icon: KanbanSquare, title: 'Task boards', text: 'Plan work with labels, due dates and drag-and-drop cards.' },
]

function BrandPanel() {
  return (
    <aside className="brand-gradient relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-[44%]">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-sky-300/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative flex w-full flex-col justify-between p-12 text-white">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start">
          <span className="rounded-[11px] bg-white/15 p-1 ring-1 ring-white/25">
            <LogoMark className="h-8 w-8" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">proarda</span>
        </Link>

        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-[1.1] font-bold">
            One workspace for everything your team makes.
          </h2>
          <p className="mt-4 text-base text-white/75">
            Write, draw and plan together - every keystroke, shape and card synced live.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-sm text-white/70">
          <CheckCircle2 className="h-4 w-4" /> Free to use. No credit card, no installs.
        </p>
      </div>
    </aside>
  )
}

export function AuthLayout({ title, description, footer, children }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <main className="flex min-h-screen bg-background">
      <BrandPanel />

      <section className="relative flex flex-1 flex-col">
        <header className="flex items-center justify-between p-5 sm:p-6">
          <Link to="/" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-[400px] animate-rise">
            <h1 className="font-display text-3xl font-bold">{title}</h1>
            {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 text-center text-sm text-muted">{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  )
}
