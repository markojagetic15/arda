import type { DocumentSnapshotRepository } from '../../domain/collaboration/document-snapshot.repository.js';
import type { Page } from '../../domain/hierarchy/page.model.js';

/**
 * Copies each source page's saved content onto its clone, so duplicates open
 * with the same document/canvas/board instead of empty. `sources[i]` must be
 * the page `clones[i]` was cloned from (the clone helpers preserve order).
 */
export async function copySnapshots(
  snapshots: DocumentSnapshotRepository,
  sources: Page[],
  clones: Page[],
): Promise<void> {
  await Promise.all(
    sources.map(async (source, index) => {
      const state = await snapshots.findByPageId(source.id);
      if (state) await snapshots.save(clones[index].id, state);
    }),
  );
}
