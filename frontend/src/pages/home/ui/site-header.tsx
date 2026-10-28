import { buttonVariants } from '@heroui/react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/shared/ui/theme-toggle'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-current/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-lg font-semibold tracking-tight">Arda</span>

        <nav className="hidden items-center gap-6 text-sm opacity-80 md:flex" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:opacity-100">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden text-sm font-medium sm:inline">
            Sign in
          </Link>
          <Link to="/register" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
