export interface SpaceProps {
  id: string;
  name: string;
  ownerId: string;
  parentId: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Space {
  private constructor(private props: SpaceProps) {}

  static create(props: {
    id: string;
    name: string;
    ownerId: string;
    position: number;
  }): Space {
    const now = new Date();
    return new Space({
      ...props,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: SpaceProps): Space {
    return new Space(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get ownerId(): string {
    return this.props.ownerId;
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

  reorder(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  toProps(): Readonly<SpaceProps> {
    return { ...this.props };
  }
}
