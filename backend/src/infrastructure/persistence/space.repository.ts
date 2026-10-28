import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { Space, type SpaceProps } from '../../domain/hierarchy/space.model.js';
import { SpaceRepository } from '../../domain/hierarchy/space.repository.js';
import { SpaceEntity } from './space.entity.js';

@Injectable()
export class TypeOrmSpaceRepository extends SpaceRepository {
  constructor(
    @InjectRepository(SpaceEntity)
    private readonly repository: Repository<SpaceEntity>,
  ) {
    super();
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Space | null> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<Space | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Space[]> {
    if (ids.length === 0) return [];
    const entities = await this.repository.find({ where: { id: In(ids) } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findRootSiblings(ownerId: string): Promise<Space[]> {
    const entities = await this.repository.find({
      where: { ownerId, parentId: IsNull() },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllForOwner(ownerId: string): Promise<Space[]> {
    const entities = await this.repository.find({
      where: { ownerId },
      order: { position: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(space: Space): Promise<void> {
    await this.repository.save(this.toEntity(space.toProps()));
  }

  async saveMany(spaces: Space[]): Promise<void> {
    await this.repository.save(
      spaces.map((space) => this.toEntity(space.toProps())),
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  private toDomain(entity: SpaceEntity): Space {
    return Space.fromProps({
      id: entity.id,
      name: entity.name,
      ownerId: entity.ownerId,
      parentId: entity.parentId,
      position: entity.position,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(props: Readonly<SpaceProps>): SpaceEntity {
    const entity = new SpaceEntity();
    entity.id = props.id;
    entity.name = props.name;
    entity.ownerId = props.ownerId;
    entity.parentId = props.parentId;
    entity.position = props.position;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;
    return entity;
  }
}
