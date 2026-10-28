import { Injectable } from '@nestjs/common';

import { PasswordHasher } from '../../../domain/shared/ports/password-hasher.port.js';
import { InvalidCredentialsError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import {
  IssuedSession,
  IssueSessionUseCase,
} from './issue-session.use-case.js';

export interface LoginResult extends IssuedSession {
  user: User;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly issueSession: IssueSessionUseCase,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const session = await this.issueSession.execute({
      user,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return { user, ...session };
  }
}
