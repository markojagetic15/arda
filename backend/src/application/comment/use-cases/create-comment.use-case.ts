import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { CommentAnchorType } from '../../../domain/comment/comment-anchor-type.js';
import { Comment } from '../../../domain/comment/comment.model.js';
import { CommentRepository } from '../../../domain/comment/comment.repository.js';
import { UserRepository } from '../../../domain/user/user.repository.js';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: {
    pageId: string;
    authorId: string;
    anchorType: CommentAnchorType;
    anchorId: string;
    body: string;
  }): Promise<Comment> {
    const author = await this.userRepository.findById(input.authorId);
    const comment = Comment.create({
      id: randomUUID(),
      pageId: input.pageId,
      anchorType: input.anchorType,
      anchorId: input.anchorId,
      authorId: input.authorId,
      authorName: author?.name ?? 'Unknown',
      body: input.body.trim(),
    });
    await this.commentRepository.save(comment);
    return comment;
  }
}
