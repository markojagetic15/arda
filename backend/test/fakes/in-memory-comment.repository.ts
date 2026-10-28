import { Comment } from '../../src/domain/comment/comment.model.js';
import { CommentRepository } from '../../src/domain/comment/comment.repository.js';

export class InMemoryCommentRepository extends CommentRepository {
  private readonly comments = new Map<string, Comment>();

  async findById(id: string): Promise<Comment | null> {
    return this.comments.get(id) ?? null;
  }

  async findByPageId(pageId: string): Promise<Comment[]> {
    return [...this.comments.values()]
      .filter((comment) => comment.pageId === pageId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment);
  }
}
