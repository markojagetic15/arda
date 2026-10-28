export class InvalidSessionError extends Error {
  constructor() {
    super('Session is invalid or expired');
    this.name = 'InvalidSessionError';
  }
}
