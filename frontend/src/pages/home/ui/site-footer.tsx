import { Link } from 'react-router-dom'

import { Logo } from '@/shared/ui/logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:px-6">
        <Logo className="text-foreground" markClassName="h-6 w-6" />
        <nav className="flex gap-6" aria-label="Footer">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link to="/login" className="hover:text-foreground">Sign in</Link>
        </nav>
        <p>© {new Date().getFullYear()} proarda</p>
      </div>
    </footer>
  )
}
