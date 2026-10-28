import { CaptureUpdateAction, reconcileElements } from '@excalidraw/excalidraw'
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState, BinaryFileData, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import * as Y from 'yjs'

const ELEMENTS_MAP = 'excalidraw-elements'
const FILES_MAP = 'excalidraw-files'
const LOCAL_ORIGIN = 'excalidraw-local'

type RemoteElements = Parameters<typeof reconcileElements>[1]

/**
 * Excalidraw mutates element objects in place while drawing, and a Y.Map
 * hands back the very object that was stored. Without copying on the way in
 * and out, the stored record would silently track local mutations (so later
 * versions never look "changed") and remote records would be mutated by the
 * local scene.
 */
const copy = <T>(value: T): T => structuredClone(value)

export function elementsMap(doc: Y.Doc) {
  return doc.getMap<OrderedExcalidrawElement>(ELEMENTS_MAP)
}

export function filesMap(doc: Y.Doc) {
  return doc.getMap<BinaryFileData>(FILES_MAP)
}

/** Everything saved for this canvas, in z-order, ready for Excalidraw's `initialData`. */
export function readScene(doc: Y.Doc) {
  const elements = [...elementsMap(doc).values()].map(copy).sort((a, b) =>
    (a.index ?? '') < (b.index ?? '') ? -1 : (a.index ?? '') > (b.index ?? '') ? 1 : 0,
  )
  const files: BinaryFiles = Object.fromEntries([...filesMap(doc).entries()].map(([id, file]) => [id, copy(file)]))
  return { elements, files }
}

/**
 * Two-way binding between an Excalidraw scene and the page's Y.Doc.
 *
 * Every element (including soft-deleted ones, which Excalidraw keeps with
 * `isDeleted: true`) is one record in a flat `Y.Map` keyed by element id, so
 * concurrent edits to different elements never conflict. Excalidraw bumps
 * `version`/`versionNonce` on every change; only elements whose version
 * differs from the stored one are written. Remote changes are merged with
 * Excalidraw's own `reconcileElements` (which keeps the element currently
 * being edited locally) and applied without entering the local undo stack.
 * Image files go through a second map and are only ever added.
 */
export function bindExcalidrawToYjs(doc: Y.Doc, api: ExcalidrawImperativeAPI) {
  const yElements = elementsMap(doc)
  const yFiles = filesMap(doc)

  function onLocalChange(elements: readonly OrderedExcalidrawElement[], _appState: AppState, files: BinaryFiles) {
    const changed = elements.filter((element) => {
      const stored = yElements.get(element.id)
      return !stored || stored.version !== element.version || stored.versionNonce !== element.versionNonce
    })
    const newFiles = Object.values(files).filter((file) => !yFiles.has(file.id))
    if (changed.length === 0 && newFiles.length === 0) return
    doc.transact(() => {
      for (const element of changed) yElements.set(element.id, copy(element))
      for (const file of newFiles) yFiles.set(file.id, copy(file))
    }, LOCAL_ORIGIN)
  }

  const onRemoteElements = (event: Y.YMapEvent<OrderedExcalidrawElement>, transaction: Y.Transaction) => {
    if (transaction.origin === LOCAL_ORIGIN) return
    const remote = [...event.keysChanged]
      .map((id) => yElements.get(id))
      .filter((element): element is OrderedExcalidrawElement => Boolean(element))
      .map(copy)
    if (remote.length === 0) return
    const elements = reconcileElements(
      api.getSceneElementsIncludingDeleted(),
      // Elements from other clients; the brand only marks them as such.
      remote as unknown as RemoteElements,
      api.getAppState(),
    )
    api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER })
  }

  const onRemoteFiles = (event: Y.YMapEvent<BinaryFileData>, transaction: Y.Transaction) => {
    if (transaction.origin === LOCAL_ORIGIN) return
    const added = [...event.keysChanged]
      .map((id) => yFiles.get(id))
      .filter((file): file is BinaryFileData => Boolean(file))
      .map(copy)
    if (added.length > 0) api.addFiles(added)
  }

  yElements.observe(onRemoteElements)
  yFiles.observe(onRemoteFiles)

  return {
    onLocalChange,
    destroy() {
      yElements.unobserve(onRemoteElements)
      yFiles.unobserve(onRemoteFiles)
    },
  }
}
