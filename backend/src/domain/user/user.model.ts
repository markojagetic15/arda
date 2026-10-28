export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordResetTokenHash: string | null;
  passwordResetTokenExpiresAt: Date | null;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
  }): User {
    const now = new Date();
    return new User({
      ...props,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
      emailVerifiedAt: null,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get passwordResetTokenExpiresAt(): Date | null {
    return this.props.passwordResetTokenExpiresAt;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  changePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.props.passwordResetTokenHash = null;
    this.props.passwordResetTokenExpiresAt = null;
    this.props.updatedAt = new Date();
  }

  setEmailVerificationToken(tokenHash: string, expiresAt: Date): void {
    this.props.emailVerificationTokenHash = tokenHash;
    this.props.emailVerificationExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  isEmailVerificationTokenValid(now = new Date()): boolean {
    return (
      this.props.emailVerificationTokenHash !== null &&
      this.props.emailVerificationExpiresAt !== null &&
      this.props.emailVerificationExpiresAt.getTime() > now.getTime()
    );
  }

  /** Marks the address as confirmed (the user proved access to the inbox). */
  markEmailVerified(): void {
    this.props.emailVerifiedAt ??= new Date();
    this.props.emailVerificationTokenHash = null;
    this.props.emailVerificationExpiresAt = null;
    this.props.updatedAt = new Date();
  }

  setPasswordResetToken(tokenHash: string, expiresAt: Date): void {
    this.props.passwordResetTokenHash = tokenHash;
    this.props.passwordResetTokenExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  /**
   * Callers must look the user up by the reset token hash first (a query the
   * repository indexes on) - this only checks that the token found hasn't expired.
   */
  isPasswordResetTokenValid(now = new Date()): boolean {
    return (
      this.props.passwordResetTokenHash !== null &&
      this.props.passwordResetTokenExpiresAt !== null &&
      this.props.passwordResetTokenExpiresAt.getTime() > now.getTime()
    );
  }

  toProps(): Readonly<UserProps> {
    return { ...this.props };
  }
}
