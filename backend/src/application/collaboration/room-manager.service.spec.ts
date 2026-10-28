import type { Redis } from 'ioredis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Y from 'yjs';

import { FakeRedisClient } from '../../../test/fakes/fake-redis-client.js';
import { InMemoryDocumentSnapshotRepository } from '../../../test/fakes/in-memory-document-snapshot.repository.js';
import { RoomManagerService } from './room-manager.service.js';

function makeYUpdate(mutate: (doc: Y.Doc) => void): Uint8Array {
  const doc = new Y.Doc();
  mutate(doc);
  return Y.encodeStateAsUpdate(doc);
}

describe('RoomManagerService', () => {
  let snapshotRepository: InMemoryDocumentSnapshotRepository;
  let redis: FakeRedisClient;
  let roomManager: RoomManagerService;

  beforeEach(async () => {
    snapshotRepository = new InMemoryDocumentSnapshotRepository();
    redis = new FakeRedisClient();
    roomManager = new RoomManagerService(
      snapshotRepository,
      redis as unknown as Redis,
    );
    await roomManager.onModuleInit();
  });

  afterEach(async () => {
    await roomManager.onModuleDestroy();
    vi.useRealTimers();
  });

  it('hydrates a new room from a persisted snapshot', async () => {
    const persisted = makeYUpdate((doc) =>
      doc.getText('body').insert(0, 'hello'),
    );
    await snapshotRepository.save('page-1', persisted);

    await roomManager.joinRoom('page-1', 'socket-1');

    const state = roomManager.getStateUpdate('page-1');
    const doc = new Y.Doc();
    Y.applyUpdate(doc, state);
    expect(doc.getText('body').toString()).toBe('hello');
  });

  it('applies a local sync update and republishes it for other instances', async () => {
    await roomManager.joinRoom('page-1', 'socket-1');
    const update = makeYUpdate((doc) => doc.getText('body').insert(0, 'hi'));

    roomManager.applyLocalSyncUpdate('page-1', update);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, roomManager.getStateUpdate('page-1'));
    expect(doc.getText('body').toString()).toBe('hi');

    expect(redis.published).toHaveLength(1);
    expect(redis.published[0].channel).toBe('yjs-update:page-1');
  });

  it('applies a remote (Redis-relayed) sync update only when the room is active locally', async () => {
    const update = makeYUpdate((doc) =>
      doc.getText('body').insert(0, 'from-elsewhere'),
    );

    // No local clients for "page-ignored" - the message should be dropped.
    redis.emitRemoteMessage('yjs-update:page-ignored', Buffer.from(update));
    expect(snapshotRepository.saveCalls).toHaveLength(0);

    // "page-1" is active locally - the update should be merged in.
    await roomManager.joinRoom('page-1', 'socket-1');
    redis.emitRemoteMessage('yjs-update:page-1', Buffer.from(update));

    const doc = new Y.Doc();
    Y.applyUpdate(doc, roomManager.getStateUpdate('page-1'));
    expect(doc.getText('body').toString()).toBe('from-elsewhere');
  });

  it('tracks which awareness clientIDs came from which socket and cleans them up on leave', async () => {
    await roomManager.joinRoom('page-1', 'socket-1');

    const localAwareness = new awarenessProtocol.Awareness(new Y.Doc());
    localAwareness.setLocalState({ user: { name: 'Ada' } });
    const clientId = localAwareness.clientID;
    const update = awarenessProtocol.encodeAwarenessUpdate(localAwareness, [
      clientId,
    ]);

    roomManager.applyLocalAwarenessUpdate('page-1', update, 'socket-1');

    const decoded = new Y.Doc();
    const serverSideAwareness = new awarenessProtocol.Awareness(decoded);
    awarenessProtocol.applyAwarenessUpdate(
      serverSideAwareness,
      roomManager.getAwarenessUpdate('page-1'),
      'test',
    );
    expect(serverSideAwareness.getStates().has(clientId)).toBe(true);

    const removalUpdate = roomManager.leaveRoom('page-1', 'socket-1');
    expect(removalUpdate).not.toBeNull();

    // A fresh room (rejoin) should no longer carry that client's awareness state.
    await roomManager.joinRoom('page-1', 'socket-2');
    const afterLeave = new awarenessProtocol.Awareness(new Y.Doc());
    awarenessProtocol.applyAwarenessUpdate(
      afterLeave,
      roomManager.getAwarenessUpdate('page-1'),
      'test',
    );
    expect(afterLeave.getStates().has(clientId)).toBe(false);
  });

  it('debounces persistence - rapid updates only flush once', async () => {
    vi.useFakeTimers();
    await roomManager.joinRoom('page-1', 'socket-1');

    roomManager.applyLocalSyncUpdate(
      'page-1',
      makeYUpdate((doc) => doc.getText('t').insert(0, 'a')),
    );
    roomManager.applyLocalSyncUpdate(
      'page-1',
      makeYUpdate((doc) => doc.getText('t').insert(0, 'b')),
    );
    roomManager.applyLocalSyncUpdate(
      'page-1',
      makeYUpdate((doc) => doc.getText('t').insert(0, 'c')),
    );

    expect(snapshotRepository.saveCalls).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(2_100);

    expect(snapshotRepository.saveCalls).toHaveLength(1);
  });

  it('flushes and evicts an empty room after the grace period', async () => {
    vi.useFakeTimers();
    await roomManager.joinRoom('page-1', 'socket-1');
    roomManager.applyLocalSyncUpdate(
      'page-1',
      makeYUpdate((doc) => doc.getText('t').insert(0, 'x')),
    );

    roomManager.leaveRoom('page-1', 'socket-1');
    await vi.advanceTimersByTimeAsync(10_100);

    expect(snapshotRepository.saveCalls.length).toBeGreaterThanOrEqual(1);
    const persisted = await snapshotRepository.findByPageId('page-1');
    const doc = new Y.Doc();
    Y.applyUpdate(doc, persisted!);
    expect(doc.getText('t').toString()).toBe('x');
  });
});
