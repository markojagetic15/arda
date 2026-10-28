import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { CommentAnchorType } from '../../domain/comment/comment-anchor-type.js';
import { PageEntity } from './page.entity.js';

@Entity({ name: 'comments' })
@Index(['pageId', 'anchorType', 'anchorId'])
export class CommentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'page_id', type: 'uuid' })
  pageId: string;

  @ManyToOne(() => PageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: PageEntity;

  @Column({ name: 'anchor_type', type: 'enum', enum: CommentAnchorType })
  anchorType: CommentAnchorType;

  @Column({ name: 'anchor_id' })
  anchorId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'author_name', length: 200 })
  authorName: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
