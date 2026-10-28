export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`Email ${email} is already in use`);
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidOrExpiredResetTokenError extends Error {
  constructor(message = 'Invalid or expired password reset token') {
    super(message);
    this.name = 'InvalidOrExpiredResetTokenError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Current password is incorrect');
    this.name = 'IncorrectPasswordError';
  }
}
