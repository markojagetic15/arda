import { buttonVariants } from '@heroui/react'
import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-24 sm:pb-20">
      <span className="inline-flex items-center rounded-full border border-current/10 px-3 py-1 text-xs font-medium tracking-wide uppercase opacity-70">
        Docs · Canvas · Kanban — one live workspace
      </span>

      <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
        Where your team writes, draws, and plans — together, in real time.
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-base opacity-70 sm:text-lg">
        Arda combines a Notion-style editor, a Miro-style infinite canvas, and a Trello-style board into a single
        workspace, with every keystroke, shape, and card synced live across everyone in the room.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          Get started for free
        </Link>
        <a href="#features" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          See how it works
        </a>
      </div>
    </section>
  )
}
