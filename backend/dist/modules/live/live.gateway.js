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
var LiveGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let LiveGateway = LiveGateway_1 = class LiveGateway {
    server;
    logger = new common_1.Logger(LiveGateway_1.name);
    roomParticipants = new Map();
    socketUserMap = new Map();
    roomSlideState = new Map();
    room3dState = new Map();
    afterInit() {
        this.logger.log('📡 Live WebSocket Gateway initialized on /live namespace');
    }
    handleConnection(client) {
        this.logger.debug(`Client connected to /live: ${client.id}`);
    }
    handleDisconnect(client) {
        const userInfo = this.socketUserMap.get(client.id);
        if (userInfo) {
            const { seminarId, username } = userInfo;
            this.leaveSeminarRoom(client, seminarId, username);
            this.socketUserMap.delete(client.id);
        }
        this.logger.debug(`Client disconnected from /live: ${client.id}`);
    }
    handleJoinRoom(client, payload) {
        const { seminarId, userId, username, avatarUrl, role } = payload;
        if (!seminarId)
            return;
        const roomName = `seminar_${seminarId}`;
        client.join(roomName);
        this.socketUserMap.set(client.id, {
            seminarId,
            userId,
            username: username || 'Mehmon',
            avatarUrl,
            role,
        });
        if (!this.roomParticipants.has(seminarId)) {
            this.roomParticipants.set(seminarId, new Set());
        }
        this.roomParticipants.get(seminarId).add(client.id);
        const viewerCount = this.roomParticipants.get(seminarId).size;
        this.server.to(roomName).emit('viewer_count_updated', {
            seminarId,
            viewerCount,
        });
        client.to(roomName).emit('user_joined', {
            userId,
            username: username || 'Mehmon',
            avatarUrl,
            role,
            joinedAt: new Date().toISOString(),
        });
        const cachedSlide = this.roomSlideState.get(seminarId);
        if (cachedSlide) {
            client.emit('slide_changed', cachedSlide);
        }
        const cached3d = this.room3dState.get(seminarId);
        if (cached3d) {
            client.emit('3d_state_changed', cached3d);
        }
        this.logger.log(`👤 User "${username || 'Mehmon'}" joined room "${roomName}" (Total: ${viewerCount})`);
        return {
            success: true,
            viewerCount,
            currentSlide: cachedSlide || null,
            current3dState: cached3d || null,
        };
    }
    handleLeaveRoom(client, payload) {
        const userInfo = this.socketUserMap.get(client.id);
        const seminarId = payload.seminarId || userInfo?.seminarId;
        if (seminarId) {
            this.leaveSeminarRoom(client, seminarId, userInfo?.username);
            this.socketUserMap.delete(client.id);
        }
    }
    handleSendMessage(client, payload) {
        const { seminarId, userId, username, avatarUrl, message } = payload;
        if (!seminarId || !message || !message.trim())
            return;
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
        this.server.to(roomName).emit('new_message', chatMessage);
        return chatMessage;
    }
    handleSendLike(client, payload) {
        const { seminarId, userId } = payload;
        if (!seminarId)
            return;
        const roomName = `seminar_${seminarId}`;
        this.server.to(roomName).emit('like_received', {
            seminarId,
            userId,
            timestamp: Date.now(),
        });
    }
    handleReaction(client, payload) {
        const { seminarId, userId, username, reaction } = payload;
        if (!seminarId || !reaction)
            return;
        const roomName = `seminar_${seminarId}`;
        this.server.to(roomName).emit('reaction_received', {
            seminarId,
            userId,
            username: username || 'Ishtirokchi',
            reaction,
            timestamp: Date.now(),
        });
    }
    handleSyncSlide(client, payload) {
        const { seminarId, fileId, slideIndex } = payload;
        if (!seminarId || fileId === undefined || slideIndex === undefined)
            return;
        this.roomSlideState.set(seminarId, payload);
        const roomName = `seminar_${seminarId}`;
        client.to(roomName).emit('slide_changed', payload);
        return { success: true };
    }
    handleSync3D(client, payload) {
        const { seminarId } = payload;
        if (!seminarId)
            return;
        this.room3dState.set(seminarId, payload);
        const roomName = `seminar_${seminarId}`;
        client.to(roomName).emit('3d_state_changed', payload);
        return { success: true };
    }
    handleLaserPointer(client, payload) {
        const { seminarId } = payload;
        if (!seminarId)
            return;
        const roomName = `seminar_${seminarId}`;
        client.to(roomName).emit('laser_pointer_moved', payload);
    }
    handleEndLive(client, payload) {
        const { seminarId } = payload;
        if (!seminarId)
            return;
        const roomName = `seminar_${seminarId}`;
        this.server.to(roomName).emit('session_ended', {
            seminarId,
            message: 'Jonli seminar ma`ruzachi tomonidan yakunlandi.',
            endedAt: new Date().toISOString(),
        });
        this.roomSlideState.delete(seminarId);
        this.room3dState.delete(seminarId);
        this.roomParticipants.delete(seminarId);
    }
    broadcastLiveStateChange(seminarId, isLive, meta) {
        const roomName = `seminar_${seminarId}`;
        this.server.to(roomName).emit('live_state_changed', {
            seminarId,
            isLive,
            meta,
            timestamp: new Date().toISOString(),
        });
    }
    leaveSeminarRoom(client, seminarId, username) {
        const roomName = `seminar_${seminarId}`;
        client.leave(roomName);
        const participants = this.roomParticipants.get(seminarId);
        if (participants) {
            participants.delete(client.id);
            const viewerCount = participants.size;
            if (viewerCount === 0) {
                this.roomParticipants.delete(seminarId);
            }
            else {
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
};
exports.LiveGateway = LiveGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LiveGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_like'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleSendLike", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_reaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sync_slide'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleSyncSlide", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sync_3d_state'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleSync3D", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('laser_pointer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleLaserPointer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end_live_session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleEndLive", null);
exports.LiveGateway = LiveGateway = LiveGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/live',
    })
], LiveGateway);
//# sourceMappingURL=live.gateway.js.map