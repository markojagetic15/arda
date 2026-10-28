import { passwordStrength } from '@/shared/lib/password/strength'

const COLORS = ['', 'bg-danger', 'bg-warning', 'bg-accent', 'bg-success']

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (score === 0) return null

  return (
    <div className="flex items-center gap-3 pt-0.5" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${step <= score ? COLORS[score] : 'bg-default'}`}
          />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-muted">{label}</span>
    </div>
  )
}
