import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreatePageDto } from './dto/create-page.dto.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { CreateSpaceDto } from './dto/create-space.dto.js';
import { DeleteNodeQueryDto } from './dto/delete-node-query.dto.js';
import { DuplicateNodeDto } from './dto/duplicate-node.dto.js';
import { MoveNodeDto } from './dto/move-node.dto.js';
import { RenameNodeDto } from './dto/rename-node.dto.js';
import {
  type HierarchyNodeDto,
  presentPage,
  presentProject,
  presentSpace,
} from './hierarchy-node.presenter.js';

/**
 * Exposes the Space → Project → Page tree as one flat list of uniform nodes
 * (see `hierarchy-node.presenter.ts`). Node-level routes take the node's
 * `kind` alongside its id and dispatch to the matching use case.
 */
@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
export class HierarchyController {
  constructor(
    private readonly getHierarchyTree: GetHierarchyTreeUseCase,
    private readonly createSpace: CreateSpaceUseCase,
    private readonly createProject: CreateProjectUseCase,
    private readonly createPage: CreatePageUseCase,
    private readonly renameSpace: RenameSpaceUseCase,
    private readonly renameProject: RenameProjectUseCase,
    private readonly renamePage: RenamePageUseCase,
    private readonly moveSpace: MoveSpaceUseCase,
    private readonly moveProject: MoveProjectUseCase,
    private readonly movePage: MovePageUseCase,
    private readonly duplicateProject: DuplicateProjectUseCase,
    private readonly duplicatePage: DuplicatePageUseCase,
    private readonly deleteSpace: DeleteSpaceUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
    private readonly deletePage: DeletePageUseCase,
  ) {}

  @Get('tree')
  async tree(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ nodes: HierarchyNodeDto[] }> {
    const tree = await this.getHierarchyTree.execute({ ownerId: user.userId });
    return {
      nodes: [
        ...tree.spaces.map((space) =>
          presentSpace(space, tree.roles.get(space.id)),
        ),
        ...tree.projects.map((project) =>
          presentProject(project, tree.roles.get(project.id)),
        ),
        ...tree.pages.map((page) => presentPage(page, tree.roles.get(page.id))),
      ],
    };
  }

  @Post('spaces')
  async createSpaceNode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSpaceDto,
  ): Promise<HierarchyNodeDto> {
    const space = await this.createSpace.execute({
      ownerId: user.userId,
      name: dto.name,
    });
    return presentSpace(space, 'full');
  }

  @Post('projects')
  async createProjectNode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ): Promise<{ project: HierarchyNodeDto; pages: HierarchyNodeDto[] }> {
    const result = await this.createProject.execute({
      ownerId: user.userId,
      spaceId: dto.spaceId,
      name: dto.name,
    });
    return {
      project: presentProject(result.project),
      pages: result.pages.map((page) => presentPage(page)),
    };
  }

  @Post('pages')
  async createPageNode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePageDto,
  ): Promise<HierarchyNodeDto> {
    const page = await this.createPage.execute({
      ownerId: user.userId,
      parentId: dto.parentId,
      title: dto.title,
      type: dto.type,
    });
    return presentPage(page);
  }

  @Patch('nodes/:id/rename')
  async rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameNodeDto,
  ): Promise<HierarchyNodeDto> {
    const ownerId = user.userId;
    switch (dto.kind) {
      case 'space':
        return presentSpace(
          await this.renameSpace.execute({
            ownerId,
            spaceId: id,
            name: dto.label,
          }),
        );
      case 'project':
        return presentProject(
          await this.renameProject.execute({
            ownerId,
            projectId: id,
            name: dto.label,
          }),
        );
      case 'page':
        return presentPage(
          await this.renamePage.execute({
            ownerId,
            pageId: id,
            title: dto.label,
          }),
        );
    }
  }

  @Patch('nodes/:id/move')
  async move(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveNodeDto,
  ): Promise<HierarchyNodeDto> {
    const ownerId = user.userId;
    if (dto.kind === 'space') {
      return presentSpace(
        await this.moveSpace.execute({
          ownerId,
          spaceId: id,
          index: dto.index,
        }),
      );
    }
    if (!dto.targetParentId) {
      throw new BadRequestException('targetParentId is required');
    }
    if (dto.kind === 'project') {
      return presentProject(
        await this.moveProject.execute({
          ownerId,
          projectId: id,
          targetSpaceId: dto.targetParentId,
          index: dto.index,
        }),
      );
    }
    return presentPage(
      await this.movePage.execute({
        ownerId,
        pageId: id,
        targetParentId: dto.targetParentId,
        index: dto.index,
      }),
    );
  }

  @Post('nodes/:id/duplicate')
  async duplicate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateNodeDto,
  ): Promise<{ nodes: HierarchyNodeDto[] }> {
    const ownerId = user.userId;
    if (dto.kind === 'project') {
      const result = await this.duplicateProject.execute({
        ownerId,
        projectId: id,
      });
      return {
        nodes: [
          presentProject(result.project),
          ...result.pages.map((page) => presentPage(page)),
        ],
      };
    }
    const pages = await this.duplicatePage.execute({ ownerId, pageId: id });
    return { nodes: pages.map((page) => presentPage(page)) };
  }

  @Delete('nodes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteNodeQueryDto,
  ): Promise<void> {
    const ownerId = user.userId;
    switch (query.kind) {
      case 'space':
        return this.deleteSpace.execute({ ownerId, spaceId: id });
      case 'project':
        return this.deleteProject.execute({ ownerId, projectId: id });
      case 'page':
        return this.deletePage.execute({ ownerId, pageId: id });
    }
  }
}
