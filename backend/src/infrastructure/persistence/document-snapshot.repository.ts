import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DocumentSnapshotRepository } from '../../domain/collaboration/document-snapshot.repository.js';
import { DocumentSnapshotEntity } from './document-snapshot.entity.js';

@Injectable()
export class TypeOrmDocumentSnapshotRepository extends DocumentSnapshotRepository {
  constructor(
    @InjectRepository(DocumentSnapshotEntity)
    private readonly repository: Repository<DocumentSnapshotEntity>,
  ) {
    super();
  }

  async findByPageId(pageId: string): Promise<Uint8Array | null> {
    const entity = await this.repository.findOneBy({ pageId });
    return entity ? new Uint8Array(entity.state) : null;
  }

  async save(pageId: string, state: Uint8Array): Promise<void> {
    await this.repository.save({ pageId, state: Buffer.from(state) });
  }
}
