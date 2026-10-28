import { beforeEach, describe, expect, it } from 'vitest';

import { UserNotFoundError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { GetProfileUseCase } from './get-profile.use-case.js';
import { UpdateProfileUseCase } from './update-profile.use-case.js';

describe('profile use cases', () => {
  let userRepository: InMemoryUserRepository;
  let getProfile: GetProfileUseCase;
  let updateProfile: UpdateProfileUseCase;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    getProfile = new GetProfileUseCase(userRepository);
    updateProfile = new UpdateProfileUseCase(userRepository);

    await userRepository.save(
      User.create({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash: 'x',
      }),
    );
  });

  it('returns the profile for a known user', async () => {
    const user = await getProfile.execute({ userId: 'user-1' });
    expect(user.email).toBe('jane@example.com');
  });

  it('throws for an unknown user', async () => {
    await expect(getProfile.execute({ userId: 'missing' })).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it('updates the display name', async () => {
    const updated = await updateProfile.execute({
      userId: 'user-1',
      name: 'Jane Doe',
    });
    expect(updated.name).toBe('Jane Doe');

    const persisted = await userRepository.findById('user-1');
    expect(persisted?.name).toBe('Jane Doe');
  });
});
