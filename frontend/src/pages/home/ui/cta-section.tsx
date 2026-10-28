import { buttonVariants } from '@heroui/react'
import { Link } from 'react-router-dom'

export function CtaSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to bring your team into one workspace?</h2>
      <p className="mx-auto mt-3 max-w-xl text-base opacity-70">
        It's free to get started — create your first space in under a minute.
      </p>
      <div className="mt-7">
        <Link to="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
          Create your workspace
        </Link>
      </div>
    </section>
  )
}
