export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export abstract class Mailer {
  abstract send(message: EmailMessage): Promise<void>;
}
