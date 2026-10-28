import { Button } from '@heroui/react'
import { Link, useNavigate } from 'react-router-dom'

import { Logo } from '@/shared/ui/logo'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteHeader() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="proarda home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-default hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link to="/login" className="hidden px-2 text-sm font-medium hover:text-accent sm:block">
            Sign in
          </Link>
          <Button size="sm" className="font-semibold" onPress={() => navigate('/register')}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  )
}
