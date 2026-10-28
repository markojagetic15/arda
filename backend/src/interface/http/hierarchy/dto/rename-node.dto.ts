import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

import { NODE_KINDS, type NodeKind } from '../node-kind.js';

export class RenameNodeDto {
  @IsIn(NODE_KINDS)
  kind: NodeKind;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label: string;
}
