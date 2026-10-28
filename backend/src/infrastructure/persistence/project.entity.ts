import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SpaceEntity } from './space.entity.js';

@Entity({ name: 'projects' })
@Index(['spaceId', 'parentId', 'position'])
export class ProjectEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ name: 'space_id', type: 'uuid' })
  spaceId: string;

  @ManyToOne(() => SpaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: SpaceEntity;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ProjectEntity | null;

  @Column({ type: 'integer' })
  position: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
