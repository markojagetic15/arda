import { Injectable } from '@nestjs/common';

import { UserNotFoundError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string }): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }
}
