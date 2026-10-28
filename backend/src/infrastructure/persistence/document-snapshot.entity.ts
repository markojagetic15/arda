import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PageEntity } from './page.entity.js';

@Entity({ name: 'document_snapshots' })
export class DocumentSnapshotEntity {
  @PrimaryColumn('uuid', { name: 'page_id' })
  pageId: string;

  @OneToOne(() => PageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: PageEntity;

  @Column({ type: 'bytea' })
  state: Buffer;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
