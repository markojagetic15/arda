import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomManagerService } from '../../../application/collaboration/room-manager.service.js';
import { CreateCommentUseCase } from '../../../application/comment/use-cases/create-comment.use-case.js';
import { ListCommentsForPageUseCase } from '../../../application/comment/use-cases/list-comments-for-page.use-case.js';
import { ResolveCommentUseCase } from '../../../application/comment/use-cases/resolve-comment.use-case.js';
import { AuthModule } from '../../http/auth/auth.module.js';
import { CommentRepository } from '../../../domain/comment/comment.repository.js';
import { DocumentSnapshotRepository } from '../../../domain/collaboration/document-snapshot.repository.js';
import { HierarchyModule } from '../../http/hierarchy/hierarchy.module.js';
import { CommentEntity } from '../../../infrastructure/persistence/comment.entity.js';
import { TypeOrmCommentRepository } from '../../../infrastructure/persistence/comment.repository.js';
import { DocumentSnapshotEntity } from '../../../infrastructure/persistence/document-snapshot.entity.js';
import { TypeOrmDocumentSnapshotRepository } from '../../../infrastructure/persistence/document-snapshot.repository.js';
import { CollaborationGateway } from './collaboration.gateway.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentSnapshotEntity, CommentEntity]),
    AuthModule,
    HierarchyModule,
  ],
  providers: [
    {
      provide: DocumentSnapshotRepository,
      useClass: TypeOrmDocumentSnapshotRepository,
    },
    { provide: CommentRepository, useClass: TypeOrmCommentRepository },
    RoomManagerService,
    CreateCommentUseCase,
    ListCommentsForPageUseCase,
    ResolveCommentUseCase,
    CollaborationGateway,
  ],
})
export class CollaborationModule {}
