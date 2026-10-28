import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { RoomManagerService } from '../../../application/collaboration/room-manager.service.js';
import { CreateCommentUseCase } from '../../../application/comment/use-cases/create-comment.use-case.js';
import { ListCommentsForPageUseCase } from '../../../application/comment/use-cases/list-comments-for-page.use-case.js';
import { ResolveCommentUseCase } from '../../../application/comment/use-cases/resolve-comment.use-case.js';
import { AccessService } from '../../../application/access/access.service.js';
import { hasRole, type Role } from '../../../domain/access/role.js';
import { TokenService } from '../../../application/auth/ports/token.service.js';
import type { Comment } from '../../../domain/comment/comment.model.js';
import type { CommentAnchorType } from '../../../domain/comment/comment-anchor-type.js';
import type { AuthenticatedUser } from '../../http/auth/types/authenticated-user.js';

function roomName(pageId: string): string {
  return `page:${pageId}`;
}

function toCommentDto(comment: Comment) {
  const props = comment.toProps();
  return {
    id: props.id,
    pageId: props.pageId,
    anchorType: props.anchorType,
    anchorId: props.anchorId,
    authorId: props.authorId,
    authorName: props.authorName,
    body: props.body,
    resolved: props.resolved,
    createdAt: props.createdAt.toISOString(),
  };
}

@WebSocketGateway({
  namespace: '/collaboration',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomManager: RoomManagerService,
    private readonly tokenService: TokenService,
    private readonly access: AccessService,
    private readonly createComment: CreateCommentUseCase,
    private readonly listCommentsForPage: ListCommentsForPageUseCase,
    private readonly resolveComment: ResolveCommentUseCase,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.emit('error', { message: 'Missing access token' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
      } satisfies AuthenticatedUser;
    } catch {
      client.emit('error', { message: 'Invalid or expired access token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const pageId = client.data.pageId as string | undefined;
    if (!pageId) return;

    const removalUpdate = this.roomManager.leaveRoom(pageId, client.id);
    if (removalUpdate) {
      client
        .to(roomName(pageId))
        .emit('awareness-update', Buffer.from(removalUpdate));
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { pageId: string },
  ): Promise<void> {
    const user = client.data.user as AuthenticatedUser | undefined;
    if (!user) return;

    const role = await this.access.roleForPage(user.userId, body.pageId);
    if (!role) {
      client.emit('error', { message: 'Page not found' });
      return;
    }

    const previousPageId = client.data.pageId as string | undefined;
    if (previousPageId && previousPageId !== body.pageId) {
      await this.leave(client, previousPageId);
    }

    client.data.pageId = body.pageId;
    client.data.role = role;
    await client.join(roomName(body.pageId));
    await this.roomManager.joinRoom(body.pageId, client.id);

    client.emit(
      'sync-state',
      Buffer.from(this.roomManager.getStateUpdate(body.pageId)),
    );
    client.emit(
      'awareness-state',
      Buffer.from(this.roomManager.getAwarenessUpdate(body.pageId)),
    );

    const comments = await this.listCommentsForPage.execute(body.pageId);
    client.emit('comments-state', comments.map(toCommentDto));
  }

  /**
   * Re-sends the page's comments. Clients ask once their comment listener is
   * attached: the copy sent with the join reply can arrive before the page's
   * UI (and so the listener) exists, and would otherwise be lost.
   */
  @SubscribeMessage('comments-request')
  async handleCommentsRequest(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const pageId = client.data.pageId as string | undefined;
    if (!pageId) return; // not joined yet - the join reply includes the comments
    const comments = await this.listCommentsForPage.execute(pageId);
    client.emit('comments-state', comments.map(toCommentDto));
  }

  @SubscribeMessage('comment-create')
  async handleCommentCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { anchorType: CommentAnchorType; anchorId: string; body: string },
  ): Promise<void> {
    const pageId = client.data.pageId as string | undefined;
    const user = client.data.user as AuthenticatedUser | undefined;
    if (!pageId || !user || !body.body.trim()) return;
    if (!hasRole(client.data.role as Role, 'comment')) {
      client.emit('error', { message: "You can't comment on this page" });
      return;
    }

    const comment = await this.createComment.execute({
      pageId,
      authorId: user.userId,
      anchorType: body.anchorType,
      anchorId: body.anchorId,
      body: body.body,
    });
    this.server
      .to(roomName(pageId))
      .emit('comment-created', toCommentDto(comment));
  }

  @SubscribeMessage('comment-resolve')
  async handleCommentResolve(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { commentId: string; resolved: boolean },
  ): Promise<void> {
    const pageId = client.data.pageId as string | undefined;
    if (!pageId || !hasRole(client.data.role as Role, 'comment')) return;

    try {
      const comment = await this.resolveComment.execute({
        pageId,
        commentId: body.commentId,
        resolved: body.resolved,
      });
      this.server.to(roomName(pageId)).emit('comment-resolved', {
        id: comment.id,
        resolved: comment.resolved,
      });
    } catch {
      client.emit('error', { message: 'Comment not found' });
    }
  }

  @SubscribeMessage('sync-update')
  handleSyncUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: Buffer,
  ): void {
    const pageId = client.data.pageId as string | undefined;
    // Viewers and commenters get the document but can't change it; their
    // clients are read-only, and anything they send anyway is dropped here.
    if (!pageId || !hasRole(client.data.role as Role, 'edit')) return;
    client.to(roomName(pageId)).emit('sync-update', update);
    this.roomManager.applyLocalSyncUpdate(pageId, new Uint8Array(update));
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() update: Buffer,
  ): void {
    const pageId = client.data.pageId as string | undefined;
    if (!pageId) return;
    client.to(roomName(pageId)).emit('awareness-update', update);
    this.roomManager.applyLocalAwarenessUpdate(
      pageId,
      new Uint8Array(update),
      client.id,
    );
  }

  private async leave(client: Socket, pageId: string): Promise<void> {
    await client.leave(roomName(pageId));
    const removalUpdate = this.roomManager.leaveRoom(pageId, client.id);
    if (removalUpdate) {
      client
        .to(roomName(pageId))
        .emit('awareness-update', Buffer.from(removalUpdate));
    }
  }
}
