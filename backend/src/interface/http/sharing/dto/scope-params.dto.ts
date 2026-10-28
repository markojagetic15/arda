import { IsIn, IsUUID } from 'class-validator';

import { SCOPE_TYPES, type ScopeType } from '../../../../domain/access/role.js';

export class ScopeParamsDto {
  @IsIn(SCOPE_TYPES)
  type: ScopeType;

  @IsUUID()
  id: string;
}

export class MemberParamsDto extends ScopeParamsDto {
  @IsUUID()
  userId: string;
}
