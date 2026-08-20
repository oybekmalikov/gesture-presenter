import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export declare class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly roomParticipants;
    private readonly socketUserMap;
    private readonly roomSlideState;
    private readonly room3dState;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, payload: JoinRoomPayload): {
        success: boolean;
        viewerCount: number;
        currentSlide: SlideSyncPayload | null;
        current3dState: ThreeDStateSyncPayload | null;
    } | undefined;
    handleLeaveRoom(client: Socket, payload: {
        seminarId: string;
    }): void;
    handleSendMessage(client: Socket, payload: ChatMessagePayload): {
        id: string;
        seminarId: string;
        userId: string;
        username: string;
        avatarUrl: string | undefined;
        message: string;
        createdAt: string;
    } | undefined;
    handleSendLike(client: Socket, payload: {
        seminarId: string;
        userId?: string;
    }): void;
    handleReaction(client: Socket, payload: ReactionPayload): void;
    handleSyncSlide(client: Socket, payload: SlideSyncPayload): {
        success: boolean;
    } | undefined;
    handleSync3D(client: Socket, payload: ThreeDStateSyncPayload): {
        success: boolean;
    } | undefined;
    handleLaserPointer(client: Socket, payload: LaserPointerPayload): void;
    handleEndLive(client: Socket, payload: {
        seminarId: string;
    }): void;
    broadcastLiveStateChange(seminarId: string, isLive: boolean, meta?: any): void;
    private leaveSeminarRoom;
}
