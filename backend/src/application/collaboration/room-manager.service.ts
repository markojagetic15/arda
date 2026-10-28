import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Y from 'yjs';

import { DocumentSnapshotRepository } from '../../domain/collaboration/document-snapshot.repository.js';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module.js';

const SYNC_CHANNEL_PREFIX = 'yjs-update:';
const AWARENESS_CHANNEL_PREFIX = 'yjs-awareness:';
const PERSIST_DEBOUNCE_MS = 2_000;
const EVICTION_GRACE_MS = 10_000;

interface RoomState {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  /** Socket ids currently in this room, on this instance only. */
  sockets: Set<string>;
  /** Which awareness clientIDs were introduced by which local socket - used to clean up on disconnect. */
  socketAwarenessIds: Map<string, Set<number>>;
  persistTimer: NodeJS.Timeout | null;
}

/**
 * Owns the in-memory Yjs CRDT state for every actively-viewed page (one room
 * per page id). A single process instance only holds rooms it has local
 * socket connections for; updates are relayed to sibling instances over
 * Redis pub/sub so every instance's server-side replica - and therefore
 * whatever it persists - stays correct regardless of which instance a given
 * client happens to be connected to.
 */
@Injectable()
export class RoomManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly rooms = new Map<string, RoomState>();
  private subscriber: Redis | null = null;

  constructor(
    private readonly snapshotRepository: DocumentSnapshotRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redis.duplicate();
    await this.subscriber.psubscribe(
      `${SYNC_CHANNEL_PREFIX}*`,
      `${AWARENESS_CHANNEL_PREFIX}*`,
    );
    this.subscriber.on(
      'pmessageBuffer',
      (_pattern: string, channel: Buffer, message: Buffer) => {
        const channelName = channel.toString();
        if (channelName.startsWith(SYNC_CHANNEL_PREFIX)) {
          this.handleRemoteSyncUpdate(
            channelName.slice(SYNC_CHANNEL_PREFIX.length),
            message,
          );
        } else if (channelName.startsWith(AWARENESS_CHANNEL_PREFIX)) {
          this.handleRemoteAwarenessUpdate(
            channelName.slice(AWARENESS_CHANNEL_PREFIX.length),
            message,
          );
        }
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [...this.rooms.keys()].map((pageId) => this.flush(pageId)),
    );
    await this.subscriber?.quit();
  }

  /** Joins `socketId` to the room for `pageId`, creating and hydrating it from storage if needed. */
  async joinRoom(pageId: string, socketId: string): Promise<RoomState> {
    let room = this.rooms.get(pageId);
    if (!room) {
      room = await this.createRoom(pageId);
      this.rooms.set(pageId, room);
    }
    room.sockets.add(socketId);
    return room;
  }

  /**
   * Removes `socketId` from the room, cleaning up any awareness state it
   * introduced. Returns the encoded awareness "removal" update to broadcast
   * to the remaining clients, if any state was actually removed.
   */
  leaveRoom(pageId: string, socketId: string): Uint8Array | null {
    const room = this.rooms.get(pageId);
    if (!room) return null;

    room.sockets.delete(socketId);
    const clientIds = room.socketAwarenessIds.get(socketId);
    room.socketAwarenessIds.delete(socketId);

    let removalUpdate: Uint8Array | null = null;
    if (clientIds && clientIds.size > 0) {
      const ids = [...clientIds];
      awarenessProtocol.removeAwarenessStates(room.awareness, ids, socketId);
      removalUpdate = awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        ids,
      );
    }

    if (room.sockets.size === 0) {
      this.scheduleEviction(pageId);
    }
    return removalUpdate;
  }

  getStateUpdate(pageId: string): Uint8Array {
    const room = this.requireRoom(pageId);
    return Y.encodeStateAsUpdate(room.doc);
  }

  getAwarenessUpdate(pageId: string): Uint8Array {
    const room = this.requireRoom(pageId);
    return awarenessProtocol.encodeAwarenessUpdate(room.awareness, [
      ...room.awareness.getStates().keys(),
    ]);
  }

  applyLocalSyncUpdate(pageId: string, update: Uint8Array): void {
    const room = this.rooms.get(pageId);
    if (!room) return;
    Y.applyUpdate(room.doc, update, 'local');
    this.schedulePersist(pageId);
    void this.redis.publish(
      `${SYNC_CHANNEL_PREFIX}${pageId}`,
      Buffer.from(update),
    );
  }

  applyLocalAwarenessUpdate(
    pageId: string,
    update: Uint8Array,
    socketId: string,
  ): void {
    const room = this.rooms.get(pageId);
    if (!room) return;
    awarenessProtocol.applyAwarenessUpdate(room.awareness, update, socketId);
    void this.redis.publish(
      `${AWARENESS_CHANNEL_PREFIX}${pageId}`,
      Buffer.from(update),
    );
  }

  async flush(pageId: string): Promise<void> {
    const room = this.rooms.get(pageId);
    if (!room) return;
    if (room.persistTimer) {
      clearTimeout(room.persistTimer);
      room.persistTimer = null;
    }
    const state = Y.encodeStateAsUpdate(room.doc);
    await this.snapshotRepository.save(pageId, state);
  }

  private async createRoom(pageId: string): Promise<RoomState> {
    const doc = new Y.Doc();
    const persisted = await this.snapshotRepository.findByPageId(pageId);
    if (persisted) {
      Y.applyUpdate(doc, persisted, 'persistence');
    }

    const awareness = new awarenessProtocol.Awareness(doc);
    const room: RoomState = {
      doc,
      awareness,
      sockets: new Set(),
      socketAwarenessIds: new Map(),
      persistTimer: null,
    };

    // Attribute every awareness clientID this room ever sees to whichever
    // local socket introduced it, so we can clean up correctly on disconnect.
    awareness.on(
      'update',
      (
        {
          added,
          updated,
          removed,
        }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (typeof origin !== 'string' || !room.sockets.has(origin)) return;
        const ids = room.socketAwarenessIds.get(origin) ?? new Set<number>();
        for (const id of [...added, ...updated]) ids.add(id);
        for (const id of removed) ids.delete(id);
        room.socketAwarenessIds.set(origin, ids);
      },
    );

    return room;
  }

  private schedulePersist(pageId: string): void {
    const room = this.rooms.get(pageId);
    if (!room || room.persistTimer) return;
    room.persistTimer = setTimeout(() => {
      room.persistTimer = null;
      this.flush(pageId).catch((error: unknown) => this.logger.error(error));
    }, PERSIST_DEBOUNCE_MS);
  }

  private scheduleEviction(pageId: string): void {
    setTimeout(() => {
      const room = this.rooms.get(pageId);
      if (!room || room.sockets.size > 0) return;
      this.flush(pageId)
        .catch((error: unknown) => this.logger.error(error))
        .finally(() => {
          const stillEmpty = this.rooms.get(pageId);
          if (stillEmpty && stillEmpty.sockets.size === 0) {
            stillEmpty.awareness.destroy();
            stillEmpty.doc.destroy();
            this.rooms.delete(pageId);
          }
        });
    }, EVICTION_GRACE_MS);
  }

  private handleRemoteSyncUpdate(pageId: string, update: Buffer): void {
    const room = this.rooms.get(pageId);
    if (!room) return; // no local clients care about this page
    Y.applyUpdate(room.doc, new Uint8Array(update), 'remote');
    this.schedulePersist(pageId);
  }

  private handleRemoteAwarenessUpdate(pageId: string, update: Buffer): void {
    const room = this.rooms.get(pageId);
    if (!room) return;
    awarenessProtocol.applyAwarenessUpdate(
      room.awareness,
      new Uint8Array(update),
      'remote',
    );
  }

  private requireRoom(pageId: string): RoomState {
    const room = this.rooms.get(pageId);
    if (!room) {
      throw new Error(`Room for page ${pageId} is not active on this instance`);
    }
    return room;
  }
}
