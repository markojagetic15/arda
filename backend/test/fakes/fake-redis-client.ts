type Handler = (...args: unknown[]) => void;

/**
 * A minimal ioredis stand-in covering only what RoomManagerService touches:
 * duplicate() for the subscriber connection, publish(), and the
 * pmessageBuffer event used to simulate messages arriving from Redis
 * (i.e. from another server instance).
 */
export class FakeRedisClient {
  public published: { channel: string; message: Buffer }[] = [];
  private readonly handlers = new Map<string, Handler[]>();
  public quitCalled = false;

  duplicate(): FakeRedisClient {
    return this;
  }

  async psubscribe(..._patterns: string[]): Promise<void> {}

  on(event: string, handler: Handler): this {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
    return this;
  }

  async publish(channel: string, message: Buffer): Promise<number> {
    this.published.push({ channel, message });
    return 1;
  }

  async quit(): Promise<void> {
    this.quitCalled = true;
  }

  /** Test helper — simulates a message published by another instance. */
  emitRemoteMessage(channel: string, message: Buffer): void {
    for (const handler of this.handlers.get('pmessageBuffer') ?? []) {
      handler('pattern', Buffer.from(channel), message);
    }
  }
}
