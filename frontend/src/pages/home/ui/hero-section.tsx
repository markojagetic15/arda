import { Button } from '@heroui/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppMockup } from './app-mockup'

export function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1 text-xs font-medium text-muted shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Docs, whiteboards and boards - one live workspace
          </span>
          <h1 className="font-display mt-6 text-5xl leading-[1.05] font-extrabold sm:text-6xl lg:text-7xl">
            Where great work <span className="text-gradient">comes together.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            proarda brings beautiful documents, an infinite canvas and flexible task boards into one place. Your
            whole team edits together, live, without the chaos of five different tools.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-6 font-semibold" onPress={() => navigate('/register')}>
              Start for free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" className="h-12 px-6 font-semibold" onPress={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">Free forever for individuals and small teams.</p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl animate-rise [animation-delay:150ms]">
          <AppMockup />
        </div>
      </div>
    </section>
  )
}
