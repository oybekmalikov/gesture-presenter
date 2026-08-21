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

export interface ParticipantInfo {
  socketId: string;
  userId?: string;
  username: string;
  avatarUrl?: string;
  role?: string;
  isPresenter: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  joinedAt: string;
}

export interface JoinRoomPayload {
  seminarId: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  isPresenter?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
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

export interface WebRTCSignalPayload {
  targetSocketId: string;
  callerSocketId?: string;
  signal?: any;
  candidate?: any;
  offer?: any;
  answer?: any;
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

  /** seminarId -> Map<socketId, ParticipantInfo> */
  private readonly roomParticipants = new Map<string, Map<string, ParticipantInfo>>();

  /** socketId -> seminarId */
  private readonly socketRoomMap = new Map<string, string>();

  /** seminarId -> Current Active File ID */
  private readonly roomActiveFile = new Map<string, string>();

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
    const seminarId = this.socketRoomMap.get(client.id);
    if (seminarId) {
      this.leaveSeminarRoom(client, seminarId);
      this.socketRoomMap.delete(client.id);
    }
    this.logger.debug(`Client disconnected from /live: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const {
      seminarId,
      userId,
      username,
      avatarUrl,
      role,
      isPresenter,
      audioEnabled,
      videoEnabled,
    } = payload;
    if (!seminarId) return;

    const roomName = `seminar_${seminarId}`;
    client.join(roomName);
    this.socketRoomMap.set(client.id, seminarId);

    const participant: ParticipantInfo = {
      socketId: client.id,
      userId,
      username: username || 'Mehmon',
      avatarUrl,
      role: role || 'user',
      isPresenter: Boolean(isPresenter),
      audioEnabled: audioEnabled !== false,
      videoEnabled: videoEnabled !== false,
      joinedAt: new Date().toISOString(),
    };

    if (!this.roomParticipants.has(seminarId)) {
      this.roomParticipants.set(seminarId, new Map());
    }
    const participantsMap = this.roomParticipants.get(seminarId)!;

    // Get list of existing participants BEFORE adding new one (to send to joining user)
    const existingParticipants = Array.from(participantsMap.values());

    // Add new participant
    participantsMap.set(client.id, participant);
    const viewerCount = participantsMap.size;

    // 1. Send existing participants list & state to the new participant
    const cachedSlide = this.roomSlideState.get(seminarId);
    const cached3d = this.room3dState.get(seminarId);
    const activeFileId = this.roomActiveFile.get(seminarId);

    client.emit('room_participants', {
      participants: existingParticipants,
      self: participant,
      currentSlide: cachedSlide || null,
      current3dState: cached3d || null,
      activeFileId: activeFileId || null,
    });

    // 2. Notify other room participants about the new user
    client.to(roomName).emit('user_joined', participant);

    // 3. Notify room about updated count
    this.server.to(roomName).emit('viewer_count_updated', {
      seminarId,
      viewerCount,
    });

    this.logger.log(
      `👤 User "${participant.username}" (${participant.isPresenter ? 'PRESENTER' : 'VIEWER'}) joined room "${roomName}" (Total: ${viewerCount})`,
    );

    return {
      success: true,
      viewerCount,
      participant,
      currentSlide: cachedSlide || null,
      current3dState: cached3d || null,
    };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { seminarId?: string },
  ) {
    const seminarId = payload?.seminarId || this.socketRoomMap.get(client.id);
    if (seminarId) {
      this.leaveSeminarRoom(client, seminarId);
      this.socketRoomMap.delete(client.id);
    }
  }

  // ==================== WEBRTC SIGNALING (ZOOM MESH) ====================

  @SubscribeMessage('signal_offer')
  handleSignalOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    const { targetSocketId, offer } = payload;
    if (!targetSocketId || !offer) return;

    this.server.to(targetSocketId).emit('signal_offer', {
      callerSocketId: client.id,
      offer,
    });
  }

  @SubscribeMessage('signal_answer')
  handleSignalAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    const { targetSocketId, answer } = payload;
    if (!targetSocketId || !answer) return;

    this.server.to(targetSocketId).emit('signal_answer', {
      callerSocketId: client.id,
      answer,
    });
  }

  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    const { targetSocketId, candidate } = payload;
    if (!targetSocketId || !candidate) return;

    this.server.to(targetSocketId).emit('ice_candidate', {
      callerSocketId: client.id,
      candidate,
    });
  }

  @SubscribeMessage('toggle_media')
  handleToggleMedia(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      seminarId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
    },
  ) {
    const { seminarId, audioEnabled, videoEnabled } = payload;
    if (!seminarId) return;

    const participantsMap = this.roomParticipants.get(seminarId);
    if (participantsMap && participantsMap.has(client.id)) {
      const p = participantsMap.get(client.id)!;
      p.audioEnabled = audioEnabled;
      p.videoEnabled = videoEnabled;
    }

    const roomName = `seminar_${seminarId}`;
    client.to(roomName).emit('user_media_changed', {
      socketId: client.id,
      audioEnabled,
      videoEnabled,
    });
  }

  // ==================== PRESENTATION SYNC (AUTHOR-ONLY) ====================

  @SubscribeMessage('file_changed')
  handleFileChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { seminarId: string; fileId: string; fileType?: string },
  ) {
    const { seminarId, fileId } = payload;
    if (!seminarId || !fileId) return;

    const participantsMap = this.roomParticipants.get(seminarId);
    const sender = participantsMap?.get(client.id);
    if (!sender?.isPresenter) {
      this.logger.warn(`Non-presenter socket ${client.id} attempted to change file in room ${seminarId}`);
      return { success: false, error: 'Only the presenter can change files' };
    }

    this.roomActiveFile.set(seminarId, fileId);
    const roomName = `seminar_${seminarId}`;

    client.to(roomName).emit('file_changed', payload);
    return { success: true };
  }

  @SubscribeMessage('sync_slide')
  handleSyncSlide(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SlideSyncPayload,
  ) {
    const { seminarId, fileId, slideIndex } = payload;
    if (!seminarId || fileId === undefined || slideIndex === undefined) return;

    const participantsMap = this.roomParticipants.get(seminarId);
    const sender = participantsMap?.get(client.id);
    if (!sender?.isPresenter) {
      this.logger.warn(`Non-presenter socket ${client.id} attempted to sync slide in room ${seminarId}`);
      return { success: false, error: 'Only the presenter can control slides' };
    }

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

    const participantsMap = this.roomParticipants.get(seminarId);
    const sender = participantsMap?.get(client.id);
    if (!sender?.isPresenter) {
      this.logger.warn(`Non-presenter socket ${client.id} attempted to sync 3D state in room ${seminarId}`);
      return { success: false, error: 'Only the presenter can control 3D state' };
    }

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

  // ==================== CHAT & REACTIONS ====================

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
    this.roomActiveFile.delete(seminarId);
    this.roomParticipants.delete(seminarId);
  }

  /**
   * Helper method to broadcast live seminar status change from HTTP service
   */
  broadcastLiveStateChange(seminarId: string, isLive: boolean, meta?: any) {
    const roomName = `seminar_${seminarId}`;
    if (this.server) {
      this.server.to(roomName).emit('live_state_changed', {
        seminarId,
        isLive,
        meta,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private leaveSeminarRoom(
    client: Socket,
    seminarId: string,
  ) {
    const roomName = `seminar_${seminarId}`;
    client.leave(roomName);

    const participantsMap = this.roomParticipants.get(seminarId);
    let leftUser: ParticipantInfo | undefined;

    if (participantsMap) {
      leftUser = participantsMap.get(client.id);
      participantsMap.delete(client.id);
      const viewerCount = participantsMap.size;

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
      socketId: client.id,
      userId: leftUser?.userId,
      username: leftUser?.username || 'Mehmon',
      leftAt: new Date().toISOString(),
    });
  }
}
