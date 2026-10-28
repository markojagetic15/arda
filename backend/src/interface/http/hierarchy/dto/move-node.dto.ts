import { IsIn, IsInt, IsUUID, Min, ValidateIf } from 'class-validator';

import { NODE_KINDS, type NodeKind } from '../node-kind.js';

export class MoveNodeDto {
  @IsIn(NODE_KINDS)
  kind: NodeKind;

  /** Null only when `kind` is 'space' - spaces only ever reorder among root spaces. */
  @ValidateIf((dto: MoveNodeDto) => dto.kind !== 'space')
  @IsUUID()
  targetParentId: string | null;

  @IsInt()
  @Min(0)
  index: number;
}
