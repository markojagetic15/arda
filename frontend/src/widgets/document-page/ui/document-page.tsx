import { Spinner } from '@heroui/react'
import { EditorContext } from '@tiptap/react'
import { useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { useComments } from '@/shared/lib/comments'
import { FormattingSidebar } from '@/widgets/formatting-sidebar'
import { PresenceAvatars, StatusBadge } from '@/widgets/page-collaboration'
import { RichTextEditor, useTiptapEditor } from '@/widgets/text-editor'

import { TextCommentBubbleMenu } from './text-comment-bubble-menu'
import { TextCommentOverlay } from './text-comment-overlay'

interface DocumentPageProps {
  pageId: string
  user: AwarenessUser
}

export function DocumentPage({ pageId, user }: DocumentPageProps) {
  const { doc, awareness, status, awarenessStates, socket } = useCollaboration(pageId)

  if (!doc || !awareness) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <DocumentEditor
      doc={doc}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
    />
  )
}

interface DocumentEditorProps {
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
}

function DocumentEditor({ doc, awareness, status, awarenessStates, socket, user }: DocumentEditorProps) {
  const editor = useTiptapEditor({ doc, awareness, user })
  const { comments, createComment, resolveComment } = useComments(socket)
  const [newCommentId, setNewCommentId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const remoteUsers = [...awarenessStates.entries()]
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([, state]) => state.user as AwarenessUser | undefined)
    .filter((candidate): candidate is AwarenessUser => Boolean(candidate))

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="flex h-full">
        <div ref={contentRef} className="relative flex-1 overflow-y-auto p-8">
          <div className="mb-4 flex items-center justify-between">
            <StatusBadge status={status} />
            <PresenceAvatars users={remoteUsers} />
          </div>
          <RichTextEditor editor={editor} />
          <TextCommentBubbleMenu editor={editor} onStartComment={setNewCommentId} />
          <TextCommentOverlay
            editor={editor}
            comments={comments}
            containerRef={contentRef}
            newCommentId={newCommentId}
            onCreateComment={(commentId, body) => createComment({ anchorType: 'text', anchorId: commentId, body })}
            onResolveComment={resolveComment}
          />
        </div>
        <aside className="w-64 shrink-0 overflow-y-auto border-l border-current/10 p-4">
          <FormattingSidebar />
        </aside>
      </div>
    </EditorContext.Provider>
  )
}
