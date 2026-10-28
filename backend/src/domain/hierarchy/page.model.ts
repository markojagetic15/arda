import { PageType } from './page-type.js';

export interface PageProps {
  id: string;
  title: string;
  type: PageType;
  projectId: string;
  parentId: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Page {
  private constructor(private props: PageProps) {}

  static create(props: {
    id: string;
    title: string;
    type?: PageType;
    projectId: string;
    parentId: string | null;
    position: number;
  }): Page {
    const now = new Date();
    return new Page({
      ...props,
      type: props.type ?? PageType.DOCUMENT,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: PageProps): Page {
    return new Page(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get type(): PageType {
    return this.props.type;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get position(): number {
    return this.props.position;
  }

  rename(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  moveTo(projectId: string, parentId: string | null, position: number): void {
    this.props.projectId = projectId;
    this.props.parentId = parentId;
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  reorder(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  toProps(): Readonly<PageProps> {
    return { ...this.props };
  }
}
