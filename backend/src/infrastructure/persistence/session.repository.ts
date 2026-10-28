import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import {
  Session,
  type SessionProps,
} from '../../domain/session/session.model.js';
import { SessionRepository } from '../../domain/session/session.repository.js';
import { SessionEntity } from './session.entity.js';

@Injectable()
export class TypeOrmSessionRepository extends SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
  ) {
    super();
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    const entity = await this.repository.findOneBy({ refreshTokenHash: hash });
    return entity ? this.toDomain(entity) : null;
  }

  async save(session: Session): Promise<void> {
    await this.repository.save(this.toEntity(session.toProps()));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllForUserExcept(
    userId: string,
    keepRefreshTokenHash: string | null,
  ): Promise<void> {
    await this.repository.update(
      {
        userId,
        revokedAt: IsNull(),
        ...(keepRefreshTokenHash
          ? { refreshTokenHash: Not(keepRefreshTokenHash) }
          : {}),
      },
      { revokedAt: new Date() },
    );
  }

  private toDomain(entity: SessionEntity): Session {
    return Session.fromProps({
      id: entity.id,
      userId: entity.userId,
      refreshTokenHash: entity.refreshTokenHash,
      userAgent: entity.userAgent,
      ipAddress: entity.ipAddress,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    });
  }

  private toEntity(props: Readonly<SessionProps>): SessionEntity {
    const entity = new SessionEntity();
    entity.id = props.id;
    entity.userId = props.userId;
    entity.refreshTokenHash = props.refreshTokenHash;
    entity.userAgent = props.userAgent;
    entity.ipAddress = props.ipAddress;
    entity.expiresAt = props.expiresAt;
    entity.revokedAt = props.revokedAt;
    entity.createdAt = props.createdAt;
    return entity;
  }
}
