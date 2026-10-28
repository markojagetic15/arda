import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Membership } from '../../domain/access/membership.model.js';
import { MembershipRepository } from '../../domain/access/membership.repository.js';
import type { Scope, ScopeType } from '../../domain/access/role.js';
import { MembershipEntity } from './membership.entity.js';

@Injectable()
export class TypeOrmMembershipRepository extends MembershipRepository {
  constructor(
    @InjectRepository(MembershipEntity)
    private readonly repository: Repository<MembershipEntity>,
  ) {
    super();
  }

  async findForUserOnScopes(
    userId: string,
    scopes: Scope[],
  ): Promise<Membership[]> {
    if (scopes.length === 0) return [];
    const entities = await this.repository.find({
      where: scopes.map((scope) => ({
        userId,
        scopeType: scope.type,
        scopeId: scope.id,
      })),
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findForUser(userId: string): Promise<Membership[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findForScopes(scopes: Scope[]): Promise<Membership[]> {
    if (scopes.length === 0) return [];
    const entities = await this.repository.find({
      where: scopes.map((scope) => ({
        scopeType: scope.type,
        scopeId: scope.id,
      })),
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findOne(
    scopeType: ScopeType,
    scopeId: string,
    userId: string,
  ): Promise<Membership | null> {
    const entity = await this.repository.findOneBy({
      scopeType,
      scopeId,
      userId,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(membership: Membership): Promise<void> {
    await this.repository.save(
      Object.assign(new MembershipEntity(), membership.toProps()),
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(entity: MembershipEntity): Membership {
    return Membership.fromProps({
      id: entity.id,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      userId: entity.userId,
      role: entity.role,
      invitedBy: entity.invitedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
