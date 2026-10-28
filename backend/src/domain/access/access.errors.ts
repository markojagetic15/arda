export class AccessDeniedError extends Error {
  constructor(message = "You don't have permission to do that") {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export class InvitationNotFoundError extends Error {
  constructor() {
    super('This invitation is invalid or has expired');
    this.name = 'InvitationNotFoundError';
  }
}

export class InvalidShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidShareError';
  }
}
