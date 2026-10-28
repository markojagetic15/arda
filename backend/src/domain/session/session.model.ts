export interface SessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class Session {
  private constructor(private props: SessionProps) {}

  static create(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
  }): Session {
    return new Session({
      ...props,
      userAgent: props.userAgent ?? null,
      ipAddress: props.ipAddress ?? null,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static fromProps(props: SessionProps): Session {
    return new Session(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(now = new Date()): boolean {
    return (
      this.props.revokedAt === null &&
      this.props.expiresAt.getTime() > now.getTime()
    );
  }

  revoke(): void {
    this.props.revokedAt = new Date();
  }

  rotate(newRefreshTokenHash: string, newExpiresAt: Date): void {
    this.props.refreshTokenHash = newRefreshTokenHash;
    this.props.expiresAt = newExpiresAt;
  }

  toProps(): Readonly<SessionProps> {
    return { ...this.props };
  }
}
