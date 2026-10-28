import { Button } from '@heroui/react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CtaSection() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="brand-gradient relative overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Bring your team into one workspace</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Create your first space in under a minute. It's free.
          </p>
          <Button
            size="lg"
            className="mt-9 h-12 bg-white px-7 font-semibold text-[oklch(0.45_0.2_276)] hover:bg-white/90"
            onPress={() => navigate('/register')}
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
