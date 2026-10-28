export class SpaceNotFoundError extends Error {
  constructor() {
    super('Space not found');
    this.name = 'SpaceNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super('Project not found');
    this.name = 'ProjectNotFoundError';
  }
}

export class PageNotFoundError extends Error {
  constructor() {
    super('Page not found');
    this.name = 'PageNotFoundError';
  }
}

export class InvalidMoveError extends Error {
  constructor(message = 'Cannot move a node into its own subtree') {
    super(message);
    this.name = 'InvalidMoveError';
  }
}

export class UnsupportedOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}
