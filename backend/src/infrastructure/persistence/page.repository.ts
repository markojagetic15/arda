import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { Page, type PageProps } from '../../domain/hierarchy/page.model.js';
import { PageRepository } from '../../domain/hierarchy/page.repository.js';
import { PageEntity } from './page.entity.js';

@Injectable()
export class TypeOrmPageRepository extends PageRepository {
  constructor(
    @InjectRepository(PageEntity)
    private readonly repository: Repository<PageEntity>,
  ) {
    super();
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Page | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { project: { space: true } },
    });
    if (!entity || entity.project.space.ownerId !== ownerId) {
      return null;
    }
    return this.toDomain(entity);
  }

  async findById(id: string): Promise<Page | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    if (ids.length === 0) return [];
    const entities = await this.repository.find({ where: { id: In(ids) } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findSiblings(
    projectId: string,
    parentId: string | null,
  ): Promise<Page[]> {
    const entities = await this.repository.find({
      where: { projectId, parentId: parentId === null ? IsNull() : parentId },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllForProjects(projectIds: string[]): Promise<Page[]> {
    if (projectIds.length === 0) return [];
    const entities = await this.repository.find({
      where: { projectId: In(projectIds) },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findChildrenIds(parentIds: string[]): Promise<string[]> {
    if (parentIds.length === 0) return [];
    const entities = await this.repository.find({
      where: { parentId: In(parentIds) },
      select: { id: true },
    });
    return entities.map((entity) => entity.id);
  }

  async save(page: Page): Promise<void> {
    await this.repository.save(this.toEntity(page.toProps()));
  }

  async saveMany(pages: Page[]): Promise<void> {
    await this.repository.save(
      pages.map((page) => this.toEntity(page.toProps())),
    );
  }

  async reassignProjectForIds(
    ids: string[],
    newProjectId: string,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.repository.update({ id: In(ids) }, { projectId: newProjectId });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(entity: PageEntity): Page {
    return Page.fromProps({
      id: entity.id,
      title: entity.title,
      type: entity.type,
      projectId: entity.projectId,
      parentId: entity.parentId,
      position: entity.position,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(props: Readonly<PageProps>): PageEntity {
    const entity = new PageEntity();
    entity.id = props.id;
    entity.title = props.title;
    entity.type = props.type;
    entity.projectId = props.projectId;
    entity.parentId = props.parentId;
    entity.position = props.position;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;
    return entity;
  }
}
