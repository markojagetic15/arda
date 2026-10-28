export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export abstract class TokenService {
  abstract signAccessToken(payload: AccessTokenPayload): string;
  abstract verifyAccessToken(token: string): AccessTokenPayload;
}
