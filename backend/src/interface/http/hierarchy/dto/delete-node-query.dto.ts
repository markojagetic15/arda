import { IsIn } from 'class-validator';

import { NODE_KINDS, type NodeKind } from '../node-kind.js';

export class DeleteNodeQueryDto {
  @IsIn(NODE_KINDS)
  kind: NodeKind;
}
