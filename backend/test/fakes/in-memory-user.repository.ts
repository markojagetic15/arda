import { User } from '../../src/domain/user/user.model.js';
import { UserRepository } from '../../src/domain/user/user.repository.js';

export class InMemoryUserRepository extends UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findByPasswordResetTokenHash(hash: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.toProps().passwordResetTokenHash === hash) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
}
