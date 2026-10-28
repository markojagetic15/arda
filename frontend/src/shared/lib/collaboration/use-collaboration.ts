import { useEffect, useState } from 'react'
import { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'
import type { Socket } from 'socket.io-client'

import { getAccessToken } from '@/shared/api/auth-token-store'
import { refreshAccessToken } from '@/shared/api/http-client'
import { env } from '@/shared/config/env'

import { CollaborationProvider, type ConnectionStatus } from './collaboration-provider'

export interface UseCollaborationResult {
  /** Null until the connection effect below has run at least once. */
  doc: Y.Doc | null
  awareness: Awareness | null
  status: ConnectionStatus
  /** True once the server's copy of the document has been merged in. Seed default content only after this. */
  synced: boolean
  /** Reactive snapshot of every connected client's awareness state, keyed by their Yjs client id. */
  awarenessStates: Map<number, Record<string, unknown>>
  /** The page's shared socket, for feature-specific events (e.g. comments) layered on top of it. */
  socket: Socket | null
}

const EMPTY_AWARENESS_STATES = new Map<number, Record<string, unknown>>()

/**
 * Connects a Yjs document + awareness instance for `pageId` to the
 * collaboration WebSocket, keeping both in sync with every other client
 * viewing the same page.
 *
 * The Y.Doc/Awareness pair is created *inside* the effect below - not via
 * `useMemo` - and destroyed in that same effect's cleanup. This is
 * deliberate: React 18 Strict Mode mounts effects, cleans them up, and
 * re-mounts them once in development, and a resource created outside the
 * effect but destroyed inside it would be torn down out from under the
 * second mount.
 *
 * Callers must remount this hook when `pageId` changes (e.g. render its
 * consumer with `key={pageId}`) so a fresh connection is created per page.
 */
export function useCollaboration(pageId: string): UseCollaborationResult {
  const [state, setState] = useState<{
    doc: Y.Doc
    awareness: Awareness
    status: ConnectionStatus
    synced: boolean
    awarenessStates: Map<number, Record<string, unknown>>
    socket: Socket
  } | null>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    const awareness = new Awareness(doc)
    const provider = new CollaborationProvider(doc, awareness, {
      url: `${env.wsUrl}/collaboration`,
      pageId,
      getToken: getAccessToken,
      refreshToken: refreshAccessToken,
    })

    const unsubscribeStatus = provider.onStatusChange((status) => {
      queueMicrotask(() => setState((previous) => (previous ? { ...previous, status } : previous)))
    })
    const unsubscribeSynced = provider.onSynced(() => {
      queueMicrotask(() => setState((previous) => (previous ? { ...previous, synced: true } : previous)))
    })

    // y-protocols' Awareness emits 'change' synchronously. Extensions such as
    // Tiptap's CollaborationCaret set local state during a descendant
    // component's render, which would otherwise call setState on this
    // (ancestor) component mid-render. Deferring to a microtask breaks that
    // synchronous chain.
    const onAwarenessChange = () => {
      queueMicrotask(() =>
        setState((previous) => (previous ? { ...previous, awarenessStates: new Map(awareness.getStates()) } : previous)),
      )
    }
    awareness.on('change', onAwarenessChange)

    // This effect creates a resource (doc/awareness/socket connection) whose
    // lifetime must exactly match the effect's mount/cleanup, so the
    // resource itself can only be exposed to render via state set here - // there is no external store to read a snapshot from instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      doc,
      awareness,
      status: provider.getStatus(),
      synced: provider.isSynced(),
      awarenessStates: new Map(awareness.getStates()),
      socket: provider.getSocket(),
    })

    return () => {
      awareness.off('change', onAwarenessChange)
      unsubscribeStatus()
      unsubscribeSynced()
      provider.destroy()
      awareness.destroy()
      doc.destroy()
    }
  }, [pageId])

  if (!state) {
    return {
      doc: null,
      awareness: null,
      status: 'connecting',
      synced: false,
      awarenessStates: EMPTY_AWARENESS_STATES,
      socket: null,
    }
  }
  return state
}
