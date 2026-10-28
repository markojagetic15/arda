import { UserAvatar } from '@/entities/user'

import type { PeerPresence } from '../model/use-presence-users'

const MAX_SHOWN = 4

interface PresenceAvatarsProps {
  users: PeerPresence[]
  /** When set, clicking an avatar jumps to that person's cursor. */
  onSelect?: (user: PeerPresence) => void
}

/** Avatar stack of the other people on this page, in their cursor colors. */
export function PresenceAvatars({ users, onSelect }: PresenceAvatarsProps) {
  if (users.length === 0) return null

  const shown = users.slice(0, MAX_SHOWN)
  const extra = users.length - shown.length

  return (
    <div className="flex items-center -space-x-1.5" aria-label={`${users.length} other people here`}>
      {shown.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect?.(user)}
          disabled={!onSelect}
          title={onSelect ? `${user.name} - click to jump to their cursor` : user.name}
          className="rounded-full ring-2 ring-background transition-transform hover:z-10 hover:scale-110 disabled:hover:scale-100"
          style={{ boxShadow: `0 0 0 2px ${user.color}` }}
        >
          <UserAvatar name={user.name} color={user.color} />
        </button>
      ))}
      {extra > 0 ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-default text-[11px] font-semibold ring-2 ring-background">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}
