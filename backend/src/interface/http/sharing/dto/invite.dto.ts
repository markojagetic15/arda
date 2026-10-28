import { IsEmail, IsIn, MaxLength } from 'class-validator';

import { ROLES, type Role } from '../../../../domain/access/role.js';

export class InviteDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(255)
  email: string;

  @IsIn(ROLES)
  role: Role;
}
