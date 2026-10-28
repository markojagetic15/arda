import { Spinner } from '@heroui/react'
import { EditorContext } from '@tiptap/react'
import { MessageSquare, PanelRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { hasRole, type Role } from '@/entities/hierarchy-node'
import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { commentsForAnchor, isThreadResolved, useComments } from '@/shared/lib/comments'
import { readLocal, writeLocal } from '@/shared/lib/storage/local'
import { PageHeader } from '@/widgets/page-header'
import { PresenceAvatars, StatusBadge, useLivePresence, type PeerPresence } from '@/widgets/page-collaboration'
import {
  EditorToolbar,
  FormatPanel,
  RichTextEditor,
  SelectionBubble,
  UploadStatusBar,
  useTiptapEditor,
} from '@/widgets/text-editor'
import { uid } from '@/shared/lib/id'

import { revealCommentRange, useCommentRanges } from '../model/use-comment-ranges'
import { CommentsPanel } from './comments-panel'
import { DocumentTitle } from './document-title'
import { TextCommentOverlay } from './text-comment-overlay'

interface DocumentPageProps {
  pageId: string
  user: AwarenessUser
  role?: Role
}

const PANEL_KEY = 'proarda-document-panel'

type SidePanel = 'format' | 'comments' | null

/** Shows the editor once the server's copy has loaded - or after a short wait, so offline still works. */
function useReady(synced: boolean): boolean {
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(timer)
  }, [])
  return synced || timedOut
}

export function DocumentPage({ pageId, user, role }: DocumentPageProps) {
  const { doc, awareness, status, synced, awarenessStates, socket } = useCollaboration(pageId)
  const ready = useReady(synced)

  if (!doc || !awareness || !ready) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader pageId={pageId}>
          <StatusBadge status={status} />
        </PageHeader>
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <DocumentEditor
      pageId={pageId}
      doc={doc}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
      role={role}
    />
  )
}

interface DocumentEditorProps {
  pageId: string
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
  role?: Role
}

function DocumentEditor({ pageId, doc, awareness, status, awarenessStates, socket, user, role }: DocumentEditorProps) {
  const canEdit = hasRole(role, 'edit')
  const canComment = hasRole(role, 'comment')
  const { me, people } = useLivePresence(awareness, awarenessStates, user)
  const editor = useTiptapEditor({ doc, awareness, user: me, editable: canEdit, pageId })
  const { comments, createComment, resolveComment } = useComments(socket)
  const [newCommentId, setNewCommentId] = useState<string | null>(null)
  const [panel, setPanelState] = useState<SidePanel>(() => readLocal<SidePanel>(PANEL_KEY, 'format'))
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const ranges = useCommentRanges(editor)
  // Viewers and commenters have no formatting panel.
  const shownPanel: SidePanel = panel === 'format' && !canEdit ? null : panel
  const openThreads = ranges.filter((range) => {
    const thread = commentsForAnchor(comments, 'text', range.commentId)
    return thread.length > 0 && !isThreadResolved(thread)
  }).length

  function setPanel(next: SidePanel) {
    setPanelState(next)
    writeLocal(PANEL_KEY, next)
  }

  function openThread(commentId: string) {
    setActiveThreadId(commentId)
    setPanel('comments')
  }

  // Clicking highlighted (commented) text opens its thread in the panel.
  useEffect(() => {
    const container = contentRef.current
    if (!container) return
    const onClick = (event: MouseEvent) => {
      const mark = (event.target as HTMLElement).closest<HTMLElement>('.comment-mark[data-comment-id]')
      const commentId = mark?.dataset.commentId
      if (commentId && commentsForAnchor(comments, 'text', commentId).length > 0) openThread(commentId)
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  })

  // The caret extension keeps its own copy of name/color in awareness.
  useEffect(() => {
    editor.commands.updateUser({ name: me.name, color: me.color })
  }, [editor, me.name, me.color])

  /** Scrolls to someone's text caret (the caret element carries their name and color). */
  function jumpTo(person: PeerPresence) {
    const caret = [...(contentRef.current?.querySelectorAll<HTMLElement>('.collaboration-carets__caret') ?? [])].find(
      (element) => element.textContent === person.name,
    )
    caret?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    caret?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 600 })
  }

  function startComment() {
    const commentId = uid()
    editor.chain().focus().setComment(commentId).run()
    setNewCommentId(commentId)
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="flex h-full flex-col">
        <PageHeader pageId={pageId}>
          <PresenceAvatars users={people} onSelect={jumpTo} />
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={() => setPanel(shownPanel === 'comments' ? null : 'comments')}
            aria-pressed={shownPanel === 'comments'}
            title={shownPanel === 'comments' ? 'Hide comments' : 'Show comments'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium ${
              shownPanel === 'comments' ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-default hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {openThreads > 0 ? <span className="tabular-nums">{openThreads}</span> : null}
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setPanel(shownPanel === 'format' ? null : 'format')}
              aria-pressed={shownPanel === 'format'}
              title={shownPanel === 'format' ? 'Hide formatting panel' : 'Show formatting panel'}
              className={`hidden h-8 w-8 items-center justify-center rounded-lg lg:flex ${
                shownPanel === 'format' ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-default hover:text-foreground'
              }`}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          ) : null}
        </PageHeader>

        {canEdit ? (
          <div className="shrink-0 border-b border-border bg-surface">
            <EditorToolbar editor={editor} />
          </div>
        ) : null}
        <UploadStatusBar />

        <div className="flex min-h-0 flex-1">
          <div ref={contentRef} className="scroll-thin relative flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[780px] px-6 pt-12 sm:px-12">
              <DocumentTitle pageId={pageId} readOnly={!canEdit} onEnter={() => editor.commands.focus('start')} />
              <RichTextEditor editor={editor} />
            </div>
            {canEdit ? <SelectionBubble editor={editor} onComment={startComment} /> : null}
            {activeThreadId && shownPanel === 'comments' ? (
              <style>{`.comment-mark[data-comment-id="${activeThreadId}"] { background-color: rgb(250 204 21 / 55%); }`}</style>
            ) : null}
            <TextCommentOverlay
              editor={editor}
              ranges={ranges}
              comments={comments}
              containerRef={contentRef}
              newCommentId={newCommentId}
              onCreateComment={(commentId, body) => createComment({ anchorType: 'text', anchorId: commentId, body })}
              onResolveComment={resolveComment}
              canComment={canComment}
            />
          </div>
          {shownPanel === 'format' ? (
            <aside className="scroll-thin hidden w-72 shrink-0 overflow-y-auto border-l border-border bg-surface lg:block">
              <FormatPanel editor={editor} />
            </aside>
          ) : null}
          {shownPanel === 'comments' ? (
            <aside className="scroll-thin fixed inset-y-0 right-0 z-30 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface-secondary shadow-xl lg:static lg:shadow-none">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
                <h2 className="text-sm font-semibold">Comments</h2>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Close comments"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CommentsPanel
                ranges={ranges}
                comments={comments}
                activeThreadId={activeThreadId}
                canComment={canComment}
                onSelectThread={(commentId) => {
                  setActiveThreadId(commentId)
                  const range = ranges.find((candidate) => candidate.commentId === commentId)
                  if (range) revealCommentRange(editor, range)
                }}
                onReply={(commentId, body) => createComment({ anchorType: 'text', anchorId: commentId, body })}
                onResolve={resolveComment}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </EditorContext.Provider>
  )
}
