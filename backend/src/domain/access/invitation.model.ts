import type { Role, ScopeType } from './role.js';

export interface InvitationProps {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  email: string;
  role: Role;
  tokenHash: string;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * A pending invite sent by email. It is accepted through the emailed token
 * link (which proves access to the inbox) and then becomes a Membership for
 * whoever accepts it.
 */
export class Invitation {
  private constructor(private props: InvitationProps) {}

  static create(props: Omit<InvitationProps, 'createdAt'>): Invitation {
    return new Invitation({ ...props, createdAt: new Date() });
  }

  static fromProps(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  get id(): string {
    return this.props.id;
  }
  get scopeType(): ScopeType {
    return this.props.scopeType;
  }
  get scopeId(): string {
    return this.props.scopeId;
  }
  get email(): string {
    return this.props.email;
  }
  get role(): Role {
    return this.props.role;
  }
  get invitedBy(): string {
    return this.props.invitedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(now = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  toProps(): Readonly<InvitationProps> {
    return { ...this.props };
  }
}
