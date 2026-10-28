import { Injectable } from '@nestjs/common';

import { UserNotFoundError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string; name: string }): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    user.rename(input.name);
    await this.userRepository.save(user);
    return user;
  }
}
