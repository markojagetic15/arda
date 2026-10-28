import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import {
  Project,
  type ProjectProps,
} from '../../domain/hierarchy/project.model.js';
import { ProjectRepository } from '../../domain/hierarchy/project.repository.js';
import { ProjectEntity } from './project.entity.js';

@Injectable()
export class TypeOrmProjectRepository extends ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
  ) {
    super();
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Project | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: { space: true },
    });
    if (!entity || entity.space.ownerId !== ownerId) {
      return null;
    }
    return this.toDomain(entity);
  }

  async findSiblings(spaceId: string): Promise<Project[]> {
    const entities = await this.repository.find({
      where: { spaceId, parentId: IsNull() },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllForSpaces(spaceIds: string[]): Promise<Project[]> {
    if (spaceIds.length === 0) return [];
    const entities = await this.repository.find({
      where: { spaceId: In(spaceIds) },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(project: Project): Promise<void> {
    await this.repository.save(this.toEntity(project.toProps()));
  }

  async saveMany(projects: Project[]): Promise<void> {
    await this.repository.save(
      projects.map((project) => this.toEntity(project.toProps())),
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(entity: ProjectEntity): Project {
    return Project.fromProps({
      id: entity.id,
      name: entity.name,
      spaceId: entity.spaceId,
      parentId: entity.parentId,
      position: entity.position,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(props: Readonly<ProjectProps>): ProjectEntity {
    const entity = new ProjectEntity();
    entity.id = props.id;
    entity.name = props.name;
    entity.spaceId = props.spaceId;
    entity.parentId = props.parentId;
    entity.position = props.position;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;
    return entity;
  }
}
