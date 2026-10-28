export abstract class Mailer {
  abstract sendPasswordResetEmail(input: {
    to: string;
    resetUrl: string;
  }): Promise<void>;
}
