export interface ProjectProps {
  id: string;
  name: string;
  spaceId: string;
  parentId: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  private constructor(private props: ProjectProps) {}

  static create(props: {
    id: string;
    name: string;
    spaceId: string;
    position: number;
  }): Project {
    const now = new Date();
    return new Project({
      ...props,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: ProjectProps): Project {
    return new Project(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get position(): number {
    return this.props.position;
  }

  rename(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  moveToSpace(spaceId: string, position: number): void {
    this.props.spaceId = spaceId;
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  reorder(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  toProps(): Readonly<ProjectProps> {
    return { ...this.props };
  }
}
