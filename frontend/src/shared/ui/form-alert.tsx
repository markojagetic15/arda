import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function FormAlert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children: ReactNode }) {
  const Icon = tone === 'danger' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm animate-fade-in ${
        tone === 'danger' ? 'bg-danger-soft text-danger-soft-foreground' : 'bg-success-soft text-success-soft-foreground'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
