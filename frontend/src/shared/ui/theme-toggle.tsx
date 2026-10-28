import { Laptop, Moon, Sun, type LucideIcon } from 'lucide-react'

import { useTheme, type ThemePreference } from '@/shared/lib/theme'

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Laptop },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 ${className}`}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={label}
            onClick={() => setPreference(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              selected ? 'bg-accent-soft text-accent' : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
