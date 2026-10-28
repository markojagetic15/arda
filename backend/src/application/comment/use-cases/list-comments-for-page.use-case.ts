import { Injectable } from '@nestjs/common';

import { Comment } from '../../../domain/comment/comment.model.js';
import { CommentRepository } from '../../../domain/comment/comment.repository.js';

@Injectable()
export class ListCommentsForPageUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(pageId: string): Promise<Comment[]> {
    return this.commentRepository.findByPageId(pageId);
  }
}
