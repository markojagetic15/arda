import { beforeEach, describe, expect, it } from 'vitest';

import { CommentAnchorType } from '../../../domain/comment/comment-anchor-type.js';
import { Comment } from '../../../domain/comment/comment.model.js';
import { InMemoryCommentRepository } from '../../../../test/fakes/in-memory-comment.repository.js';
import { ListCommentsForPageUseCase } from './list-comments-for-page.use-case.js';

describe('ListCommentsForPageUseCase', () => {
  let commentRepository: InMemoryCommentRepository;
  let useCase: ListCommentsForPageUseCase;

  beforeEach(() => {
    commentRepository = new InMemoryCommentRepository();
    useCase = new ListCommentsForPageUseCase(commentRepository);
  });

  it('only returns comments for the requested page', async () => {
    await commentRepository.save(
      Comment.create({
        id: 'comment-1',
        pageId: 'page-1',
        anchorType: CommentAnchorType.TEXT,
        anchorId: 'mark-1',
        authorId: 'user-1',
        authorName: 'Alice',
        body: 'on page 1',
      }),
    );
    await commentRepository.save(
      Comment.create({
        id: 'comment-2',
        pageId: 'page-2',
        anchorType: CommentAnchorType.TEXT,
        anchorId: 'mark-2',
        authorId: 'user-1',
        authorName: 'Alice',
        body: 'on page 2',
      }),
    );

    const comments = await useCase.execute('page-1');

    expect(comments).toHaveLength(1);
    expect(comments[0]!.id).toBe('comment-1');
  });
});
