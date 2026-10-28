import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PageType } from '../../../../domain/hierarchy/page-type.js';

export class CreatePageDto {
  /** Either a project id (creates a root page) or a page id (creates a sub-page). */
  @IsUUID()
  parentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(PageType)
  type?: PageType;
}
