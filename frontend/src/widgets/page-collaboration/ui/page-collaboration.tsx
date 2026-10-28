import { Spinner } from '@heroui/react'
import { useEffect } from 'react'

import { useCollaboration, type AwarenessUser } from '@/shared/lib/collaboration'

import { LiveCursorCanvas } from './live-cursor-canvas'
import { PresenceAvatars } from './presence-avatars'
import { StatusBadge } from './status-badge'

interface PageCollaborationProps {
  pageId: string
  user: AwarenessUser
}

export function PageCollaboration({ pageId, user }: PageCollaborationProps) {
  const { awareness, status, awarenessStates } = useCollaboration(pageId)

  useEffect(() => {
    if (!awareness) return
    awareness.setLocalStateField('user', user)
    return () => {
      awareness.setLocalStateField('user', null)
    }
  }, [awareness, user])

  if (!awareness) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="sm" />
      </div>
    )
  }

  const remoteUsers = [...awarenessStates.entries()]
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([, state]) => state.user as AwarenessUser | undefined)
    .filter((candidate): candidate is AwarenessUser => Boolean(candidate))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <StatusBadge status={status} />
        <PresenceAvatars users={remoteUsers} />
      </div>
      <LiveCursorCanvas awareness={awareness} awarenessStates={awarenessStates} localClientId={awareness.clientID} />
    </div>
  )
}
