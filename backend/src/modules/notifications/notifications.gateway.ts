import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly socketUserMap = new Map<string, string>(); // socketId -> userId

  afterInit() {
    this.logger.log('🔔 Notifications WebSocket Gateway initialized on /notifications');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected to /notifications: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      client.leave(`user_${userId}`);
      this.socketUserMap.delete(client.id);
    }
    this.logger.debug(`Client disconnected from /notifications: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    if (!payload?.userId) return;

    const userRoom = `user_${payload.userId}`;
    client.join(userRoom);
    this.socketUserMap.set(client.id, payload.userId);

    this.logger.log(`🔔 User authenticated for notifications: ${payload.userId}`);
    return { success: true, room: userRoom };
  }

  /**
   * Send notification to a specific user in real-time
   */
  sendNotificationToUser(userId: string, notification: any) {
    if (!userId || !this.server) return;
    const userRoom = `user_${userId}`;
    this.server.to(userRoom).emit('notification_received', notification);
    this.logger.debug(`Sent real-time notification to ${userRoom}`);
  }

  /**
   * Broadcast a system-wide announcement to all connected users
   */
  broadcastAnnouncement(announcement: any) {
    if (!this.server) return;
    this.server.emit('system_announcement', announcement);
  }
}
