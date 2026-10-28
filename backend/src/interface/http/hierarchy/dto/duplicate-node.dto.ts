import { IsIn } from 'class-validator';

export class DuplicateNodeDto {
  @IsIn(['project', 'page'])
  kind: 'project' | 'page';
}
