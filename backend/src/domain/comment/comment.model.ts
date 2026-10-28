import { CommentAnchorType } from './comment-anchor-type.js';

export interface CommentProps {
  id: string;
  pageId: string;
  anchorType: CommentAnchorType;
  anchorId: string;
  authorId: string;
  authorName: string;
  body: string;
  resolved: boolean;
  createdAt: Date;
}

/**
 * All comments sharing one (pageId, anchorType, anchorId) form a single flat,
 * chronological thread - there is no separate "thread" entity. `resolved`
 * only carries meaning on a thread's first (earliest) comment; see the
 * frontend's `isThreadResolved`.
 */
export class Comment {
  private constructor(private props: CommentProps) {}

  static create(props: {
    id: string;
    pageId: string;
    anchorType: CommentAnchorType;
    anchorId: string;
    authorId: string;
    authorName: string;
    body: string;
  }): Comment {
    return new Comment({ ...props, resolved: false, createdAt: new Date() });
  }

  static fromProps(props: CommentProps): Comment {
    return new Comment(props);
  }

  get id(): string {
    return this.props.id;
  }

  get pageId(): string {
    return this.props.pageId;
  }

  get anchorType(): CommentAnchorType {
    return this.props.anchorType;
  }

  get anchorId(): string {
    return this.props.anchorId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get authorName(): string {
    return this.props.authorName;
  }

  get body(): string {
    return this.props.body;
  }

  get resolved(): boolean {
    return this.props.resolved;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  setResolved(resolved: boolean): void {
    this.props.resolved = resolved;
  }

  toProps(): Readonly<CommentProps> {
    return { ...this.props };
  }
}
