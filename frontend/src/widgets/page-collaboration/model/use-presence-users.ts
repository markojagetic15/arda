import { useEffect, useMemo } from 'react'
import type { Awareness } from 'y-protocols/awareness'

import { pickSessionColor, type AwarenessUser } from '@/shared/lib/collaboration'

export const PRESENCE_FIELD = 'presence'

export interface PeerPresence extends AwarenessUser {
  /** The other client's awareness id (one per open tab). */
  clientId: number
}

export interface LivePresence {
  /** This user as shown to others on this page, with the color resolved for this page. */
  me: AwarenessUser
  /** Every other open tab on the page, including the user's own other tabs. */
  peers: PeerPresence[]
  /** Other people on the page, one entry per person (for avatars). */
  people: PeerPresence[]
}

/**
 * Publishes the user's presence on this page and returns who else is here.
 * Each person gets a distinct cursor color for the page (see
 * `pickSessionColor`), recomputed as people join and leave.
 *
 * Uses its own `presence` awareness field: Tiptap's caret extension owns the
 * conventional `user` field and overwrites it with `{ name, color }`.
 */
export function useLivePresence(
  awareness: Awareness,
  awarenessStates: Map<number, Record<string, unknown>>,
  user: AwarenessUser,
): LivePresence {
  const peers = useMemo<PeerPresence[]>(
    () =>
      [...awarenessStates.entries()]
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([clientId, state]) => {
          const presence = state[PRESENCE_FIELD] as AwarenessUser | undefined
          return presence?.id ? { ...presence, clientId } : null
        })
        .filter((peer): peer is PeerPresence => peer !== null),
    [awareness, awarenessStates],
  )

  const color = pickSessionColor(
    user.id,
    awareness.clientID,
    peers.map((peer) => ({ clientId: peer.clientId, presence: peer })),
  )
  const me = useMemo(() => ({ ...user, color }), [user, color])

  useEffect(() => {
    awareness.setLocalStateField(PRESENCE_FIELD, me)
  }, [awareness, me])

  useEffect(
    () => () => {
      awareness.setLocalStateField(PRESENCE_FIELD, null)
    },
    [awareness],
  )

  const people = useMemo(
    () => [...new Map(peers.filter((peer) => peer.id !== user.id).map((peer) => [peer.id, peer])).values()],
    [peers, user.id],
  )

  return { me, peers, people }
}
