import type { User } from './user.model.js';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByPasswordResetTokenHash(hash: string): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}
