import { IsIn } from 'class-validator';

import { ROLES, type Role } from '../../../../domain/access/role.js';

export class ChangeRoleDto {
  @IsIn(ROLES)
  role: Role;
}
