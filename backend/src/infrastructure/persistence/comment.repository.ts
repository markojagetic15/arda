import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comment, type CommentProps } from '../../domain/comment/comment.model.js';
import { CommentRepository } from '../../domain/comment/comment.repository.js';
import { CommentEntity } from './comment.entity.js';

@Injectable()
export class TypeOrmCommentRepository extends CommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Comment | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPageId(pageId: string): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { pageId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(comment: Comment): Promise<void> {
    await this.repository.save(this.toEntity(comment.toProps()));
  }

  private toDomain(entity: CommentEntity): Comment {
    return Comment.fromProps({
      id: entity.id,
      pageId: entity.pageId,
      anchorType: entity.anchorType,
      anchorId: entity.anchorId,
      authorId: entity.authorId,
      authorName: entity.authorName,
      body: entity.body,
      resolved: entity.resolved,
      createdAt: entity.createdAt,
    });
  }

  private toEntity(props: Readonly<CommentProps>): CommentEntity {
    const entity = new CommentEntity();
    entity.id = props.id;
    entity.pageId = props.pageId;
    entity.anchorType = props.anchorType;
    entity.anchorId = props.anchorId;
    entity.authorId = props.authorId;
    entity.authorName = props.authorName;
    entity.body = props.body;
    entity.resolved = props.resolved;
    entity.createdAt = props.createdAt;
    return entity;
  }
}
