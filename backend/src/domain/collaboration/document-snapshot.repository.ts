/**
 * Persists the latest merged Yjs CRDT state for a page. The state is an
 * opaque binary blob (`Y.encodeStateAsUpdate(doc)`) — this repository never
 * interprets it, it only stores and returns bytes.
 */
export abstract class DocumentSnapshotRepository {
  abstract findByPageId(pageId: string): Promise<Uint8Array | null>;
  abstract save(pageId: string, state: Uint8Array): Promise<void>;
}
