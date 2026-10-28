import { DocumentSnapshotRepository } from '../../src/domain/collaboration/document-snapshot.repository.js';

export class InMemoryDocumentSnapshotRepository extends DocumentSnapshotRepository {
  private readonly snapshots = new Map<string, Uint8Array>();
  public saveCalls: { pageId: string; state: Uint8Array }[] = [];

  async findByPageId(pageId: string): Promise<Uint8Array | null> {
    return this.snapshots.get(pageId) ?? null;
  }

  async save(pageId: string, state: Uint8Array): Promise<void> {
    this.snapshots.set(pageId, state);
    this.saveCalls.push({ pageId, state });
  }
}
