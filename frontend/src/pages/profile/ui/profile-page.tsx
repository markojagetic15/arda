import { ArrowLeft, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/entities/session'
import { UserAvatar } from '@/entities/user'
import { useLogout } from '@/features/auth/logout'
import { ChangePasswordForm } from '@/features/profile/change-password'
import { UpdateProfileForm } from '@/features/profile/update-profile'
import { Logo } from '@/shared/ui/logo'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-10 last:border-b-0 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="max-w-md">{children}</div>
    </section>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to workspace
          </Link>
          <Logo markClassName="h-6 w-6" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex items-center gap-5 animate-rise">
          <UserAvatar name={user.name} id={user.id} size="lg" className="text-xl" />
          <div>
            <h1 className="font-display text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">
              {user.email} · Member since {memberSince}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Section title="Profile" description="How you appear to people you work with.">
            <UpdateProfileForm user={user} />
          </Section>
          <Section title="Password" description="Changing it signs you out on every other device.">
            <ChangePasswordForm />
          </Section>
          <Section title="Appearance" description="Choose light, dark, or follow your system.">
            <ThemeToggle />
          </Section>
          <Section title="Session" description="Sign out of proarda on this device.">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </Section>
        </div>
      </main>
    </div>
  )
}
