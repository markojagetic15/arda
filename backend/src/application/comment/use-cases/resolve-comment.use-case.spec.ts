import { beforeEach, describe, expect, it } from 'vitest';

import { CommentAnchorType } from '../../../domain/comment/comment-anchor-type.js';
import { CommentNotFoundError } from '../../../domain/comment/comment.errors.js';
import { Comment } from '../../../domain/comment/comment.model.js';
import { InMemoryCommentRepository } from '../../../../test/fakes/in-memory-comment.repository.js';
import { ResolveCommentUseCase } from './resolve-comment.use-case.js';

describe('ResolveCommentUseCase', () => {
  let commentRepository: InMemoryCommentRepository;
  let useCase: ResolveCommentUseCase;

  beforeEach(async () => {
    commentRepository = new InMemoryCommentRepository();
    useCase = new ResolveCommentUseCase(commentRepository);

    await commentRepository.save(
      Comment.create({
        id: 'comment-1',
        pageId: 'page-1',
        anchorType: CommentAnchorType.CANVAS_SHAPE,
        anchorId: 'shape-1',
        authorId: 'user-1',
        authorName: 'Alice',
        body: 'fix this',
      }),
    );
  });

  it('marks a comment resolved', async () => {
    const comment = await useCase.execute({
      pageId: 'page-1',
      commentId: 'comment-1',
      resolved: true,
    });

    expect(comment.resolved).toBe(true);
    const [stored] = await commentRepository.findByPageId('page-1');
    expect(stored!.resolved).toBe(true);
  });

  it('can reopen an already-resolved comment', async () => {
    await useCase.execute({
      pageId: 'page-1',
      commentId: 'comment-1',
      resolved: true,
    });
    const reopened = await useCase.execute({
      pageId: 'page-1',
      commentId: 'comment-1',
      resolved: false,
    });

    expect(reopened.resolved).toBe(false);
  });

  it('throws when the comment belongs to a different page', async () => {
    await expect(
      useCase.execute({
        pageId: 'other-page',
        commentId: 'comment-1',
        resolved: true,
      }),
    ).rejects.toThrow(CommentNotFoundError);
  });

  it('throws when the comment does not exist', async () => {
    await expect(
      useCase.execute({
        pageId: 'page-1',
        commentId: 'missing',
        resolved: true,
      }),
    ).rejects.toThrow(CommentNotFoundError);
  });
});
