import type { Role, ScopeType } from './role.js';

export interface MembershipProps {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  userId: string;
  role: Role;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A user's explicit access to one space, project or page. Access is inherited
 * downwards: a membership on a space covers every project and page in it.
 * The space owner needs no membership - ownership always means full access.
 */
export class Membership {
  private constructor(private props: MembershipProps) {}

  static create(props: {
    id: string;
    scopeType: ScopeType;
    scopeId: string;
    userId: string;
    role: Role;
    invitedBy?: string | null;
  }): Membership {
    const now = new Date();
    return new Membership({
      ...props,
      invitedBy: props.invitedBy ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: MembershipProps): Membership {
    return new Membership(props);
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
  get userId(): string {
    return this.props.userId;
  }
  get role(): Role {
    return this.props.role;
  }

  changeRole(role: Role): void {
    this.props.role = role;
    this.props.updatedAt = new Date();
  }

  toProps(): Readonly<MembershipProps> {
    return { ...this.props };
  }
}
