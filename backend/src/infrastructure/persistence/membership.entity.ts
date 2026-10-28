import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import {
  ROLES,
  SCOPE_TYPES,
  type Role,
  type ScopeType,
} from '../../domain/access/role.js';

@Entity({ name: 'memberships' })
@Unique('UQ_memberships_scope_user', ['scopeType', 'scopeId', 'userId'])
export class MembershipEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'scope_type',
    type: 'enum',
    enum: SCOPE_TYPES,
    enumName: 'scope_type_enum',
  })
  scopeType: ScopeType;

  @Column({ name: 'scope_id', type: 'uuid' })
  scopeId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ROLES, enumName: 'access_role_enum' })
  role: Role;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
