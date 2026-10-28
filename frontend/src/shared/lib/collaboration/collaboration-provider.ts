import { applyAwarenessUpdate, encodeAwarenessUpdate, type Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'
import { io, type Socket } from 'socket.io-client'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface CollaborationProviderOptions {
  url: string
  pageId: string
  getToken: () => string | null
}

/**
 * Binds an existing Y.Doc + Awareness instance to the server's collaboration
 * WebSocket namespace. Mirrors the shape of `y-websocket`'s WebsocketProvider
 * (a `.awareness` on a live document) but speaks the app's Socket.io-based
 * sync/awareness protocol instead of raw `y-websocket` framing.
 */
type PendingUpdate = { event: 'awareness-update' | 'sync-update'; data: Uint8Array }

export class CollaborationProvider {
  private readonly doc: Y.Doc
  private readonly awareness: Awareness
  private readonly socket: Socket
  private status: ConnectionStatus = 'connecting'
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>()
  // Local doc/awareness updates can happen before the server has acked our
  // 'join' (e.g. a widget seeding default content into the doc the instant
  // it mounts). socket.io buffers emits made while disconnected and flushes
  // them the moment the transport opens — which happens *before* our
  // 'connect' handler (and its 'join' emit) below even runs. Queuing here
  // instead guarantees 'join' is always the first thing the server sees for
  // this socket, so it isn't dropped as "not yet joined".
  private joined = false
  private readonly pendingUpdates: PendingUpdate[] = []

  constructor(doc: Y.Doc, awareness: Awareness, options: CollaborationProviderOptions) {
    this.doc = doc
    this.awareness = awareness
    this.socket = io(options.url, {
      auth: { token: options.getToken() },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      this.socket.emit('join', { pageId: options.pageId })
      this.joined = true
      for (const { event, data } of this.pendingUpdates) this.socket.emit(event, data)
      this.pendingUpdates.length = 0

      // Resend the full local awareness state on every (re)join: unlike
      // queued updates above, this covers state set before this client ever
      // connected, and state a server may have forgotten across a reconnect.
      if (awareness.getLocalState()) {
        this.socket.emit('awareness-update', encodeAwarenessUpdate(awareness, [awareness.clientID]))
      }

      this.setStatus('connected')
    })
    this.socket.on('disconnect', () => {
      this.joined = false
      this.setStatus('disconnected')
    })
    this.socket.on('connect_error', () => this.setStatus('disconnected'))

    this.socket.on('sync-state', (update: ArrayBuffer) => this.applyRemoteSync(update))
    this.socket.on('sync-update', (update: ArrayBuffer) => this.applyRemoteSync(update))
    this.socket.on('awareness-state', (update: ArrayBuffer) => this.applyRemoteAwareness(update))
    this.socket.on('awareness-update', (update: ArrayBuffer) => this.applyRemoteAwareness(update))

    doc.on('update', this.handleLocalDocUpdate)
    awareness.on('update', this.handleLocalAwarenessUpdate)
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  /** The underlying socket, for feature-specific events (e.g. comments) layered on top of this same per-page connection. */
  getSocket(): Socket {
    return this.socket
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  destroy(): void {
    this.doc.off('update', this.handleLocalDocUpdate)
    this.awareness.off('update', this.handleLocalAwarenessUpdate)
    this.socket.disconnect()
    this.statusListeners.clear()
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }

  private applyRemoteSync(update: ArrayBuffer): void {
    Y.applyUpdate(this.doc, new Uint8Array(update), 'server')
  }

  private applyRemoteAwareness(update: ArrayBuffer): void {
    applyAwarenessUpdate(this.awareness, new Uint8Array(update), 'server')
  }

  private readonly handleLocalDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === 'server') return
    this.send('sync-update', update)
  }

  private readonly handleLocalAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ): void => {
    if (origin === 'server') return
    const changedIds = [...added, ...updated, ...removed]
    if (changedIds.length === 0) return
    this.send('awareness-update', encodeAwarenessUpdate(this.awareness, changedIds))
  }

  private send(event: PendingUpdate['event'], data: Uint8Array): void {
    if (this.joined) {
      this.socket.emit(event, data)
    } else {
      this.pendingUpdates.push({ event, data })
    }
  }
}
