import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryMembershipRepository } from '../../../../test/fakes/in-memory-membership.repository.js';
import { InMemoryPageRepository } from '../../../../test/fakes/in-memory-page.repository.js';
import { InMemoryProjectRepository } from '../../../../test/fakes/in-memory-project.repository.js';
import { InMemorySpaceRepository } from '../../../../test/fakes/in-memory-space.repository.js';
import { POSITION_GAP } from '../../../domain/hierarchy/position.js';
import { AccessService } from '../../access/access.service.js';
import { CreateSpaceUseCase } from './create-space.use-case.js';
import { MoveSpaceUseCase } from './move-space.use-case.js';

describe('Space use cases', () => {
  let spaceRepository: InMemorySpaceRepository;
  let createSpace: CreateSpaceUseCase;
  let moveSpace: MoveSpaceUseCase;
  const ownerId = 'owner-1';

  beforeEach(() => {
    spaceRepository = new InMemorySpaceRepository();
    createSpace = new CreateSpaceUseCase(spaceRepository);
    const projectRepository = new InMemoryProjectRepository(spaceRepository);
    const access = new AccessService(
      spaceRepository,
      projectRepository,
      new InMemoryPageRepository(projectRepository),
      new InMemoryMembershipRepository(),
    );
    moveSpace = new MoveSpaceUseCase(spaceRepository, access);
  });

  it('appends new spaces with an evenly gapped position', async () => {
    const a = await createSpace.execute({ ownerId, name: 'A' });
    const b = await createSpace.execute({ ownerId, name: 'B' });
    expect(a.position).toBe(POSITION_GAP);
    expect(b.position).toBe(2 * POSITION_GAP);
  });

  it('reorders a space among its siblings', async () => {
    const a = await createSpace.execute({ ownerId, name: 'A' });
    await createSpace.execute({ ownerId, name: 'B' });
    const c = await createSpace.execute({ ownerId, name: 'C' });

    // move C to the front
    await moveSpace.execute({ ownerId, spaceId: c.id, index: 0 });

    const ordered = await spaceRepository.findRootSiblings(ownerId);
    expect(ordered.map((space) => space.name)).toEqual(['C', 'A', 'B']);
    expect(ordered[0].position).toBeLessThan(a.position);
  });

  it('rebalances every sibling once repeated insertions exhaust the gap between two of them', async () => {
    await createSpace.execute({ ownerId, name: 'A' });
    await createSpace.execute({ ownerId, name: 'B' });

    // Each new space is appended at the end, then squeezed in right after A - // bisecting the same shrinking gap (between A and the current runner-up)
    // over and over until it's exhausted and a rebalance must kick in.
    for (let i = 0; i < 20; i++) {
      const space = await createSpace.execute({ ownerId, name: `X${i}` });
      await moveSpace.execute({ ownerId, spaceId: space.id, index: 1 });
    }

    const ordered = await spaceRepository.findRootSiblings(ownerId);
    expect(ordered).toHaveLength(22);
    expect(ordered[0].name).toBe('A');
    expect(ordered.at(-1)!.name).toBe('B');

    // Positions must stay strictly increasing and distinct throughout, even
    // though several rebalances happened along the way.
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].position).toBeGreaterThan(ordered[i - 1].position);
    }
  });
});
