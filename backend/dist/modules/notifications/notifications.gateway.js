"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    socketUserMap = new Map();
    afterInit() {
        this.logger.log('🔔 Notifications WebSocket Gateway initialized on /notifications');
    }
    handleConnection(client) {
        this.logger.debug(`Client connected to /notifications: ${client.id}`);
    }
    handleDisconnect(client) {
        const userId = this.socketUserMap.get(client.id);
        if (userId) {
            client.leave(`user_${userId}`);
            this.socketUserMap.delete(client.id);
        }
        this.logger.debug(`Client disconnected from /notifications: ${client.id}`);
    }
    handleAuthenticate(client, payload) {
        if (!payload?.userId)
            return;
        const userRoom = `user_${payload.userId}`;
        client.join(userRoom);
        this.socketUserMap.set(client.id, payload.userId);
        this.logger.log(`🔔 User authenticated for notifications: ${payload.userId}`);
        return { success: true, room: userRoom };
    }
    sendNotificationToUser(userId, notification) {
        if (!userId || !this.server)
            return;
        const userRoom = `user_${userId}`;
        this.server.to(userRoom).emit('notification_received', notification);
        this.logger.debug(`Sent real-time notification to ${userRoom}`);
    }
    broadcastAnnouncement(announcement) {
        if (!this.server)
            return;
        this.server.emit('system_announcement', announcement);
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleAuthenticate", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/notifications',
    })
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map