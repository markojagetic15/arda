import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invitation } from '../../domain/access/invitation.model.js';
import { InvitationRepository } from '../../domain/access/invitation.repository.js';
import type { ScopeType } from '../../domain/access/role.js';
import { InvitationEntity } from './invitation.entity.js';

@Injectable()
export class TypeOrmInvitationRepository extends InvitationRepository {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly repository: Repository<InvitationEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Invitation | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTokenHash(hash: string): Promise<Invitation | null> {
    const entity = await this.repository.findOneBy({ tokenHash: hash });
    return entity ? this.toDomain(entity) : null;
  }

  async findForScope(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<Invitation[]> {
    const entities = await this.repository.find({
      where: { scopeType, scopeId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findPending(
    scopeType: ScopeType,
    scopeId: string,
    email: string,
  ): Promise<Invitation | null> {
    const entity = await this.repository.findOneBy({
      scopeType,
      scopeId,
      email,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(invitation: Invitation): Promise<void> {
    await this.repository.save(
      Object.assign(new InvitationEntity(), invitation.toProps()),
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(entity: InvitationEntity): Invitation {
    return Invitation.fromProps({
      id: entity.id,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      email: entity.email,
      role: entity.role,
      tokenHash: entity.tokenHash,
      invitedBy: entity.invitedBy,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });
  }
}
