import { Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { Tldraw, type Editor, type TLStore, type TLStoreWithStatus } from 'tldraw'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { useComments } from '@/shared/lib/comments'
import { CanvasFormattingSidebar } from '@/widgets/canvas-formatting-sidebar'
import { PresenceAvatars, StatusBadge } from '@/widgets/page-collaboration'

import { useTldrawPresence } from '../model/use-tldraw-presence'
import { useTldrawYjsStore } from '../model/use-tldraw-yjs-store'
import { CanvasCommentOverlay } from './canvas-comment-overlay'

import 'tldraw/tldraw.css'

interface CanvasBoardProps {
  pageId: string
  user: AwarenessUser
}

export function CanvasBoard({ pageId, user }: CanvasBoardProps) {
  const { doc, awareness, status, awarenessStates, socket } = useCollaboration(pageId)

  if (!doc || !awareness) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <CanvasBoardStore
      doc={doc}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
    />
  )
}

interface CanvasBoardStoreProps {
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
}

function CanvasBoardStore({ doc, awareness, status, awarenessStates, socket, user }: CanvasBoardStoreProps) {
  const store = useTldrawYjsStore(doc)

  if (!store) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  const storeWithStatus: TLStoreWithStatus = {
    store,
    status: 'synced-remote',
    connectionStatus: status === 'connected' ? 'online' : 'offline',
  }

  return (
    <CanvasBoardEditor
      store={store}
      storeWithStatus={storeWithStatus}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
    />
  )
}

interface CanvasBoardEditorProps {
  store: TLStore
  storeWithStatus: TLStoreWithStatus
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
}

function CanvasBoardEditor({
  store,
  storeWithStatus,
  awareness,
  status,
  awarenessStates,
  socket,
  user,
}: CanvasBoardEditorProps) {
  useTldrawPresence({ store, awareness, awarenessStates, user })
  const { comments, createComment, resolveComment } = useComments(socket)
  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    awareness.setLocalStateField('user', user)
    return () => {
      awareness.setLocalStateField('user', null)
    }
  }, [awareness, user])

  const remoteUsers = [...awarenessStates.entries()]
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([, state]) => state.user as AwarenessUser | undefined)
    .filter((candidate): candidate is AwarenessUser => Boolean(candidate))

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-current/10 px-4 py-2">
        <StatusBadge status={status} />
        <PresenceAvatars users={remoteUsers} />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Tldraw store={storeWithStatus} onMount={setEditor} components={{ StylePanel: null }} />
          {editor ? (
            <CanvasCommentOverlay
              editor={editor}
              comments={comments}
              onCreateComment={(shapeId, body) => createComment({ anchorType: 'canvas-shape', anchorId: shapeId, body })}
              onResolveComment={resolveComment}
            />
          ) : null}
        </div>
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-current/10 p-4">
          <CanvasFormattingSidebar editor={editor} />
        </aside>
      </div>
    </div>
  )
}
