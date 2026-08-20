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

export interface JoinRoomPayload {
  seminarId: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
}

export interface ChatMessagePayload {
  seminarId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
}

export interface SlideSyncPayload {
  seminarId: string;
  fileId: string;
  slideIndex: number;
  totalSlides?: number;
  presenterId?: string;
}

export interface ThreeDStateSyncPayload {
  seminarId: string;
  fileId: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  rotation?: [number, number, number];
  exploded?: boolean;
  selectedPart?: string;
}

export interface ReactionPayload {
  seminarId: string;
  userId?: string;
  username?: string;
  reaction: 'like' | 'clap' | 'heart' | 'hand' | 'fire' | 'idea';
}

export interface LaserPointerPayload {
  seminarId: string;
  x: number;
  y: number;
  visible: boolean;
  color?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/live',
})
export class LiveGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveGateway.name);

  /** seminarId -> Set of socket IDs */
  private readonly roomParticipants = new Map<string, Set<string>>();

  /** socketId -> User and Room metadata */
  private readonly socketUserMap = new Map<
    string,
    {
      seminarId: string;
      userId?: string;
      username?: string;
      avatarUrl?: string;
      role?: string;
    }
  >();

  /** seminarId -> Current Slide State Cache */
  private readonly roomSlideState = new Map<string, SlideSyncPayload>();

  /** seminarId -> Current 3D State Cache */
  private readonly room3dState = new Map<string, ThreeDStateSyncPayload>();

  afterInit() {
    this.logger.log('📡 Live WebSocket Gateway initialized on /live namespace');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected to /live: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.socketUserMap.get(client.id);
    if (userInfo) {
      const { seminarId, username } = userInfo;
      this.leaveSeminarRoom(client, seminarId, username);
      this.socketUserMap.delete(client.id);
    }
    this.logger.debug(`Client disconnected from /live: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { seminarId, userId, username, avatarUrl, role } = payload;
    if (!seminarId) return;

    const roomName = `seminar_${seminarId}`;
    client.join(roomName);

    // Save mapping
    this.socketUserMap.set(client.id, {
      seminarId,
      userId,
      username: username || 'Mehmon',
      avatarUrl,
      role,
    });

    // Update room participants set
    if (!this.roomParticipants.has(seminarId)) {
      this.roomParticipants.set(seminarId, new Set());
    }
    this.roomParticipants.get(seminarId)!.add(client.id);

    const viewerCount = this.roomParticipants.get(seminarId)!.size;

    // Notify room about updated count
    this.server.to(roomName).emit('viewer_count_updated', {
      seminarId,
      viewerCount,
    });

    // Notify others about user join
    client.to(roomName).emit('user_joined', {
      userId,
      username: username || 'Mehmon',
      avatarUrl,
      role,
      joinedAt: new Date().toISOString(),
    });

    // Send cached current slide / 3D state to newly connected client
    const cachedSlide = this.roomSlideState.get(seminarId);
    if (cachedSlide) {
      client.emit('slide_changed', cachedSlide);
    }

    const cached3d = this.room3dState.get(seminarId);
    if (cached3d) {
      client.emit('3d_state_changed', cached3d);
    }

    this.logger.log(
      `👤 User "${username || 'Mehmon'}" joined room "${roomName}" (Total: ${viewerCount})`,
    );

    return {
      success: true,
      viewerCount,
      currentSlide: cachedSlide || null,
      current3dState: cached3d || null,
    };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { seminarId: string },
  ) {
    const userInfo = this.socketUserMap.get(client.id);
    const seminarId = payload.seminarId || userInfo?.seminarId;
    if (seminarId) {
      this.leaveSeminarRoom(client, seminarId, userInfo?.username);
      this.socketUserMap.delete(client.id);
    }
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatMessagePayload,
  ) {
    const { seminarId, userId, username, avatarUrl, message } = payload;
    if (!seminarId || !message || !message.trim()) return;

    const roomName = `seminar_${seminarId}`;
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      seminarId,
      userId,
      username: username || 'Foydalanuvchi',
      avatarUrl,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    // Broadcast to everyone in room including sender
    this.server.to(roomName).emit('new_message', chatMessage);
    return chatMessage;
  }

  @SubscribeMessage('send_like')
  handleSendLike(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { seminarId: string; userId?: string },
  ) {
    const { seminarId, userId } = payload;
    if (!seminarId) return;

    const roomName = `seminar_${seminarId}`;
    this.server.to(roomName).emit('like_received', {
      seminarId,
      userId,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('send_reaction')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReactionPayload,
  ) {
    const { seminarId, userId, username, reaction } = payload;
    if (!seminarId || !reaction) return;

    const roomName = `seminar_${seminarId}`;
    this.server.to(roomName).emit('reaction_received', {
      seminarId,
      userId,
      username: username || 'Ishtirokchi',
      reaction,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('sync_slide')
  handleSyncSlide(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SlideSyncPayload,
  ) {
    const { seminarId, fileId, slideIndex } = payload;
    if (!seminarId || fileId === undefined || slideIndex === undefined) return;

    // Cache state
    this.roomSlideState.set(seminarId, payload);

    const roomName = `seminar_${seminarId}`;
    // Broadcast to all viewers
    client.to(roomName).emit('slide_changed', payload);
    return { success: true };
  }

  @SubscribeMessage('sync_3d_state')
  handleSync3D(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ThreeDStateSyncPayload,
  ) {
    const { seminarId } = payload;
    if (!seminarId) return;

    // Cache 3D state
    this.room3dState.set(seminarId, payload);

    const roomName = `seminar_${seminarId}`;
    // Broadcast to all viewers
    client.to(roomName).emit('3d_state_changed', payload);
    return { success: true };
  }

  @SubscribeMessage('laser_pointer')
  handleLaserPointer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LaserPointerPayload,
  ) {
    const { seminarId } = payload;
    if (!seminarId) return;

    const roomName = `seminar_${seminarId}`;
    client.to(roomName).emit('laser_pointer_moved', payload);
  }

  @SubscribeMessage('end_live_session')
  handleEndLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { seminarId: string },
  ) {
    const { seminarId } = payload;
    if (!seminarId) return;

    const roomName = `seminar_${seminarId}`;
    this.server.to(roomName).emit('session_ended', {
      seminarId,
      message: 'Jonli seminar ma`ruzachi tomonidan yakunlandi.',
      endedAt: new Date().toISOString(),
    });

    // Clear caches
    this.roomSlideState.delete(seminarId);
    this.room3dState.delete(seminarId);
    this.roomParticipants.delete(seminarId);
  }

  /**
   * Helper method to broadcast live seminar status change from HTTP service
   */
  broadcastLiveStateChange(seminarId: string, isLive: boolean, meta?: any) {
    const roomName = `seminar_${seminarId}`;
    this.server.to(roomName).emit('live_state_changed', {
      seminarId,
      isLive,
      meta,
      timestamp: new Date().toISOString(),
    });
  }

  private leaveSeminarRoom(
    client: Socket,
    seminarId: string,
    username?: string,
  ) {
    const roomName = `seminar_${seminarId}`;
    client.leave(roomName);

    const participants = this.roomParticipants.get(seminarId);
    if (participants) {
      participants.delete(client.id);
      const viewerCount = participants.size;

      if (viewerCount === 0) {
        this.roomParticipants.delete(seminarId);
      } else {
        this.server.to(roomName).emit('viewer_count_updated', {
          seminarId,
          viewerCount,
        });
      }
    }

    client.to(roomName).emit('user_left', {
      username: username || 'Mehmon',
      leftAt: new Date().toISOString(),
    });
  }
}
