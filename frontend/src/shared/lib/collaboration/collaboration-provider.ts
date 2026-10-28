import { applyAwarenessUpdate, encodeAwarenessUpdate, type Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'
import { io, type Socket } from 'socket.io-client'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface CollaborationProviderOptions {
  url: string
  pageId: string
  getToken: () => string | null
  /** Called when the server rejects the access token; resolves true once a fresh one is stored. */
  refreshToken?: () => Promise<boolean>
}

/**
 * Binds an existing Y.Doc + Awareness instance to the server's collaboration
 * WebSocket namespace. Mirrors the shape of `y-websocket`'s WebsocketProvider
 * (a `.awareness` on a live document) but speaks the app's Socket.io-based
 * sync/awareness protocol instead of raw `y-websocket` framing.
 *
 * Handshake: on every (re)connect the client emits `join` and then stays
 * silent until the server answers with `sync-state`. The server's `join`
 * handler is async (it checks page ownership in the database), so anything
 * sent before that answer would be dropped - and because Yjs applies each
 * client's updates strictly in clock order, one dropped update would leave
 * every later update from this client stuck as "pending" forever, on the
 * server and on every peer. Once `sync-state` arrives the client sends its
 * *entire* local state once (Yjs ignores what the server already has), which
 * also covers edits made while disconnected.
 */
export class CollaborationProvider {
  private readonly doc: Y.Doc
  private readonly awareness: Awareness
  private readonly socket: Socket
  private status: ConnectionStatus = 'connecting'
  private synced = false
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>()
  private readonly syncedListeners = new Set<() => void>()
  /** True between the server's `sync-state` and the next disconnect. */
  private joined = false
  private refreshing = false

  constructor(doc: Y.Doc, awareness: Awareness, options: CollaborationProviderOptions) {
    this.doc = doc
    this.awareness = awareness
    this.socket = io(options.url, {
      // A function, so every reconnect sends the current token rather than
      // the one that was valid when the page was opened.
      auth: (callback) => callback({ token: options.getToken() }),
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      this.socket.emit('join', { pageId: options.pageId })
    })
    this.socket.on('disconnect', () => {
      this.joined = false
      this.setStatus('disconnected')
    })
    this.socket.on('connect_error', () => this.setStatus('disconnected'))
    this.socket.on('error', (payload: { message?: string }) => {
      if (!/token/i.test(payload?.message ?? '') || !options.refreshToken || this.refreshing) return
      this.refreshing = true
      void options.refreshToken().then((ok) => {
        this.refreshing = false
        if (ok && !this.socket.connected) this.socket.connect()
      })
    })

    this.socket.on('sync-state', (update: ArrayBuffer) => {
      this.applyRemoteSync(update)
      this.joined = true
      this.socket.emit('sync-update', Y.encodeStateAsUpdate(this.doc))
      if (awareness.getLocalState()) {
        this.socket.emit('awareness-update', encodeAwarenessUpdate(awareness, [awareness.clientID]))
      }
      this.setStatus('connected')
      if (!this.synced) {
        this.synced = true
        this.syncedListeners.forEach((listener) => listener())
      }
    })
    this.socket.on('sync-update', (update: ArrayBuffer) => this.applyRemoteSync(update))
    this.socket.on('awareness-state', (update: ArrayBuffer) => this.applyRemoteAwareness(update))
    this.socket.on('awareness-update', (update: ArrayBuffer) => this.applyRemoteAwareness(update))

    doc.on('update', this.handleLocalDocUpdate)
    awareness.on('update', this.handleLocalAwarenessUpdate)
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  /** Whether the server's state has been received at least once. */
  isSynced(): boolean {
    return this.synced
  }

  /** The underlying socket, for feature-specific events (e.g. comments) layered on top of this same per-page connection. */
  getSocket(): Socket {
    return this.socket
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  onSynced(listener: () => void): () => void {
    this.syncedListeners.add(listener)
    return () => this.syncedListeners.delete(listener)
  }

  destroy(): void {
    this.doc.off('update', this.handleLocalDocUpdate)
    this.awareness.off('update', this.handleLocalAwarenessUpdate)
    this.socket.disconnect()
    this.statusListeners.clear()
    this.syncedListeners.clear()
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

  // Updates made before the handshake completes are not queued: the full
  // state sent on `sync-state` already contains them.
  private readonly handleLocalDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === 'server' || !this.joined) return
    this.socket.emit('sync-update', update)
  }

  private readonly handleLocalAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ): void => {
    if (origin === 'server' || !this.joined) return
    const changedIds = [...added, ...updated, ...removed]
    if (changedIds.length === 0) return
    this.socket.emit('awareness-update', encodeAwarenessUpdate(this.awareness, changedIds))
  }
}
