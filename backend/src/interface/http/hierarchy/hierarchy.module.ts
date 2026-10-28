import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreatePageUseCase } from '../../../application/hierarchy/use-cases/create-page.use-case.js';
import { CreateProjectUseCase } from '../../../application/hierarchy/use-cases/create-project.use-case.js';
import { CreateSpaceUseCase } from '../../../application/hierarchy/use-cases/create-space.use-case.js';
import { DeletePageUseCase } from '../../../application/hierarchy/use-cases/delete-page.use-case.js';
import { DeleteProjectUseCase } from '../../../application/hierarchy/use-cases/delete-project.use-case.js';
import { DeleteSpaceUseCase } from '../../../application/hierarchy/use-cases/delete-space.use-case.js';
import { DuplicatePageUseCase } from '../../../application/hierarchy/use-cases/duplicate-page.use-case.js';
import { DuplicateProjectUseCase } from '../../../application/hierarchy/use-cases/duplicate-project.use-case.js';
import { GetHierarchyTreeUseCase } from '../../../application/hierarchy/use-cases/get-hierarchy-tree.use-case.js';
import { MovePageUseCase } from '../../../application/hierarchy/use-cases/move-page.use-case.js';
import { MoveProjectUseCase } from '../../../application/hierarchy/use-cases/move-project.use-case.js';
import { MoveSpaceUseCase } from '../../../application/hierarchy/use-cases/move-space.use-case.js';
import { RenamePageUseCase } from '../../../application/hierarchy/use-cases/rename-page.use-case.js';
import { RenameProjectUseCase } from '../../../application/hierarchy/use-cases/rename-project.use-case.js';
import { RenameSpaceUseCase } from '../../../application/hierarchy/use-cases/rename-space.use-case.js';
import { AccessService } from '../../../application/access/access.service.js';
import { SharingService } from '../../../application/access/sharing.service.js';
import { InvitationRepository } from '../../../domain/access/invitation.repository.js';
import { MembershipRepository } from '../../../domain/access/membership.repository.js';
import { DocumentSnapshotRepository } from '../../../domain/collaboration/document-snapshot.repository.js';
import { PageRepository } from '../../../domain/hierarchy/page.repository.js';
import { ProjectRepository } from '../../../domain/hierarchy/project.repository.js';
import { SpaceRepository } from '../../../domain/hierarchy/space.repository.js';
import { DocumentSnapshotEntity } from '../../../infrastructure/persistence/document-snapshot.entity.js';
import { TypeOrmDocumentSnapshotRepository } from '../../../infrastructure/persistence/document-snapshot.repository.js';
import { InvitationEntity } from '../../../infrastructure/persistence/invitation.entity.js';
import { TypeOrmInvitationRepository } from '../../../infrastructure/persistence/invitation.repository.js';
import { MembershipEntity } from '../../../infrastructure/persistence/membership.entity.js';
import { TypeOrmMembershipRepository } from '../../../infrastructure/persistence/membership.repository.js';
import { PageEntity } from '../../../infrastructure/persistence/page.entity.js';
import { TypeOrmPageRepository } from '../../../infrastructure/persistence/page.repository.js';
import { ProjectEntity } from '../../../infrastructure/persistence/project.entity.js';
import { TypeOrmProjectRepository } from '../../../infrastructure/persistence/project.repository.js';
import { SpaceEntity } from '../../../infrastructure/persistence/space.entity.js';
import { TypeOrmSpaceRepository } from '../../../infrastructure/persistence/space.repository.js';
import { AuthModule } from '../auth/auth.module.js';
import { InvitationsController } from '../sharing/invitations.controller.js';
import { SharingController } from '../sharing/sharing.controller.js';
import { HierarchyController } from './hierarchy.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpaceEntity,
      ProjectEntity,
      PageEntity,
      DocumentSnapshotEntity,
      MembershipEntity,
      InvitationEntity,
    ]),
    AuthModule,
  ],
  controllers: [HierarchyController, SharingController, InvitationsController],
  providers: [
    { provide: SpaceRepository, useClass: TypeOrmSpaceRepository },
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: PageRepository, useClass: TypeOrmPageRepository },
    {
      provide: DocumentSnapshotRepository,
      useClass: TypeOrmDocumentSnapshotRepository,
    },
    { provide: MembershipRepository, useClass: TypeOrmMembershipRepository },
    { provide: InvitationRepository, useClass: TypeOrmInvitationRepository },
    AccessService,
    SharingService,
    GetHierarchyTreeUseCase,
    CreateSpaceUseCase,
    CreateProjectUseCase,
    CreatePageUseCase,
    RenameSpaceUseCase,
    RenameProjectUseCase,
    RenamePageUseCase,
    MoveSpaceUseCase,
    MoveProjectUseCase,
    MovePageUseCase,
    DuplicateProjectUseCase,
    DuplicatePageUseCase,
    DeleteSpaceUseCase,
    DeleteProjectUseCase,
    DeletePageUseCase,
  ],
  // The collaboration gateway checks page access on `join`.
  exports: [PageRepository, AccessService],
})
export class HierarchyModule {}
