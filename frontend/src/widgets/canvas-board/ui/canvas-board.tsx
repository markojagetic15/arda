import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  MainMenu,
  WelcomeScreen,
} from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { Spinner } from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Socket } from 'socket.io-client'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { hasRole, pageUrl, parsePageLink, type Role } from '@/entities/hierarchy-node'
import { useHierarchyTree } from '@/features/hierarchy-tree'
import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { useComments } from '@/shared/lib/comments'
import { useTheme } from '@/shared/lib/theme'
import { PageHeader } from '@/widgets/page-header'
import { PresenceAvatars, StatusBadge, useLivePresence, type PeerPresence } from '@/widgets/page-collaboration'

import { bindExcalidrawToYjs, readScene } from '../model/excalidraw-yjs'
import { CanvasCommentOverlay, type ViewState } from './canvas-comment-overlay'
import { CanvasCursors, type PeerCanvasState } from './canvas-cursors'

import '@excalidraw/excalidraw/index.css'

// Production builds serve Excalidraw's fonts from our own origin (copied in
// the Dockerfile) instead of its default public CDN.
if (import.meta.env.PROD) {
  ;(window as unknown as { EXCALIDRAW_ASSET_PATH: string }).EXCALIDRAW_ASSET_PATH = '/'
}

interface CanvasBoardProps {
  pageId: string
  user: AwarenessUser
  role?: Role
}

const POINTER_FIELD = 'excalidrawPointer'
const SELECTION_FIELD = 'excalidrawSelection'

interface PointerState {
  x: number
  y: number
  tool: 'pointer' | 'laser'
  button: 'up' | 'down'
}

