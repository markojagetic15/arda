import { beforeEach, describe, expect, it } from 'vitest';

import { CommentAnchorType } from '../../../domain/comment/comment-anchor-type.js';
import { User } from '../../../domain/user/user.model.js';
import { InMemoryCommentRepository } from '../../../../test/fakes/in-memory-comment.repository.js';
import { InMemoryUserRepository } from '../../../../test/fakes/in-memory-user.repository.js';
import { CreateCommentUseCase } from './create-comment.use-case.js';

describe('CreateCommentUseCase', () => {
  let commentRepository: InMemoryCommentRepository;
  let userRepository: InMemoryUserRepository;
  let useCase: CreateCommentUseCase;

  beforeEach(async () => {
    commentRepository = new InMemoryCommentRepository();
    userRepository = new InMemoryUserRepository();
    useCase = new CreateCommentUseCase(commentRepository, userRepository);

    await userRepository.save(
      User.create({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hash',
      }),
    );
  });

  it('creates a comment with the author name denormalized from the user record', async () => {
    const comment = await useCase.execute({
      pageId: 'page-1',
      authorId: 'user-1',
      anchorType: CommentAnchorType.KANBAN_CARD,
      anchorId: 'card-1',
      body: '  looks good  ',
    });

    expect(comment.authorName).toBe('Alice');
    expect(comment.body).toBe('looks good');
    expect(comment.resolved).toBe(false);

    const stored = await commentRepository.findByPageId('page-1');
    expect(stored).toHaveLength(1);
    expect(stored[0]!.id).toBe(comment.id);
  });

  it('falls back to "Unknown" when the author no longer exists', async () => {
    const comment = await useCase.execute({
      pageId: 'page-1',
      authorId: 'ghost',
      anchorType: CommentAnchorType.TEXT,
      anchorId: 'mark-1',
      body: 'hi',
    });

    expect(comment.authorName).toBe('Unknown');
  });
});
