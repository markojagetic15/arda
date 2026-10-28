import type { ConnectionStatus } from '@/shared/lib/collaboration'

const STATUS: Record<ConnectionStatus, { dot: string; label: string; title: string }> = {
  connected: { dot: 'bg-success', label: 'Live', title: 'Changes sync instantly' },
  connecting: { dot: 'bg-warning animate-pulse', label: 'Connecting', title: 'Connecting to the server' },
  disconnected: {
    dot: 'bg-danger',
    label: 'Offline',
    title: 'Changes are kept and will sync when the connection is back',
  },
}

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const { dot, label, title } = STATUS[status]
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
