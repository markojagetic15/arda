import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PageType } from '../../domain/hierarchy/page-type.js';
import { ProjectEntity } from './project.entity.js';

@Entity({ name: 'pages' })
@Index(['projectId', 'parentId', 'position'])
export class PageEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'enum', enum: PageType, default: PageType.DOCUMENT })
  type: PageType;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  project: ProjectEntity;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index()
  parentId: string | null;

  @ManyToOne(() => PageEntity, { onDelete: 'CASCADE', nullable: true })
  parent: PageEntity | null;

  @Column({ type: 'integer' })
  position: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
