"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../../database/entities/user.entity");
const response_1 = require("../../common/response");
let AuthService = class AuthService {
    userRepo;
    jwtService;
    config;
    constructor(userRepo, jwtService, config) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.config = config;
    }
    async login(username, password) {
        const user = await this.userRepo.findOne({ where: { username } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.LOGIN_FAILED);
        }
        if (!user.isActive) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_INACTIVE);
        }
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.LOGIN_FAILED);
        }
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);
        const tokens = await this.generateTokens(user);
        const { passwordHash: _, ...profile } = user;
        return (0, response_1.successResponse)({ ...tokens, user: profile }, response_1.MESSAGES.LOGIN_SUCCESS);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.config.get('JWT_SECRET', 'okmk_jwt_secret_dev_2026'),
            });
            const user = await this.userRepo.findOne({ where: { id: payload.sub } });
            if (!user || !user.isActive) {
                return (0, response_1.errorResponse)(response_1.MESSAGES.UNAUTHORIZED);
            }
            const tokens = await this.generateTokens(user);
            return (0, response_1.successResponse)(tokens, response_1.MESSAGES.TOKEN_REFRESHED);
        }
        catch {
            return (0, response_1.errorResponse)(response_1.MESSAGES.TOKEN_EXPIRED);
        }
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: {
                department: true,
                subDepartment: true,
                position: true,
            },
        });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        const { passwordHash, ...profile } = user;
        return (0, response_1.successResponse)(profile, response_1.MESSAGES.FETCHED);
    }
    async changePassword(userId, oldPass, newPass) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        const match = await bcrypt.compare(oldPass, user.passwordHash);
        if (!match) {
            return (0, response_1.errorResponse)({
                uz: "Eski parol noto'g'ri",
                ru: 'Старый пароль неверен',
            });
        }
        user.passwordHash = await bcrypt.hash(newPass, 12);
        await this.userRepo.save(user);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.UPDATED);
    }
    async validateUser(payload) {
        return this.userRepo.findOne({ where: { id: payload.sub } });
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };
        const secret = this.config.get('JWT_SECRET', 'okmk_jwt_secret_dev_2026');
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret,
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map