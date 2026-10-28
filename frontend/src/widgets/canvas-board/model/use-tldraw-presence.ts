import { useEffect, useRef } from 'react'
import {
  createPresenceStateDerivation,
  createUserId,
  InstancePresenceRecordType,
  react,
  atom,
  UserRecordType,
  type Atom,
  type TLInstancePresence,
  type TLStore,
  type TLUser,
} from 'tldraw'
import type { Awareness } from 'y-protocols/awareness'

import type { AwarenessUser } from '@/shared/lib/collaboration'

const PRESENCE_FIELD = 'tldrawPresence'

function toTLUser(user: AwarenessUser): TLUser {
  return UserRecordType.create({ id: createUserId(user.id), name: user.name, color: user.color })
}

interface UseTldrawPresenceInput {
  store: TLStore
  awareness: Awareness
  awarenessStates: Map<number, Record<string, unknown>>
  user: AwarenessUser
}

/**
 * Publishes this client's tldraw presence (cursor, selection, viewport) into
 * the page's existing Yjs `Awareness` instance, and mirrors every other
 * client's published presence into this store as `instance_presence`
 * records — which is exactly what tldraw's own collaborator cursor/selection
 * overlays and people menu render from.
 */
export function useTldrawPresence({ store, awareness, awarenessStates, user }: UseTldrawPresenceInput): void {
  const userSignalRef = useRef<Atom<TLUser> | null>(null)

  useEffect(() => {
    const userSignal = atom<TLUser>('tldraw-presence-user', toTLUser(user))
    userSignalRef.current = userSignal

    const instanceId = InstancePresenceRecordType.createId(String(awareness.clientID))
    const presenceSignal = createPresenceStateDerivation(userSignal, { instanceId })(store)

    const stopReacting = react('broadcast-tldraw-presence', () => {
      awareness.setLocalStateField(PRESENCE_FIELD, presenceSignal.get())
    })

    return () => {
      stopReacting()
      userSignalRef.current = null
      awareness.setLocalStateField(PRESENCE_FIELD, null)
    }
    // `user` is intentionally excluded: it's forwarded to the already-running
    // derivation via the ref-backed effect below instead of tearing down and
    // recreating the presence signal on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, awareness])

  useEffect(() => {
    userSignalRef.current?.set(toTLUser(user))
  }, [user])

  useEffect(() => {
    const seenIds = new Set<TLInstancePresence['id']>()
    for (const [clientId, state] of awarenessStates) {
      if (clientId === awareness.clientID) continue
      const presence = state[PRESENCE_FIELD] as TLInstancePresence | null | undefined
      if (!presence) continue
      seenIds.add(presence.id)
      store.mergeRemoteChanges(() => {
        store.put([presence])
      })
    }

    const staleIds = store
      .allRecords()
      .filter((record): record is TLInstancePresence => record.typeName === 'instance_presence')
      .map((record) => record.id)
      .filter((id) => !seenIds.has(id))

    if (staleIds.length > 0) {
      store.mergeRemoteChanges(() => {
        store.remove(staleIds)
      })
    }
  }, [store, awareness, awarenessStates])
}
