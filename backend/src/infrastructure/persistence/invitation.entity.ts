import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

import {
  ROLES,
  SCOPE_TYPES,
  type Role,
  type ScopeType,
} from '../../domain/access/role.js';

@Entity({ name: 'invitations' })
@Index(['scopeType', 'scopeId'])
export class InvitationEntity {
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

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'enum', enum: ROLES, enumName: 'access_role_enum' })
  role: Role;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
