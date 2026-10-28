import type { User } from '../../../domain/user/user.model.js';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}
