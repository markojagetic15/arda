import type { Comment } from './comment.model.js';

export abstract class CommentRepository {
  abstract findById(id: string): Promise<Comment | null>;
  abstract findByPageId(pageId: string): Promise<Comment[]>;
  abstract save(comment: Comment): Promise<void>;
}
