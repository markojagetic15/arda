import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User, type UserProps } from '../../domain/user/user.model.js';
import { UserRepository } from '../../domain/user/user.repository.js';
import { UserEntity } from './user.entity.js';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({ email });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const entities = await this.repository.find({ where: { id: In(ids) } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByEmailVerificationTokenHash(hash: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({
      emailVerificationTokenHash: hash,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPasswordResetTokenHash(hash: string): Promise<User | null> {
    const entity = await this.repository.findOneBy({
      passwordResetTokenHash: hash,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    await this.repository.save(this.toEntity(user.toProps()));
  }

  private toDomain(entity: UserEntity): User {
    return User.fromProps({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      passwordHash: entity.passwordHash,
      passwordResetTokenHash: entity.passwordResetTokenHash,
      passwordResetTokenExpiresAt: entity.passwordResetTokenExpiresAt,
      emailVerifiedAt: entity.emailVerifiedAt,
      emailVerificationTokenHash: entity.emailVerificationTokenHash,
      emailVerificationExpiresAt: entity.emailVerificationExpiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(props: Readonly<UserProps>): UserEntity {
    const entity = new UserEntity();
    entity.id = props.id;
    entity.email = props.email;
    entity.name = props.name;
    entity.passwordHash = props.passwordHash;
    entity.passwordResetTokenHash = props.passwordResetTokenHash;
    entity.passwordResetTokenExpiresAt = props.passwordResetTokenExpiresAt;
    entity.emailVerifiedAt = props.emailVerifiedAt;
    entity.emailVerificationTokenHash = props.emailVerificationTokenHash;
    entity.emailVerificationExpiresAt = props.emailVerificationExpiresAt;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;
    return entity;
  }
}
