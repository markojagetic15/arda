import { Avatar, AvatarGroup } from '@heroui/react'

import type { AwarenessUser } from '@/shared/lib/collaboration'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? [parts[0][0], parts.at(-1)![0]] : [parts[0]?.[0] ?? '?']
  return letters.join('').toUpperCase()
}

export function PresenceAvatars({ users }: { users: AwarenessUser[] }) {
  if (users.length === 0) {
    return <p className="text-sm opacity-60">Only you are here right now.</p>
  }

  return (
    <AvatarGroup max={6} size="sm">
      {users.map((user) => (
        <Avatar key={user.id} title={user.name}>
          <Avatar.Fallback style={{ backgroundColor: user.color, color: 'white' }}>
            {initials(user.name)}
          </Avatar.Fallback>
        </Avatar>
      ))}
    </AvatarGroup>
  )
}