export function CanvasBoard({ pageId, user, role }: CanvasBoardProps) {
  const { doc, awareness, status, synced, awarenessStates, socket } = useCollaboration(pageId)

  // The canvas needs the server's copy before it mounts: Excalidraw takes its
  // content once, as initial data.
  if (!doc || !awareness || !synced) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader pageId={pageId}>
          <StatusBadge status={status} />
        </PageHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted">
          <Spinner size="sm" />
          {status === 'disconnected' ? 'Waiting for the connection to load this canvas...' : null}
        </div>
      </div>
    )
  }

  return (
    <CanvasEditor
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

interface CanvasEditorProps {
  pageId: string
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
  role?: Role
}

function CanvasEditor({ pageId, doc, awareness, status, awarenessStates, socket, user, role }: CanvasEditorProps) {
  const canEdit = hasRole(role, 'edit')
  const { people, peers } = useLivePresence(awareness, awarenessStates, user)
  const { comments, createComment, resolveComment } = useComments(socket)
  const { resolvedTheme } = useTheme()
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [view, setView] = useState<ViewState | null>(null)
  const bindingRef = useRef<ReturnType<typeof bindExcalidrawToYjs> | null>(null)
  const frameRef = useRef(0)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const navigate = useNavigate()
  const { data: tree } = useHierarchyTree()
  const initialData = useMemo(() => ({ ...readScene(doc), scrollToContent: true }), [doc])

  useEffect(() => {
    if (!api) return
    const binding = bindExcalidrawToYjs(doc, api)
    bindingRef.current = binding
    return () => {
      binding.destroy()
      bindingRef.current = null
    }
  }, [api, doc])

  // Other people's (and the user's other tabs') pointers and selections, drawn by CanvasCursors.
  const peerCanvasStates = useMemo<PeerCanvasState[]>(
    () =>
      peers.map((peer) => {
        const state = awarenessStates.get(peer.clientId) ?? {}
        const pointer = state[POINTER_FIELD] as PointerState | undefined
        const selection = (state[SELECTION_FIELD] as Record<string, true> | undefined) ?? {}
        return { peer, pointer: pointer ? { x: pointer.x, y: pointer.y } : null, selectedIds: Object.keys(selection) }
      }),
    [peers, awarenessStates],
  )

  /** Centers the view on someone's pointer. */
  function jumpTo(person: PeerPresence) {
    if (!api) return
    const pointer = awarenessStates.get(person.clientId)?.[POINTER_FIELD] as PointerState | undefined
    if (!pointer) return
    const appState = api.getAppState()
    const zoom = appState.zoom.value
    api.updateScene({
      appState: {
        scrollX: appState.width / (2 * zoom) - pointer.x,
        scrollY: appState.height / (2 * zoom) - pointer.y,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    })
  }

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  /** A pasted page link becomes a labelled text element that opens the page. */
  function pastePageLink(pageId: string): void {
    if (!api) return
    const appState = api.getAppState()
    const at = pointerRef.current ?? {
      x: -appState.scrollX + appState.width / 2 / appState.zoom.value,
      y: -appState.scrollY + appState.height / 2 / appState.zoom.value,
    }
    const page = tree?.nodes.find((node) => node.id === pageId)
    const [element] = convertToExcalidrawElements([
      {
        type: 'text',
        x: at.x,
        y: at.y,
        text: `↗ ${page?.label ?? 'Linked page'}`,
        fontSize: 20,
        strokeColor: '#5b4cf0',
        link: pageUrl(pageId),
      },
    ])
    api.updateScene({
      elements: [...api.getSceneElementsIncludingDeleted(), element],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader pageId={pageId}>
        <PresenceAvatars users={people} onSelect={jumpTo} />
        <StatusBadge status={status} />
      </PageHeader>
      <div className="relative min-h-0 flex-1">
        <Excalidraw
          initialData={initialData}
          excalidrawAPI={setApi}
          theme={resolvedTheme}
          isCollaborating
          viewModeEnabled={!canEdit}
          UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false } }}
          onChange={(elements, appState, files) => {
            bindingRef.current?.onLocalChange(elements, appState, files)

            const selection = appState.selectedElementIds
            const published = awareness.getLocalState()?.[SELECTION_FIELD] as Record<string, true> | undefined
            if (JSON.stringify(published ?? {}) !== JSON.stringify(selection)) {
              awareness.setLocalStateField(SELECTION_FIELD, selection)
            }

            // Comment badges follow scroll/zoom/selection; batch to one update per frame.
            cancelAnimationFrame(frameRef.current)
            frameRef.current = requestAnimationFrame(() =>
              setView({
                scrollX: appState.scrollX,
                scrollY: appState.scrollY,
                zoom: appState.zoom,
                offsetLeft: appState.offsetLeft,
                offsetTop: appState.offsetTop,
                selectedElementIds: Object.keys(selection),
                elements,
              }),
            )
          }}
          onPointerUpdate={({ pointer, button }) => {
            pointerRef.current = { x: pointer.x, y: pointer.y }
            awareness.setLocalStateField(POINTER_FIELD, { ...pointer, button } satisfies PointerState)
          }}
          onPaste={(data) => {
            const pageId = data.text ? parsePageLink(data.text) : null
            if (!pageId || !canEdit) return true
            pastePageLink(pageId)
            return false
          }}
          onLinkOpen={(element, event) => {
            const pageId = element.link ? parsePageLink(element.link) : null
            if (!pageId) return
            event.preventDefault()
            navigate(`/workspace/${pageId}`)
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.LoadScene />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.SearchMenu />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.Separator />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
            <MainMenu.DefaultItems.Help />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.HelpHint />
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Heading>Sketch, diagram and brainstorm together.</WelcomeScreen.Center.Heading>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
        {view ? <CanvasCursors view={view} peers={peerCanvasStates} /> : null}
        {view ? (
          <CanvasCommentOverlay
            view={view}
            comments={comments}
            onCreateComment={(elementId, body) =>
              createComment({ anchorType: 'canvas-shape', anchorId: elementId, body })
            }
            onResolveComment={resolveComment}
            canComment={hasRole(role, 'comment')}
          />
        ) : null}
      </div>
    </div>
  )
}
