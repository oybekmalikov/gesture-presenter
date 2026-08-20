import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly socketUserMap;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleAuthenticate(client: Socket, payload: {
        userId: string;
    }): {
        success: boolean;
        room: string;
    } | undefined;
    sendNotificationToUser(userId: string, notification: any): void;
    broadcastAnnouncement(announcement: any): void;
}
