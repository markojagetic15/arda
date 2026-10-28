import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PasswordHasher } from '../../../domain/shared/ports/password-hasher.port.js';
import { EmailAlreadyInUseError } from '../../../domain/user/user.errors.js';
import { User } from '../../../domain/user/user.model.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import { SendEmailVerificationUseCase } from '../../user/use-cases/send-email-verification.use-case.js';
import {
  IssuedSession,
  IssueSessionUseCase,
} from './issue-session.use-case.js';

export interface RegisterUserResult extends IssuedSession {
  user: User;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly issueSession: IssueSessionUseCase,
    private readonly sendEmailVerification: SendEmailVerificationUseCase,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    name: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<RegisterUserResult> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError(email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      id: randomUUID(),
      email,
      name: input.name,
      passwordHash,
    });
    await this.userRepository.save(user);
    await this.sendEmailVerification.execute(user);

    const session = await this.issueSession.execute({
      user,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return { user, ...session };
  }
}
