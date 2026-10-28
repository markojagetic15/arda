import type { ConnectionStatus } from '@/shared/lib/collaboration'

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; label: string }> = {
  connected: { dot: 'bg-green-500', label: 'Live' },
  connecting: { dot: 'bg-yellow-500', label: 'Connecting…' },
  disconnected: { dot: 'bg-red-500', label: 'Disconnected' },
}

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const { dot, label } = STATUS_STYLES[status]
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
