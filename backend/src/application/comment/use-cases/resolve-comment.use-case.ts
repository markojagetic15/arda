import { Injectable } from '@nestjs/common';

import { CommentNotFoundError } from '../../../domain/comment/comment.errors.js';
import { Comment } from '../../../domain/comment/comment.model.js';
import { CommentRepository } from '../../../domain/comment/comment.repository.js';

@Injectable()
export class ResolveCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(input: {
    pageId: string;
    commentId: string;
    resolved: boolean;
  }): Promise<Comment> {
    const comment = await this.commentRepository.findById(input.commentId);
    if (!comment || comment.pageId !== input.pageId) {
      throw new CommentNotFoundError();
    }
    comment.setResolved(input.resolved);
    await this.commentRepository.save(comment);
    return comment;
  }
}
